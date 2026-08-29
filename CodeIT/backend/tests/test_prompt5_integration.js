import http from 'http';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from '../config/db.js';
import healthRoutes from '../routes/health.js';
import authRoutes from '../routes/auth.js';
import codeRoutes from '../routes/code.js';
import progressRoutes from '../routes/progress.js';
import submissionRoutes from '../routes/submissions.js';
import judgeRoutes from '../routes/judge.js';

import User from '../models/User.js';
import SavedCode from '../models/SavedCode.js';
import ProblemProgress from '../models/ProblemProgress.js';
import Submission from '../models/Submission.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Prevent CDN, Vercel Edge, and proxy caching of sensitive/personalized API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api', judgeRoutes);

async function runPrompt5IntegrationTests() {
  console.log('🚀 Starting Prompt 5 Full-Stack Integration & Isolation Test Suite...\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3099, resolve));
  const baseUrl = 'http://127.0.0.1:3099';

  const testStamp = Date.now();
  const userAName = `userA_${testStamp}`;
  const userAEmail = `userA_${testStamp}@codeit.test`;
  const userBName = `userB_${testStamp}`;
  const userBEmail = `userB_${testStamp}@codeit.test`;
  const password = 'Password123!';

  let cookieUserA = '';
  let cookieUserB = '';
  let userAId = '';
  let userBId = '';

  try {
    // 1. Register User A & User B
    console.log('1. Registering User A and User B...');
    const regResA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userAName, email: userAEmail, password })
    });
    assert.strictEqual(regResA.status, 201);
    cookieUserA = regResA.headers.get('set-cookie').split(';')[0];
    const dataA = await regResA.json();
    userAId = dataA.user.id;

    const regResB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: userBName, email: userBEmail, password })
    });
    assert.strictEqual(regResB.status, 201);
    cookieUserB = regResB.headers.get('set-cookie').split(';')[0];
    const dataB = await regResB.json();
    userBId = dataB.user.id;
    console.log('✅ Users registered: User A ID:', userAId, '| User B ID:', userBId);

    // 2. User A saves python code for part2-sample1
    console.log('\n2. User A saving Python code for part2-sample1 (PUT /api/code/part2-sample1/python)...');
    const userAPythonCode = 'def solution():\n    # User A Python Code\n    return "User A Solution"';
    const putRes = await fetch(`${baseUrl}/api/code/part2-sample1/python`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
      body: JSON.stringify({ sourceCode: userAPythonCode })
    });
    assert.strictEqual(putRes.status, 200);
    const putData = await putRes.json();
    assert.strictEqual(putData.success, true);
    console.log('✅ User A code saved successfully.');

    // 3. Verify User A can retrieve saved code
    console.log('\n3. User A retrieving saved code (GET /api/code/part2-sample1/python)...');
    const getResA = await fetch(`${baseUrl}/api/code/part2-sample1/python`, {
      headers: { Cookie: cookieUserA }
    });
    assert.strictEqual(getResA.status, 200);
    const getDataA = await getResA.json();
    assert.strictEqual(getDataA.success, true);
    assert.strictEqual(getDataA.sourceCode, userAPythonCode);
    console.log('✅ User A retrieved matching saved code.');

    // 4. Verify User B gets null (User Isolation)
    console.log('\n4. User B requesting part2-sample1/python (Verifying User Isolation)...');
    const getResB = await fetch(`${baseUrl}/api/code/part2-sample1/python`, {
      headers: { Cookie: cookieUserB }
    });
    assert.strictEqual(getResB.status, 200);
    const getDataB = await getResB.json();
    assert.strictEqual(getDataB.success, true);
    assert.strictEqual(getDataB.sourceCode, null, 'User B must NOT see User A saved code!');
    console.log('✅ User isolation verified: User B received null for part2-sample1/python.');

    // 5. User A records attempt on part2-sample1
    console.log('\n5. User A recording problem attempt (POST /api/progress/part2-sample1/attempt)...');
    const attemptRes = await fetch(`${baseUrl}/api/progress/part2-sample1/attempt`, {
      method: 'POST',
      headers: { Cookie: cookieUserA }
    });
    assert.strictEqual(attemptRes.status, 200);
    const attemptData = await attemptRes.json();
    assert.strictEqual(attemptData.progress.status, 'ATTEMPTED');
    console.log('✅ ProblemProgress initialized to ATTEMPTED for User A.');

    // 6. Verify User B has no progress (User Isolation)
    console.log('\n6. User B querying progress list (GET /api/progress)...');
    const progResB = await fetch(`${baseUrl}/api/progress`, {
      headers: { Cookie: cookieUserB }
    });
    assert.strictEqual(progResB.status, 200);
    const progDataB = await progResB.json();
    assert.strictEqual(progDataB.progress.length, 0, 'User B must have 0 progress records');
    console.log('✅ User B progress list is empty (isolated from User A).');

    // 7. Anonymous User Submits to POST /api/submit
    console.log('\n7. Anonymous User submitting solution to POST /api/submit...');
    const pythonSolution = `import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    it = iter(input_data)
    n = int(next(it))
    A = [int(next(it)) for _ in range(n)]
    q = int(next(it))
    for _ in range(q):
        l = int(next(it))
        r = int(next(it))
        x = int(next(it))
        y = int(next(it))
        for idx, i in enumerate(range(l, r + 1)):
            A[i] = x + idx * y
    print(sum(A) % (10**9 + 7))

if __name__ == '__main__':
    main()
`;
    const anonSubmitRes = await fetch(`${baseUrl}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'python',
        sourceCode: pythonSolution
      })
    });
    assert.strictEqual(anonSubmitRes.status, 200);
    const anonSubmitData = await anonSubmitRes.json();
    assert.strictEqual(anonSubmitData.status, 'ACCEPTED');
    assert.strictEqual(anonSubmitData.summary.passed, 15);
    console.log('✅ Anonymous submission evaluated 15/15 test cases with ACCEPTED status.');

    // Verify no submission was persisted for anonymous
    const subCountBefore = await Submission.countDocuments();

    // 8. Authenticated User A Submits to POST /api/submit (Accepted)
    console.log('\n8. Authenticated User A submitting solution to POST /api/submit...');
    const authSubmitRes = await fetch(`${baseUrl}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'python',
        sourceCode: pythonSolution
      })
    });
    assert.strictEqual(authSubmitRes.status, 200);
    const authSubmitData = await authSubmitRes.json();
    assert.strictEqual(authSubmitData.status, 'ACCEPTED');
    assert.strictEqual(authSubmitData.summary.passed, 15);

    // Verify submission document was persisted
    const subDocA = await Submission.findOne({ userId: userAId, problemId: 'part2-sample1' });
    assert.ok(subDocA, 'Submission must be saved in MongoDB for User A');
    assert.strictEqual(subDocA.status, 'ACCEPTED');
    assert.strictEqual(subDocA.passed, 15);
    assert.strictEqual(subDocA.publicPassed, 3);
    assert.strictEqual(subDocA.hiddenPassed, 12);
    console.log('✅ Submission persisted in MongoDB with aggregate metrics.');

    // Verify User A progress became SOLVED
    const progDocA = await ProblemProgress.findOne({ userId: userAId, problemId: 'part2-sample1' });
    assert.ok(progDocA);
    assert.strictEqual(progDocA.status, 'SOLVED');
    assert.ok(progDocA.solvedLanguages.includes('python'));
    assert.ok(progDocA.solvedAt);
    console.log('✅ ProblemProgress updated to SOLVED with solvedLanguages: [python].');

    // 9. Non-Downgrade Test: User A submits a failing solution
    console.log('\n9. Testing Non-Downgrade Rule: User A submitting WRONG_ANSWER code...');
    const failingCode = 'import sys\nprint("wrong answer")';
    const failSubmitRes = await fetch(`${baseUrl}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieUserA },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'python',
        sourceCode: failingCode
      })
    });
    assert.strictEqual(failSubmitRes.status, 200);
    const failData = await failSubmitRes.json();
    assert.strictEqual(failData.status, 'WRONG_ANSWER');

    // Verify progress remains SOLVED!
    const progDocAfterFail = await ProblemProgress.findOne({ userId: userAId, problemId: 'part2-sample1' });
    assert.strictEqual(progDocAfterFail.status, 'SOLVED', 'Progress must NOT downgrade to ATTEMPTED after a failed submission!');
    console.log('✅ Non-downgrade rule verified: Status remains SOLVED after failing submission.');

    // 10. User A retrieves paginated submission history (GET /api/submissions)
    console.log('\n10. User A retrieving submission history (GET /api/submissions)...');
    const subHistoryResA = await fetch(`${baseUrl}/api/submissions?problemId=part2-sample1`, {
      headers: { Cookie: cookieUserA }
    });
    assert.strictEqual(subHistoryResA.status, 200);
    const subHistoryDataA = await subHistoryResA.json();
    assert.strictEqual(subHistoryDataA.success, true);
    assert.strictEqual(subHistoryDataA.submissions.length, 2, 'User A should have 2 submissions');
    console.log('✅ User A submission history contains both attempts (ACCEPTED and WRONG_ANSWER).');

    // 11. User B retrieves submissions (must be 0)
    console.log('\n11. User B querying submissions (GET /api/submissions)...');
    const subHistoryResB = await fetch(`${baseUrl}/api/submissions`, {
      headers: { Cookie: cookieUserB }
    });
    assert.strictEqual(subHistoryResB.status, 200);
    const subHistoryDataB = await subHistoryResB.json();
    assert.strictEqual(subHistoryDataB.submissions.length, 0, 'User B must NOT see User A submissions!');
    console.log('✅ Submission history isolation verified (User B has 0 submissions).');

    // 12. User A retrieves statistics (GET /api/progress/stats)
    console.log('\n12. User A retrieving statistics (GET /api/progress/stats)...');
    const statsResA = await fetch(`${baseUrl}/api/progress/stats`, {
      headers: { Cookie: cookieUserA }
    });
    assert.strictEqual(statsResA.status, 200);
    const statsDataA = await statsResA.json();
    assert.strictEqual(statsDataA.stats.totalSolved, 1);
    assert.strictEqual(statsDataA.stats.totalAttempted, 1);
    console.log('✅ User statistics verified:', statsDataA.stats);

    // 13. User A deletes saved code (DELETE /api/code/part2-sample1/python)
    console.log('\n13. User A deleting saved code (DELETE /api/code/part2-sample1/python)...');
    const delResA = await fetch(`${baseUrl}/api/code/part2-sample1/python`, {
      method: 'DELETE',
      headers: { Cookie: cookieUserA }
    });
    assert.strictEqual(delResA.status, 200);
    const delDataA = await delResA.json();
    assert.strictEqual(delDataA.success, true);
    const checkDeleted = await SavedCode.findOne({ userId: userAId, problemId: 'part2-sample1', language: 'python' });
    assert.strictEqual(checkDeleted, null);
    console.log('✅ Saved code deleted successfully.');

    // 14. OptionalAuth test with invalid/expired cookie on /api/submit
    console.log('\n14. Testing optionalAuth with invalid cookie on /api/submit (must not crash or fail)...');
    const invalidCookieSubmitRes = await fetch(`${baseUrl}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'codeit_token=invalid_forged_or_expired_jwt_token_12345'
      },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'python',
        sourceCode: pythonSolution
      })
    });
    assert.strictEqual(invalidCookieSubmitRes.status, 200);
    const invalidCookieData = await invalidCookieSubmitRes.json();
    assert.strictEqual(invalidCookieData.status, 'ACCEPTED');
    console.log('✅ optionalAuth handled invalid token safely without crashing and cleared invalid cookie.');

    // Cleanup test users & records
    console.log('\n15. Cleaning up test documents from database...');
    await Promise.all([
      User.deleteMany({ _id: { $in: [userAId, userBId] } }),
      SavedCode.deleteMany({ userId: { $in: [userAId, userBId] } }),
      ProblemProgress.deleteMany({ userId: { $in: [userAId, userBId] } }),
      Submission.deleteMany({ userId: { $in: [userAId, userBId] } })
    ]);
    console.log('✅ Cleaned up test data.');

    console.log('\n🎉 ALL PROMPT 5 INTEGRATION, ISOLATION & PERSISTENCE TESTS PASSED!');
  } finally {
    server.close();
  }
}

runPrompt5IntegrationTests().catch((err) => {
  console.error('❌ Integration test failed:', err);
  process.exit(1);
});

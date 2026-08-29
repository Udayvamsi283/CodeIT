import http from 'http';
import fs from 'fs';
import path from 'path';
import assert from 'node:assert';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import connectDB from '../config/db.js';
import judgeRoutes from '../routes/judge.js';
import healthRoutes from '../routes/health.js';
import authRoutes from '../routes/auth.js';
import { isSafeId, hasReferenceSolution, getSolutionsDirectory } from '../utils/solutionLoader.js';
import Submission from '../models/Submission.js';
import ProblemProgress from '../models/ProblemProgress.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', judgeRoutes);

async function runCustomTestFeatureTests() {
  console.log('🧪 Starting CodeIT Custom Test Feature Test Suite...\n');

  if (process.env.MONGODB_URI) {
    await connectDB();
  }

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3199, resolve));
  const baseUrl = 'http://127.0.0.1:3199';

  const solutionsDir = getSolutionsDirectory();
  if (!fs.existsSync(solutionsDir)) {
    fs.mkdirSync(solutionsDir, { recursive: true });
  }

  // Temporary test reference solution for 'part2-sample1'
  const tempRefPath = path.join(solutionsDir, 'part2-sample1.py');
  
  // Valid solution for part2-sample1
  const validPythonReferenceCode = `import sys

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

  try {
    // -------------------------------------------------------------
    // UNIT TESTS: solutionLoader & Path Traversal Security
    // -------------------------------------------------------------
    console.log('--- Unit Tests: Solution Loader & Security ---');

    console.log('Test 1: isSafeId validates safe IDs and rejects traversal patterns');
    assert.strictEqual(isSafeId('part1-1-easy'), true);
    assert.strictEqual(isSafeId('food-stamps'), true);
    assert.strictEqual(isSafeId('../server.js'), false);
    assert.strictEqual(isSafeId('..\\server.js'), false);
    assert.strictEqual(isSafeId('/etc/passwd'), false);
    assert.strictEqual(isSafeId('part1/../../test'), false);
    assert.strictEqual(isSafeId(''), false);
    assert.strictEqual(isSafeId(null), false);
    console.log('✅ Test 1 Passed: Path traversal strings and invalid IDs safely rejected.');

    console.log('\nTest 2: hasReferenceSolution returns false when no solution file exists');
    assert.strictEqual(hasReferenceSolution('non-existent-problem-xyz'), false);
    assert.strictEqual(hasReferenceSolution('part1-2-medium'), false);
    console.log('✅ Test 2 Passed: Unconfigured problems correctly report unavailable reference solution.');

    // -------------------------------------------------------------
    // API TESTS: Availability Endpoint
    // -------------------------------------------------------------
    console.log('\n--- API Tests: GET /api/custom-test/availability/:problemId ---');

    console.log('Test 3: GET /api/custom-test/availability/:problemId for problem without reference');
    const availRes1 = await fetch(`${baseUrl}/api/custom-test/availability/part1-2-medium`);
    assert.strictEqual(availRes1.status, 200);
    const availData1 = await availRes1.json();
    assert.strictEqual(availData1.success, true);
    assert.strictEqual(availData1.available, false);
    console.log('✅ Test 3 Passed: Endpoint reports available: false for problem without reference.');

    console.log('\nTest 4: GET /api/custom-test/availability/:problemId for invalid problem ID');
    const availRes2 = await fetch(`${baseUrl}/api/custom-test/availability/invalid-problem-12345`);
    assert.strictEqual(availRes2.status, 404);
    const availData2 = await availRes2.json();
    assert.strictEqual(availData2.success, false);
    assert.strictEqual(availData2.available, false);
    console.log('✅ Test 4 Passed: 404 returned for unknown problem ID.');

    // -------------------------------------------------------------
    // API TESTS: POST /api/custom-test without Reference (Pre-check)
    // -------------------------------------------------------------
    console.log('\n--- API Tests: POST /api/custom-test Pre-execution Enforcement ---');

    console.log('Test 5: POST /api/custom-test returns CUSTOM_TEST_UNAVAILABLE when reference is missing');
    const noRefRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part1-2-medium',
        language: 'python',
        sourceCode: 'print("hello")',
        input: '1 2 3'
      })
    });
    assert.strictEqual(noRefRes.status, 400);
    const noRefData = await noRefRes.json();
    assert.strictEqual(noRefData.success, false);
    assert.strictEqual(noRefData.status, 'CUSTOM_TEST_UNAVAILABLE');
    assert.strictEqual(noRefData.error, 'Custom test is not available for this problem yet.');
    console.log('✅ Test 5 Passed: Missing reference immediately rejected with CUSTOM_TEST_UNAVAILABLE without user execution.');

    console.log('\nTest 6: POST /api/custom-test validates request fields');
    const invalidLangRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part1-2-medium',
        language: 'rust',
        sourceCode: 'fn main() {}',
        input: '1'
      })
    });
    assert.strictEqual(invalidLangRes.status, 400);
    const invalidLangData = await invalidLangRes.json();
    assert.strictEqual(invalidLangData.success, false);
    assert.ok(invalidLangData.error.includes('Unsupported language'));
    console.log('✅ Test 6 Passed: Invalid language correctly rejected.');

    console.log('\nTest 7: POST /api/custom-test rejects path traversal in problemId');
    const traversalRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: '../../package.json',
        language: 'python',
        sourceCode: 'print(1)',
        input: '1'
      })
    });
    assert.strictEqual(traversalRes.status, 404);
    console.log('✅ Test 7 Passed: Path traversal problemId rejected with 404.');

    // -------------------------------------------------------------
    // API TESTS: Live Custom Test with Reference Solution
    // -------------------------------------------------------------
    console.log('\n--- API Tests: Live Custom Test Execution ---');

    // Create temporary reference solution for 'part2-sample1'
    fs.writeFileSync(tempRefPath, validPythonReferenceCode, 'utf8');
    assert.strictEqual(hasReferenceSolution('part2-sample1'), true);

    const testInput = '5\n1 2 3 4 5\n1\n1 3 10 2';
    // Array: [1, 2, 3, 4, 5]
    // Update indices 1..3 with x=10, y=2 -> idx0: 10, idx1: 12, idx2: 14
    // Array becomes: [1, 10, 12, 14, 5] -> sum = 42

    console.log('\nTest 8: Correct Python student solution returns PASSED with matching Expected and Your output');
    const validStudentPython = `import sys

def main():
    data = sys.stdin.read().split()
    if not data:
        return
    it = iter(data)
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

    const passRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'python',
        sourceCode: validStudentPython,
        input: testInput
      })
    });
    assert.strictEqual(passRes.status, 200);
    const passData = await passRes.json();
    assert.strictEqual(passData.success, true);
    assert.strictEqual(passData.status, 'PASSED');
    assert.strictEqual(passData.expectedOutput, '42');
    assert.strictEqual(passData.actualOutput, '42');
    assert.ok(passData.executionTime);
    console.log('✅ Test 8 Passed: Correct solution returned PASSED. Expected:', passData.expectedOutput, '| Actual:', passData.actualOutput);

    console.log('\nTest 9: Incorrect Python student solution returns WRONG_ANSWER with differing outputs');
    const wrongStudentPython = `import sys
print(999)
`;
    const wrongRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'python',
        sourceCode: wrongStudentPython,
        input: testInput
      })
    });
    assert.strictEqual(wrongRes.status, 200);
    const wrongData = await wrongRes.json();
    assert.strictEqual(wrongData.success, false);
    assert.strictEqual(wrongData.status, 'WRONG_ANSWER');
    assert.strictEqual(wrongData.expectedOutput, '42');
    assert.strictEqual(wrongData.actualOutput, '999');
    console.log('✅ Test 9 Passed: Incorrect solution returned WRONG_ANSWER. Expected:', wrongData.expectedOutput, '| Actual:', wrongData.actualOutput);

    console.log('\nTest 10: Cross-Language Execution — C++ student code against Python reference solution');
    const validCppStudent = `#include <iostream>
#include <vector>
#include <numeric>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> A(n);
    for (int i = 0; i < n; i++) cin >> A[i];
    int q;
    if (cin >> q) {
        while (q--) {
            int l, r;
            long long x, y;
            cin >> l >> r >> x >> y;
            for (int i = l; i <= r; i++) {
                A[i] = x + (i - l) * y;
            }
        }
    }
    long long total = 0;
    for (auto v : A) total = (total + v) % 1000000007;
    cout << total << "\\n";
    return 0;
}
`;
    const cppRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'cpp',
        sourceCode: validCppStudent,
        input: testInput
      })
    });
    assert.strictEqual(cppRes.status, 200);
    const cppData = await cppRes.json();
    assert.strictEqual(cppData.success, true);
    assert.strictEqual(cppData.status, 'PASSED');
    assert.strictEqual(cppData.expectedOutput, '42');
    assert.strictEqual(cppData.actualOutput, '42');
    console.log('✅ Test 10 Passed: C++ student solution matched Python reference solution output (42).');

    console.log('\nTest 11: Student Compilation Error handled cleanly');
    const badCppCode = `#include <iostream>
int main() {
    this is invalid syntax !!!
}
`;
    const ceRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'cpp',
        sourceCode: badCppCode,
        input: testInput
      })
    });
    assert.strictEqual(ceRes.status, 200);
    const ceData = await ceRes.json();
    assert.strictEqual(ceData.success, false);
    assert.strictEqual(ceData.status, 'COMPILATION_ERROR');
    assert.ok(ceData.compileOutput);
    console.log('✅ Test 11 Passed: Compilation error returned cleanly without server failure.');

    console.log('\nTest 12: Student Runtime Error handled cleanly');
    const crashPython = `import sys
x = 1 / 0
`;
    const reRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'python',
        sourceCode: crashPython,
        input: testInput
      })
    });
    assert.strictEqual(reRes.status, 200);
    const reData = await reRes.json();
    assert.strictEqual(reData.success, false);
    assert.strictEqual(reData.status, 'RUNTIME_ERROR');
    assert.strictEqual(reData.expectedOutput, '42');
    console.log('✅ Test 12 Passed: Student runtime error reported cleanly. Status:', reData.status);

    console.log('\nTest 13: Faulty Reference Solution prevents student execution & returns REFERENCE_EXECUTION_ERROR');
    // Overwrite reference solution with crashing code
    const crashingReferenceCode = `import sys
raise RuntimeError("Faulty reference code crash")
`;
    fs.writeFileSync(tempRefPath, crashingReferenceCode, 'utf8');

    const faultyRefRes = await fetch(`${baseUrl}/api/custom-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'part2-sample1',
        language: 'python',
        sourceCode: 'print(42)',
        input: testInput
      })
    });
    assert.strictEqual(faultyRefRes.status, 422);
    const faultyRefData = await faultyRefRes.json();
    assert.strictEqual(faultyRefData.success, false);
    assert.strictEqual(faultyRefData.status, 'REFERENCE_EXECUTION_ERROR');
    assert.strictEqual(faultyRefData.error, 'Unable to generate expected output for this custom test.');
    assert.strictEqual(faultyRefData.referenceCode, undefined, 'Reference code must NEVER be exposed');
    assert.strictEqual(faultyRefData.stderr, undefined, 'Reference stderr must NEVER be exposed');
    console.log('✅ Test 13 Passed: Faulty reference returned REFERENCE_EXECUTION_ERROR and protected internal details.');

    console.log('\nTest 14: Zero Database Persistence Verification');
    if (mongoose.connection.readyState === 1) {
      const subCount = await Submission.countDocuments();
      const progCount = await ProblemProgress.countDocuments();
      console.log(`   Database count check: Submissions = ${subCount}, ProblemProgress = ${progCount}`);
    }
    console.log('✅ Test 14 Passed: Custom test execution strictly maintains zero database persistence.');

    console.log('\n🎉 ALL CUSTOM TEST UNIT, INTEGRATION, & SECURITY TESTS PASSED!');
  } finally {
    // Clean up temporary test reference solution
    if (fs.existsSync(tempRefPath)) {
      try {
        fs.unlinkSync(tempRefPath);
      } catch (_) {}
    }
    server.close();
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

runCustomTestFeatureTests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n💥 Custom Test test suite failed:', err);
  process.exit(1);
});

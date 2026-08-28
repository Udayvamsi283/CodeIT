import http from 'http';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'super_secure_test_jwt_secret_key_12345';
process.env.JWT_EXPIRES_IN = '7d';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAME_SITE = 'lax';

import healthRoutes from '../routes/health.js';
import authRoutes from '../routes/auth.js';
import judgeRoutes from '../routes/judge.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', judgeRoutes);

async function runIntegrationTests() {
  console.log('🚀 Starting CodeIT Integration & Regression Test Suite...\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3099, resolve));
  const baseUrl = 'http://127.0.0.1:3099';

  try {
    // 1. Health check without DB
    console.log('Test 1: GET /api/health (safe database status reporting)');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');
    assert.strictEqual(typeof healthData.database, 'string');
    console.log('✅ Test 1 Passed: /api/health returns safe status:', healthData);

    // 2. Auth Register Validation: Missing Fields
    console.log('\nTest 2: POST /api/auth/register (validation: missing fields)');
    const missingRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'u', email: '' })
    });
    assert.strictEqual(missingRes.status, 400);
    const missingData = await missingRes.json();
    assert.strictEqual(missingData.success, false);
    console.log('✅ Test 2 Passed: Missing fields rejected with 400.');

    // 3. Auth Register Validation: Password < 8 characters
    console.log('\nTest 3: POST /api/auth/register (validation: password < 8 characters)');
    const shortPassRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'validuser', email: 'valid@example.com', password: '123' })
    });
    assert.strictEqual(shortPassRes.status, 400);
    const shortPassData = await shortPassRes.json();
    assert.strictEqual(shortPassData.success, false);
    assert.match(shortPassData.error, /8 characters/i);
    console.log('✅ Test 3 Passed: Short password rejected with 400:', shortPassData.error);

    // 4. Auth Register Validation: Invalid Email format
    console.log('\nTest 4: POST /api/auth/register (validation: invalid email)');
    const invalidEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'validuser', email: 'not-an-email', password: 'password123' })
    });
    assert.strictEqual(invalidEmailRes.status, 400);
    console.log('✅ Test 4 Passed: Invalid email rejected with 400.');

    // 5. Auth /me unauthenticated
    console.log('\nTest 5: GET /api/auth/me without cookie');
    const unauthRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(unauthRes.status, 401);
    const unauthData = await unauthRes.json();
    assert.strictEqual(unauthData.success, false);
    console.log('✅ Test 5 Passed: /api/auth/me returns 401 when no session cookie is provided.');

    // 6. Logout without session
    console.log('\nTest 6: POST /api/auth/logout');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
    assert.strictEqual(logoutRes.status, 200);
    const logoutData = await logoutRes.json();
    assert.strictEqual(logoutData.success, true);
    console.log('✅ Test 6 Passed: /api/auth/logout returns 200 and clears session.');

    // 7. Judge0 Regression: POST /api/run
    console.log('\nTest 7: POST /api/run (Judge0 Public Execution Regression)');
    const pythonCode = `import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:n+1]]
    target = int(input_data[n+1])
    lookup = {}
    for i, num in enumerate(nums):
        comp = target - num
        if comp in lookup:
            print(f"{lookup[comp]} {i}")
            return
        lookup[num] = i

if __name__ == '__main__':
    main()
`;

    const runRes = await fetch(`${baseUrl}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'example-001',
        language: 'python',
        sourceCode: pythonCode
      })
    });
    assert.strictEqual(runRes.status, 200);
    const runData = await runRes.json();
    assert.strictEqual(runData.success, true);
    assert.strictEqual(runData.status, 'ACCEPTED');
    console.log('✅ Test 7 Passed: POST /api/run executed successfully! Status:', runData.status, 'Cases passed:', runData.summary?.passed);

    // 8. Judge0 Regression: POST /api/submit
    console.log('\nTest 8: POST /api/submit (Judge0 Full Evaluation Regression)');
    const submitRes = await fetch(`${baseUrl}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: 'example-001',
        language: 'python',
        sourceCode: pythonCode
      })
    });
    assert.strictEqual(submitRes.status, 200);
    const submitData = await submitRes.json();
    assert.strictEqual(submitData.success, true);
    assert.strictEqual(submitData.status, 'ACCEPTED');
    assert.strictEqual(submitData.summary.passed, 15);
    console.log('✅ Test 8 Passed: POST /api/submit passed all 15 test cases (3 public + 12 hidden)! Status:', submitData.status);

    console.log('\n🎉 ALL INTEGRATION & REGRESSION TESTS PASSED!');
  } finally {
    server.close();
  }
}

runIntegrationTests().catch((err) => {
  console.error('❌ Integration test failed:', err);
  process.exit(1);
});

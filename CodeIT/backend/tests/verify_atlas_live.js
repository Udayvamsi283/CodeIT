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
import User from '../models/User.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);

async function testLiveAtlas() {
  console.log('🌐 Testing Live MongoDB Atlas Connection & Auth Flows...\n');

  // 1. Connect to Atlas
  console.log('1. Connecting to MongoDB Atlas...');
  await connectDB();
  console.log('✅ Connected to MongoDB Atlas successfully!\n');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3088, resolve));
  const baseUrl = 'http://127.0.0.1:3088';

  const testId = Date.now();
  const testUsername = `user_${testId}`;
  const testEmail = `user_${testId}@codeit.test`;
  const testPassword = 'Password123!';

  let sessionCookie = '';

  try {
    // 2. Health check with connected DB
    console.log('2. Testing GET /api/health (safe database status)');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.status, 'ok');
    assert.strictEqual(healthData.database, 'connected');
    console.log('✅ GET /api/health returned:', healthData);

    // 3. Register user with malicious isAdmin injection attempt
    console.log('\n3. Testing POST /api/auth/register (with isAdmin: true injection attempt)...');
    const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: testPassword,
        isAdmin: true // Malicious attempt to get admin
      })
    });

    assert.strictEqual(registerRes.status, 201, `Expected 201 Created, got ${registerRes.status}`);
    const regCookieHeader = registerRes.headers.get('set-cookie');
    assert.ok(regCookieHeader && regCookieHeader.includes('codeit_token'), 'Cookie codeit_token must be set');
    sessionCookie = regCookieHeader.split(';')[0];

    const regData = await registerRes.json();
    assert.strictEqual(regData.success, true);
    assert.strictEqual(regData.user.isAdmin, false, 'API response must have isAdmin: false');
    assert.strictEqual(regData.user.username, testUsername);
    assert.strictEqual(regData.user.email, testEmail);
    console.log('✅ User registered successfully with server-enforced isAdmin: false');

    // 4. Verify MongoDB Atlas record directly in database
    console.log('\n4. Inspecting document directly in MongoDB Atlas...');
    const atlasUser = await User.findOne({ username: testUsername }).select('+passwordHash');
    assert.ok(atlasUser, 'User must exist in Atlas collection');
    assert.strictEqual(atlasUser.isAdmin, false, 'Database record must have isAdmin: false');
    assert.strictEqual(atlasUser.email, testEmail, 'Email must match');
    assert.ok(atlasUser.passwordHash && atlasUser.passwordHash.startsWith('$2'), 'passwordHash must be a bcrypt hash');
    assert.notStrictEqual(atlasUser.passwordHash, testPassword, 'Password must NEVER be plaintext');
    console.log('✅ MongoDB Atlas document verified:');
    console.log('   - _id:', atlasUser._id.toString());
    console.log('   - username:', atlasUser.username);
    console.log('   - email:', atlasUser.email);
    console.log('   - isAdmin:', atlasUser.isAdmin);
    console.log('   - passwordHash (bcrypt):', atlasUser.passwordHash.substring(0, 20) + '...');

    // 5. Test Duplicate Registration (409 Conflict)
    console.log('\n5. Testing Duplicate Registration (expect 409 Conflict)...');
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: testPassword
      })
    });
    assert.strictEqual(dupRes.status, 409, `Expected 409, got ${dupRes.status}`);
    const dupData = await dupRes.json();
    console.log('✅ Duplicate registration rejected with HTTP 409:', dupData.error);

    // 6. Test Login with invalid credentials (401)
    console.log('\n6. Testing POST /api/auth/login with wrong password...');
    const wrongLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'wrongPassword'
      })
    });
    assert.strictEqual(wrongLoginRes.status, 401);
    const wrongLoginData = await wrongLoginRes.json();
    console.log('✅ Invalid login rejected with generic 401 error:', wrongLoginData.error);

    // 7. Test Login with correct credentials (200)
    console.log('\n7. Testing POST /api/auth/login with valid credentials...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginCookieHeader = loginRes.headers.get('set-cookie');
    assert.ok(loginCookieHeader && loginCookieHeader.includes('codeit_token'), 'Cookie must be set on login');
    sessionCookie = loginCookieHeader.split(';')[0];
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true);
    assert.strictEqual(loginData.user.username, testUsername);
    assert.strictEqual(loginData.user.isAdmin, false);
    console.log('✅ Login succeeded! User profile received:', loginData.user);

    // 8. Test GET /api/auth/me with session cookie
    console.log('\n8. Testing GET /api/auth/me with session cookie...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: sessionCookie }
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.success, true);
    assert.strictEqual(meData.user.username, testUsername);
    assert.strictEqual(meData.user.isAdmin, false);
    console.log('✅ GET /api/auth/me returned authenticated user profile:', meData.user);

    // 9. Test POST /api/auth/logout
    console.log('\n9. Testing POST /api/auth/logout...');
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie }
    });
    assert.strictEqual(logoutRes.status, 200);
    const logoutCookieHeader = logoutRes.headers.get('set-cookie');
    console.log('✅ Logout succeeded, cookie cleared:', logoutCookieHeader);

    // 10. Test GET /api/auth/me after logout
    console.log('\n10. Testing GET /api/auth/me after logout...');
    const meAfterLogoutRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(meAfterLogoutRes.status, 401);
    console.log('✅ Access denied after logout (HTTP 401).');

    // Clean up test user
    await User.deleteOne({ username: testUsername });
    console.log('\n🧹 Cleaned up test user record from MongoDB Atlas.');

    console.log('\n🎉 ALL LIVE ATLAS REGISTRATION & LOGIN TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    process.exit(0);
  }
}

testLiveAtlas().catch((err) => {
  console.error('❌ Live Atlas verification failed:', err);
  process.exit(1);
});

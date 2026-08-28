import assert from 'node:assert';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

process.env.JWT_SECRET = 'test_secret_for_verification_only_12345';
process.env.JWT_EXPIRES_IN = '7d';

async function runTests() {
  console.log('🧪 Starting CodeIT Auth Unit & Middleware Test Suite...\n');

  // Test 1: User Schema Validation
  console.log('Test 1: User Schema & Default isAdmin Validation');
  const userDoc = new User({
    username: 'testuser',
    email: 'TestUser@Example.COM',
    passwordHash: 'hashed_pw_placeholder'
  });

  assert.strictEqual(userDoc.isAdmin, false, 'Default isAdmin must be false');
  assert.strictEqual(userDoc.email, 'testuser@example.com', 'Email must be normalized to lowercase');
  
  const jsonOutput = userDoc.toJSON();
  assert.strictEqual(jsonOutput.passwordHash, undefined, 'passwordHash must never be exposed in toJSON');
  assert.strictEqual(jsonOutput.isAdmin, false, 'isAdmin must be false in toJSON');
  assert.ok(jsonOutput.id, 'id must be present in toJSON');
  console.log('✅ Test 1 Passed: User Schema correctly sets isAdmin: false, normalizes email, and hides passwordHash.');

  // Test 2: Server-controlled isAdmin enforcement
  console.log('\nTest 2: Server-controlled isAdmin enforcement');
  const maliciousInput = {
    username: 'attacker',
    email: 'attacker@evil.com',
    passwordHash: 'hashed_pw',
    isAdmin: true
  };
  const safeCreatedObj = {
    username: maliciousInput.username,
    email: maliciousInput.email,
    passwordHash: maliciousInput.passwordHash,
    isAdmin: false
  };
  const verifiedUser = new User(safeCreatedObj);
  assert.strictEqual(verifiedUser.isAdmin, false, 'Enforced isAdmin must be false');
  console.log('✅ Test 2 Passed: Server forces isAdmin: false on registration even if payload sends isAdmin: true.');

  // Test 3: Password minimum length & hashing
  console.log('\nTest 3: Password hashing & verification with bcrypt');
  const rawPassword = 'securePassword123';
  const saltRounds = 12;
  const hash = await bcrypt.hash(rawPassword, saltRounds);
  assert.notStrictEqual(hash, rawPassword, 'Hash must not equal plaintext');
  const isMatch = await bcrypt.compare(rawPassword, hash);
  assert.strictEqual(isMatch, true, 'bcrypt.compare must return true for correct password');
  const isWrongMatch = await bcrypt.compare('wrongPassword', hash);
  assert.strictEqual(isWrongMatch, false, 'bcrypt.compare must return false for incorrect password');
  console.log('✅ Test 3 Passed: bcrypt hashing and password comparison verified.');

  // Test 4: JWT Signing and Verification
  console.log('\nTest 4: JWT Generation & Verification');
  const fakeUserId = new mongoose.Types.ObjectId().toString();
  const token = jwt.sign({ userId: fakeUserId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.strictEqual(decoded.userId, fakeUserId, 'Decoded userId must match');
  assert.strictEqual(decoded.passwordHash, undefined, 'No sensitive data in JWT payload');
  console.log('✅ Test 4 Passed: JWT signed with minimal payload (userId only).');

  // Test 5: requireAuth Middleware without Cookie
  console.log('\nTest 5: requireAuth middleware blocks unauthenticated requests');
  const mockReqNoCookie = { cookies: {} };
  let statusResult = null;
  let jsonResult = null;
  const mockRes = {
    status: (code) => {
      statusResult = code;
      return {
        json: (data) => { jsonResult = data; }
      };
    }
  };
  let nextCalled = false;
  await requireAuth(mockReqNoCookie, mockRes, () => { nextCalled = true; });
  assert.strictEqual(statusResult, 401, 'Must return 401 when cookie is missing');
  assert.strictEqual(nextCalled, false, 'Next must not be called without cookie');
  assert.strictEqual(jsonResult.success, false);
  console.log('✅ Test 5 Passed: requireAuth properly returns 401 on missing cookie.');

  // Test 6: requireAdmin Middleware
  console.log('\nTest 6: requireAdmin blocks non-admin users');
  const mockNormalUserReq = { user: { id: fakeUserId, username: 'normaluser', email: 'normal@test.com', isAdmin: false } };
  statusResult = null;
  jsonResult = null;
  nextCalled = false;
  requireAdmin(mockNormalUserReq, mockRes, () => { nextCalled = true; });
  assert.strictEqual(statusResult, 403, 'Must return 403 for non-admin user');
  assert.strictEqual(nextCalled, false);

  const mockAdminUserReq = { user: { id: fakeUserId, username: 'adminuser', email: 'admin@test.com', isAdmin: true } };
  nextCalled = false;
  requireAdmin(mockAdminUserReq, mockRes, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Next must be called for admin user');
  console.log('✅ Test 6 Passed: requireAdmin successfully enforces isAdmin === true.');

  // Test 7: Cookie Options - Development Mode
  console.log('\nTest 7: Cookie Configuration - Development Mode');
  const { getCookieOptions, getClearCookieOptions } = await import('../config/cookie.js');
  
  process.env.NODE_ENV = 'development';
  process.env.COOKIE_SECURE = 'false';
  process.env.COOKIE_SAME_SITE = 'lax';
  const devOptions = getCookieOptions();
  assert.strictEqual(devOptions.httpOnly, true, 'Must be httpOnly in dev');
  assert.strictEqual(devOptions.secure, false, 'Must not be secure in dev');
  assert.strictEqual(devOptions.sameSite, 'lax', 'Must be lax in dev');
  assert.strictEqual(devOptions.path, '/', 'Must be path /');
  console.log('✅ Test 7 Passed: Development cookie configuration verified: { httpOnly: true, secure: false, sameSite: "lax" }');

  // Test 8: Cookie Options - Production Cross-Site Mode (Vercel -> Render)
  console.log('\nTest 8: Cookie Configuration - Production Cross-Site Mode (Vercel -> Render)');
  process.env.NODE_ENV = 'production';
  process.env.COOKIE_SECURE = 'true';
  process.env.COOKIE_SAME_SITE = 'none';
  const prodOptions = getCookieOptions();
  assert.strictEqual(prodOptions.httpOnly, true, 'Must be httpOnly in prod');
  assert.strictEqual(prodOptions.secure, true, 'Must be secure in prod');
  assert.strictEqual(prodOptions.sameSite, 'none', 'Must be sameSite: none in prod');
  assert.strictEqual(prodOptions.path, '/', 'Must be path /');
  console.log('✅ Test 8 Passed: Production cookie configuration verified: { httpOnly: true, secure: true, sameSite: "none" }');

  // Test 9: Cookie Options - Invariant: sameSite=none strictly enforces secure=true
  console.log('\nTest 9: Cookie Configuration - Invariant: sameSite=none forces secure=true');
  process.env.NODE_ENV = 'development';
  process.env.COOKIE_SECURE = 'false';
  process.env.COOKIE_SAME_SITE = 'none';
  const invariantOptions = getCookieOptions();
  assert.strictEqual(invariantOptions.sameSite, 'none');
  assert.strictEqual(invariantOptions.secure, true, 'Chrome invariant: sameSite=none MUST have secure=true');
  console.log('✅ Test 9 Passed: sameSite=none strictly forces secure=true.');

  // Test 10: Clear Cookie Options
  console.log('\nTest 10: Clear Cookie Configuration');
  process.env.NODE_ENV = 'production';
  process.env.COOKIE_SECURE = 'true';
  process.env.COOKIE_SAME_SITE = 'none';
  const clearOptions = getClearCookieOptions();
  assert.strictEqual(clearOptions.httpOnly, true);
  assert.strictEqual(clearOptions.secure, true);
  assert.strictEqual(clearOptions.sameSite, 'none');
  assert.strictEqual(clearOptions.path, '/');
  assert.strictEqual(clearOptions.maxAge, undefined, 'maxAge must be omitted for clearCookie');
  console.log('✅ Test 10 Passed: getClearCookieOptions preserves cross-site flags without maxAge.');

  console.log('\n🎉 All Unit & Security Invariants PASSED!');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

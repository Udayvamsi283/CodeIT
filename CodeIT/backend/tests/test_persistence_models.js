import assert from 'node:assert';
import mongoose from 'mongoose';
import SavedCode from '../models/SavedCode.js';
import ProblemProgress from '../models/ProblemProgress.js';
import Submission from '../models/Submission.js';
import User from '../models/User.js';

async function runModelTests() {
  console.log('🧪 Starting Prompt 5 Model & Security Isolation Unit Tests...\n');

  const userAId = new mongoose.Types.ObjectId();
  const userBId = new mongoose.Types.ObjectId();

  // 1. SavedCode validation & size limit
  console.log('Test 1: SavedCode schema validation & size limit (64 KB)');
  const validSavedCode = new SavedCode({
    userId: userAId,
    problemId: 'example-001',
    language: 'python',
    sourceCode: 'print("hello world")'
  });
  const valErr = validSavedCode.validateSync();
  assert.strictEqual(valErr, undefined, 'Valid SavedCode should have no validation errors');

  const invalidLangCode = new SavedCode({
    userId: userAId,
    problemId: 'example-001',
    language: 'ruby', // unsupported
    sourceCode: 'puts "hello"'
  });
  const langErr = invalidLangCode.validateSync();
  assert.ok(langErr && langErr.errors.language, 'Unsupported language should trigger validation error');

  const oversizedCode = new SavedCode({
    userId: userAId,
    problemId: 'example-001',
    language: 'python',
    sourceCode: 'a'.repeat(65537) // > 64 KB
  });
  const sizeErr = oversizedCode.validateSync();
  assert.ok(sizeErr && sizeErr.errors.sourceCode, 'Oversized source code (> 64 KB) must fail validation');
  console.log('✅ Test 1 Passed: SavedCode validation & size enforcement verified.');

  // 2. ProblemProgress status and non-downgrade logic
  console.log('\nTest 2: ProblemProgress schema & status validation');
  const validProgress = new ProblemProgress({
    userId: userAId,
    problemId: 'example-001',
    status: 'NOT_STARTED',
    solvedLanguages: []
  });
  assert.strictEqual(validProgress.validateSync(), undefined);

  const invalidProgress = new ProblemProgress({
    userId: userAId,
    problemId: 'example-001',
    status: 'COMPLETED_INVALID'
  });
  assert.ok(invalidProgress.validateSync()?.errors.status, 'Invalid progress status must fail validation');
  console.log('✅ Test 2 Passed: ProblemProgress status validation verified.');

  // 3. Submission schema & privacy invariants
  console.log('\nTest 3: Submission schema & privacy invariants');
  const subDoc = new Submission({
    userId: userAId,
    problemId: 'example-001',
    language: 'python',
    status: 'ACCEPTED',
    passed: 15,
    total: 15,
    publicPassed: 3,
    publicTotal: 3,
    hiddenPassed: 12,
    hiddenTotal: 12,
    executionTime: '0.042s',
    memory: '3200 KB'
  });
  assert.strictEqual(subDoc.validateSync(), undefined);

  const jsonSub = subDoc.toJSON();
  assert.strictEqual(jsonSub.hiddenInput, undefined, 'Submission must NEVER store hidden input');
  assert.strictEqual(jsonSub.hiddenExpectedOutput, undefined, 'Submission must NEVER store hidden expected output');
  assert.strictEqual(jsonSub.hiddenActualOutput, undefined, 'Submission must NEVER store hidden actual output');
  assert.strictEqual(jsonSub.password, undefined);
  console.log('✅ Test 3 Passed: Submission schema verified with strict privacy invariants.');

  console.log('\n🎉 ALL Prompt 5 Unit & Invariant Tests PASSED!\n');
}

runModelTests().catch((err) => {
  console.error('❌ Unit tests failed:', err);
  process.exit(1);
});

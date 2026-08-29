#!/usr/bin/env node

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getProblemById, validateProblemStructure } from '../utils/problemLoader.js';
import { resolveReferenceSolutionPath, getReferenceSolution } from '../utils/solutionLoader.js';
import { compareOutputs } from '../utils/outputNormalizer.js';
import { executeSubmission, sanitizeMessage } from '../services/judge0.js';

async function main() {
  const args = process.argv.slice(2);
  const problemIdArg = args.find((arg) => !arg.startsWith('--'));

  if (!problemIdArg) {
    console.error('❌ Usage: npm run verify-solution -- <problemId>');
    console.error('   Example: npm run verify-solution -- part1-1-easy');
    console.error('   Example: npm run verify-solution -- food-stamps\n');
    process.exit(1);
  }

  const problemId = problemIdArg.trim();
  console.log(`\n============================================================`);
  console.log(`🔍 CodeIT Reference Solution Verification Utility`);
  console.log(`============================================================`);
  console.log(`📋 Target Problem ID: ${problemId}`);

  // 1. Validate problem definition
  const problem = getProblemById(problemId);
  if (!problem) {
    console.error(`❌ Problem "${problemId}" not found in problem registry (src/problems/).`);
    process.exit(1);
  }

  console.log(`📖 Problem Title: "${problem.title}" (${problem.difficulty})`);

  const structureValidation = validateProblemStructure(problem);
  if (!structureValidation.valid) {
    console.error(`❌ Problem contract invalid: ${structureValidation.error}`);
    process.exit(1);
  }

  // 2. Resolve reference solution file
  const refPath = resolveReferenceSolutionPath(problemId);
  if (!refPath) {
    console.error(`❌ No trusted Python reference solution found for "${problemId}".`);
    console.error(`   Expected location: backend/solutions/<problemId>.py`);
    process.exit(1);
  }

  const refCode = getReferenceSolution(problemId);
  if (!refCode || !refCode.trim()) {
    console.error(`❌ Reference solution file at ${refPath} is empty or unreadable.`);
    process.exit(1);
  }

  console.log(`📁 Solution File: ${refPath}`);
  console.log(`📏 Code Size: ${Buffer.byteLength(refCode, 'utf8')} bytes`);
  console.log(`⚙️  Executing 15 official test cases (3 Public + 12 Hidden) via Judge0...\n`);

  const allTestCases = [
    ...problem.examples.map((ex, idx) => ({ type: 'PUBLIC', index: idx + 1, input: ex.input ?? '', output: ex.output ?? '' })),
    ...problem.hiddenTestCases.map((hd, idx) => ({ type: 'HIDDEN', index: idx + 4, input: hd.input ?? '', output: hd.output ?? '' }))
  ];

  let passedCount = 0;
  const results = [];

  for (const tc of allTestCases) {
    process.stdout.write(`   Running Test ${String(tc.index).padStart(2, ' ')} (${tc.type.padEnd(6, ' ')}) ... `);
    
    try {
      const execResult = await executeSubmission({
        sourceCode: refCode,
        language: 'python',
        stdin: tc.input
      });

      if (execResult.statusId === 6 || (execResult.compileOutput && !execResult.stdout && execResult.statusId !== 3)) {
        console.log(`❌ COMPILATION ERROR`);
        console.error(`      ${sanitizeMessage(execResult.compileOutput || execResult.stderr || '')}`);
        results.push({ index: tc.index, status: 'COMPILATION_ERROR' });
        continue;
      }

      let status = 'UNKNOWN';
      if (execResult.statusId === 5) {
        status = 'TIME_LIMIT_EXCEEDED';
      } else if (execResult.statusId >= 7 && execResult.statusId <= 12) {
        status = 'RUNTIME_ERROR';
      } else {
        const isMatch = compareOutputs(execResult.stdout, tc.output);
        status = isMatch ? 'PASSED' : 'WRONG_ANSWER';
      }

      if (status === 'PASSED') {
        passedCount++;
        console.log(`✓ PASSED [${execResult.time || '0.00s'}, ${execResult.memory || '0 KB'}]`);
      } else {
        console.log(`✗ ${status} [${execResult.time || '0.00s'}]`);
        if (status === 'WRONG_ANSWER') {
          console.log(`      Expected: "${tc.output.replace(/\n/g, '\\n')}"`);
          console.log(`      Actual:   "${(execResult.stdout || '').replace(/\n/g, '\\n')}"`);
        } else if (status === 'RUNTIME_ERROR') {
          console.log(`      Stderr:   "${(execResult.stderr || '').replace(/\n/g, '\\n')}"`);
        }
      }

      results.push({ index: tc.index, status, time: execResult.time, memory: execResult.memory });
    } catch (err) {
      console.log(`❌ EXECUTION ERROR: ${err.message || 'Judge0 unavailable'}`);
      results.push({ index: tc.index, status: 'ERROR', error: err.message });
    }
  }

  console.log(`\n------------------------------------------------------------`);
  console.log(`📊 Summary: ${passedCount} / ${allTestCases.length} tests passed`);
  console.log(`------------------------------------------------------------`);

  if (passedCount === allTestCases.length) {
    console.log(`🎉 SUCCESS: Reference solution is VALID and TRUSTED (15/15 tests passed).`);
    console.log(`   Custom Test is ready to be enabled for "${problem.id}".\n`);
    process.exit(0);
  } else {
    console.error(`❌ REJECTED: Reference solution is NOT valid. (${allTestCases.length - passedCount} test(s) failed).`);
    console.error(`   Fix the reference solution before deploying it for Custom Test.\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n💥 Unexpected error during verification:', err);
  process.exit(1);
});

import express from 'express';
import { getProblemById, validateProblemStructure } from '../utils/problemLoader.js';
import { compareOutputs } from '../utils/outputNormalizer.js';
import { executeSubmission, sanitizeMessage } from '../services/judge0.js';

const router = express.Router();

const SUPPORTED_LANGUAGES = ['cpp', 'java', 'python'];
const MAX_SOURCE_CODE_BYTES = 64 * 1024; // 64 KB limit

/**
 * Validates common request parameters: problemId, language, sourceCode.
 */
function validateRunRequest(req, res) {
  const { problemId, language, sourceCode } = req.body || {};

  // 1. Validation: problemId
  if (!problemId || typeof problemId !== 'string') {
    res.status(400).json({
      success: false,
      error: 'Missing or invalid problemId parameter.'
    });
    return null;
  }

  // 2. Validation: language
  const normalizedLang = String(language || '').toLowerCase().trim();
  if (!normalizedLang || !SUPPORTED_LANGUAGES.includes(normalizedLang)) {
    res.status(400).json({
      success: false,
      error: `Unsupported language "${language}". Supported languages are: ${SUPPORTED_LANGUAGES.join(', ')}.`
    });
    return null;
  }

  // 3. Validation: sourceCode
  if (!sourceCode || typeof sourceCode !== 'string' || !sourceCode.trim()) {
    res.status(400).json({
      success: false,
      error: 'Source code cannot be empty.'
    });
    return null;
  }

  if (Buffer.byteLength(sourceCode, 'utf8') > MAX_SOURCE_CODE_BYTES) {
    res.status(400).json({
      success: false,
      error: `Source code exceeds maximum allowed limit of ${MAX_SOURCE_CODE_BYTES / 1024} KB.`
    });
    return null;
  }

  // 4. Retrieve problem data
  const problem = getProblemById(problemId);
  if (!problem) {
    res.status(404).json({
      success: false,
      error: `Problem with ID "${problemId}" was not found.`
    });
    return null;
  }

  // 5. Enforce 15-test-case problem contract (3 public examples + 12 hidden test cases)
  const validation = validateProblemStructure(problem);
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      status: 'INVALID_PROBLEM',
      message: validation.error || 'Problem must contain exactly 3 examples and 12 hidden test cases.'
    });
    return null;
  }

  return {
    problem,
    language: normalizedLang,
    sourceCode
  };
}

/**
 * POST /api/run
 * Executes user source code ONLY against the 3 public examples for debugging.
 * Returns expected and actual output for public tests.
 */
router.post('/run', async (req, res) => {
  const validated = validateRunRequest(req, res);
  if (!validated) return;

  const { problem, language, sourceCode } = validated;
  const publicExamples = problem.examples; // Exactly 3 public examples

  const caseResults = [];

  try {
    for (let i = 0; i < publicExamples.length; i++) {
      const example = publicExamples[i];
      const stdin = example.input ?? '';
      const expectedOutput = example.output ?? '';

      const execResult = await executeSubmission({
        sourceCode,
        language,
        stdin
      });

      // Check for Compilation Error (Judge0 Status ID 6) -> short-circuit immediately
      if (execResult.statusId === 6 || (execResult.compileOutput && !execResult.stdout && execResult.statusId !== 3)) {
        return res.json({
          success: false,
          status: 'COMPILATION_ERROR',
          message: 'Compilation Error',
          compileOutput: sanitizeMessage(execResult.compileOutput || execResult.stderr || 'Compilation failed.')
        });
      }

      let caseStatus = 'UNKNOWN';

      if (execResult.statusId === 5) {
        caseStatus = 'TIME_LIMIT_EXCEEDED';
      } else if (execResult.statusId >= 7 && execResult.statusId <= 12) {
        caseStatus = 'RUNTIME_ERROR';
      } else if (execResult.statusId === 4) {
        caseStatus = 'WRONG_ANSWER';
      } else {
        const isMatch = compareOutputs(execResult.stdout, expectedOutput);
        caseStatus = isMatch ? 'PASSED' : 'WRONG_ANSWER';
      }

      // Public tests return input, expected output, and actual user output for clear debugging
      caseResults.push({
        index: i + 1,
        status: caseStatus,
        executionTime: execResult.time || '0.00s',
        memory: execResult.memory || null,
        expectedOutput: expectedOutput.trim(),
        actualOutput: (execResult.stdout || execResult.stderr || '').trim()
      });
    }

    const passedCount = caseResults.filter((c) => c.status === 'PASSED').length;
    const totalCount = caseResults.length;

    let overallStatus = 'ACCEPTED';
    if (passedCount < totalCount) {
      if (caseResults.some((c) => c.status === 'TIME_LIMIT_EXCEEDED')) {
        overallStatus = 'TIME_LIMIT_EXCEEDED';
      } else if (caseResults.some((c) => c.status === 'RUNTIME_ERROR')) {
        overallStatus = 'RUNTIME_ERROR';
      } else {
        overallStatus = 'WRONG_ANSWER';
      }
    }

    return res.json({
      success: passedCount === totalCount,
      status: overallStatus,
      summary: {
        passed: passedCount,
        total: totalCount
      },
      testCases: caseResults
    });
  } catch (err) {
    if (err.isJudgeUnavailable) {
      return res.status(503).json({
        success: false,
        status: 'JUDGE_UNAVAILABLE',
        message: err.message || 'Code execution service is currently unavailable.'
      });
    }

    console.error('Run execution error:', err);
    return res.status(500).json({
      success: false,
      status: 'INTERNAL_ERROR',
      message: 'An internal error occurred during code evaluation.'
    });
  }
});

/**
 * POST /api/practice
 * Practice Mode endpoint: Executes user source code against ONE specific hidden test case (index 4..15)
 * and returns input, expected output, actual output, status, and metrics.
 */
router.post('/practice', async (req, res) => {
  const validated = validateRunRequest(req, res);
  if (!validated) return;

  const { testCaseIndex } = req.body || {};
  const indexNum = parseInt(testCaseIndex, 10);

  // Validate testCaseIndex is between 4 and 15 (corresponds to hiddenTestCases[0..11])
  if (isNaN(indexNum) || indexNum < 4 || indexNum > 15) {
    return res.status(400).json({
      success: false,
      error: 'Invalid testCaseIndex. Practice hidden test indexes must be between 4 and 15.'
    });
  }

  const { problem, language, sourceCode } = validated;
  const hiddenCase = problem.hiddenTestCases[indexNum - 4];

  if (!hiddenCase) {
    return res.status(404).json({
      success: false,
      error: `Hidden test case with index ${indexNum} not found in problem definition.`
    });
  }

  try {
    const stdin = hiddenCase.input ?? '';
    const expectedOutput = hiddenCase.output ?? '';

    const execResult = await executeSubmission({
      sourceCode,
      language,
      stdin
    });

    // Check for Compilation Error
    if (execResult.statusId === 6 || (execResult.compileOutput && !execResult.stdout && execResult.statusId !== 3)) {
      return res.json({
        success: false,
        status: 'COMPILATION_ERROR',
        message: 'Compilation Error',
        compileOutput: sanitizeMessage(execResult.compileOutput || execResult.stderr || 'Compilation failed.')
      });
    }

    let caseStatus = 'UNKNOWN';

    if (execResult.statusId === 5) {
      caseStatus = 'TIME_LIMIT_EXCEEDED';
    } else if (execResult.statusId >= 7 && execResult.statusId <= 12) {
      caseStatus = 'RUNTIME_ERROR';
    } else if (execResult.statusId === 4) {
      caseStatus = 'WRONG_ANSWER';
    } else {
      const isMatch = compareOutputs(execResult.stdout, expectedOutput);
      caseStatus = isMatch ? 'PASSED' : 'WRONG_ANSWER';
    }

    return res.json({
      success: caseStatus === 'PASSED',
      status: caseStatus,
      testCaseIndex: indexNum,
      input: stdin,
      expectedOutput: expectedOutput.trim(),
      actualOutput: (execResult.stdout || execResult.stderr || '').trim(),
      executionTime: execResult.time || '0.00s',
      memory: execResult.memory || null
    });
  } catch (err) {
    if (err.isJudgeUnavailable) {
      return res.status(503).json({
        success: false,
        status: 'JUDGE_UNAVAILABLE',
        message: err.message || 'Code execution service is currently unavailable.'
      });
    }

    console.error('Practice test execution error:', err);
    return res.status(500).json({
      success: false,
      status: 'INTERNAL_ERROR',
      message: 'An internal error occurred during practice test evaluation.'
    });
  }
});

/**
 * POST /api/submit
 * Executes user source code against ALL 15 test cases (3 public + 12 hidden).
 * Evaluates all cases sequentially (only short-circuiting on compilation error)
 * and returns per-test results (with strict privacy for hidden cases).
 */
router.post('/submit', async (req, res) => {
  const validated = validateRunRequest(req, res);
  if (!validated) return;

  const { problem, language, sourceCode } = validated;

  // Build the complete test suite: 3 public examples + 12 hidden test cases = 15
  const publicExamples = problem.examples; // items 0..2
  const hiddenCases = problem.hiddenTestCases; // items 0..11

  let publicPassed = 0;
  let hiddenPassed = 0;
  let hasTle = false;
  let hasRuntimeError = false;
  let totalTime = 0.0;
  let maxMemoryKb = 0;
  const testCaseResults = [];

  try {
    // 1. Evaluate Public Examples (Cases 1..3)
    for (let i = 0; i < publicExamples.length; i++) {
      const tc = publicExamples[i];
      const execResult = await executeSubmission({
        sourceCode,
        language,
        stdin: tc.input ?? ''
      });

      // Short-circuit ONLY on compilation error
      if (execResult.statusId === 6 || (execResult.compileOutput && !execResult.stdout && execResult.statusId !== 3)) {
        return res.json({
          success: false,
          status: 'COMPILATION_ERROR',
          message: 'Compilation Error',
          compileOutput: sanitizeMessage(execResult.compileOutput || execResult.stderr || 'Compilation failed.'),
          testCases: []
        });
      }

      let caseStatus = 'UNKNOWN';
      if (execResult.statusId === 5) {
        caseStatus = 'TIME_LIMIT_EXCEEDED';
        hasTle = true;
      } else if (execResult.statusId >= 7 && execResult.statusId <= 12) {
        caseStatus = 'RUNTIME_ERROR';
        hasRuntimeError = true;
      } else if (execResult.statusId === 4) {
        caseStatus = 'WRONG_ANSWER';
      } else {
        const isMatch = compareOutputs(execResult.stdout, tc.output ?? '');
        if (isMatch) {
          caseStatus = 'PASSED';
          publicPassed++;
        } else {
          caseStatus = 'WRONG_ANSWER';
        }
      }

      // Track execution metrics
      const timeVal = parseFloat(execResult.time) || 0.0;
      totalTime += timeVal;
      const memVal = parseInt(execResult.memory, 10) || 0;
      if (memVal > maxMemoryKb) maxMemoryKb = memVal;

      testCaseResults.push({
        index: i + 1,
        visibility: 'PUBLIC',
        status: caseStatus,
        executionTime: execResult.time || '0.00s',
        memory: execResult.memory || null,
        expectedOutput: (tc.output ?? '').trim(),
        actualOutput: (execResult.stdout || execResult.stderr || '').trim()
      });
    }

    // 2. Evaluate Hidden Test Cases (Cases 4..15)
    // NOTE: Continue executing even if earlier tests produce WRONG_ANSWER/RUNTIME_ERROR/TLE
    for (let i = 0; i < hiddenCases.length; i++) {
      const tc = hiddenCases[i];
      const execResult = await executeSubmission({
        sourceCode,
        language,
        stdin: tc.input ?? ''
      });

      // Short-circuit ONLY on compilation error
      if (execResult.statusId === 6 || (execResult.compileOutput && !execResult.stdout && execResult.statusId !== 3)) {
        return res.json({
          success: false,
          status: 'COMPILATION_ERROR',
          message: 'Compilation Error',
          compileOutput: sanitizeMessage(execResult.compileOutput || execResult.stderr || 'Compilation failed.'),
          testCases: testCaseResults
        });
      }

      let caseStatus = 'UNKNOWN';
      if (execResult.statusId === 5) {
        caseStatus = 'TIME_LIMIT_EXCEEDED';
        hasTle = true;
      } else if (execResult.statusId >= 7 && execResult.statusId <= 12) {
        caseStatus = 'RUNTIME_ERROR';
        hasRuntimeError = true;
      } else if (execResult.statusId === 4) {
        caseStatus = 'WRONG_ANSWER';
      } else {
        const isMatch = compareOutputs(execResult.stdout, tc.output ?? '');
        if (isMatch) {
          caseStatus = 'PASSED';
          hiddenPassed++;
        } else {
          caseStatus = 'WRONG_ANSWER';
        }
      }

      const timeVal = parseFloat(execResult.time) || 0.0;
      totalTime += timeVal;
      const memVal = parseInt(execResult.memory, 10) || 0;
      if (memVal > maxMemoryKb) maxMemoryKb = memVal;

      // STRICT SECURITY: For HIDDEN test cases, NEVER include expectedOutput, actualOutput, input, stdout, stderr!
      testCaseResults.push({
        index: i + 4,
        visibility: 'HIDDEN',
        status: caseStatus,
        executionTime: execResult.time || '0.00s',
        memory: execResult.memory || null
      });
    }

    const totalPassed = publicPassed + hiddenPassed;
    const totalCount = publicExamples.length + hiddenCases.length; // 15
    const isAccepted = totalPassed === totalCount;

    let overallStatus = 'ACCEPTED';
    if (!isAccepted) {
      if (hasTle) {
        overallStatus = 'TIME_LIMIT_EXCEEDED';
      } else if (hasRuntimeError) {
        overallStatus = 'RUNTIME_ERROR';
      } else {
        overallStatus = 'WRONG_ANSWER';
      }
    }

    return res.json({
      success: isAccepted,
      status: overallStatus,
      summary: {
        passed: totalPassed,
        total: totalCount,
        publicPassed,
        publicTotal: publicExamples.length, // 3
        hiddenPassed,
        hiddenTotal: hiddenCases.length // 12
      },
      execution: {
        time: `${totalTime.toFixed(3)}s`,
        memory: maxMemoryKb > 0 ? `${maxMemoryKb} KB` : undefined
      },
      testCases: testCaseResults
    });
  } catch (err) {
    if (err.isJudgeUnavailable) {
      return res.status(503).json({
        success: false,
        status: 'JUDGE_UNAVAILABLE',
        message: err.message || 'Code execution service is currently unavailable.'
      });
    }

    console.error('Submit execution error:', err);
    return res.status(500).json({
      success: false,
      status: 'INTERNAL_ERROR',
      message: 'An internal error occurred during submission evaluation.'
    });
  }
});

export default router;

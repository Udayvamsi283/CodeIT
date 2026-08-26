import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the directory path containing problem JSON files.
 * Checks PROBLEMS_DIR environment variable or falls back to robust relative paths
 * for local development, monorepo roots, and cloud deployment container layouts.
 */
function getProblemsDirectory() {
  if (process.env.PROBLEMS_DIR) {
    const customPath = path.resolve(process.env.PROBLEMS_DIR);
    if (fs.existsSync(customPath)) {
      return customPath;
    }
  }

  // Common relative path locations across different deployment and execution contexts
  const candidates = [
    path.resolve(__dirname, '../../src/problems'),
    path.resolve(process.cwd(), 'src/problems'),
    path.resolve(process.cwd(), '../src/problems'),
    path.resolve(process.cwd(), 'CodeIT/src/problems'),
    path.resolve(__dirname, '../../../CodeIT/src/problems'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

/**
 * Validates that a problem adheres strictly to the 15-test-case requirement:
 * Exactly 3 public examples and exactly 12 hidden test cases.
 * @param {Object} problem 
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateProblemStructure(problem) {
  if (!problem || typeof problem !== 'object') {
    return { valid: false, error: 'Problem definition is missing or invalid.' };
  }

  if (!Array.isArray(problem.examples) || problem.examples.length !== 3) {
    return {
      valid: false,
      error: `Problem must contain exactly 3 examples (found ${Array.isArray(problem.examples) ? problem.examples.length : 0}).`
    };
  }

  if (!Array.isArray(problem.hiddenTestCases) || problem.hiddenTestCases.length !== 12) {
    return {
      valid: false,
      error: `Problem must contain exactly 12 hidden test cases (found ${Array.isArray(problem.hiddenTestCases) ? problem.hiddenTestCases.length : 0}).`
    };
  }

  return { valid: true };
}

/**
 * Loads a problem by its unique ID from the JSON files.
 * @param {string} id - Problem ID (e.g. 'food-stamps' or 'example-001')
 * @returns {Object|null} The parsed problem data or null if not found
 */
export function getProblemById(id) {
  if (!id || typeof id !== 'string') {
    return null;
  }

  const problemsDir = getProblemsDirectory();
  if (!fs.existsSync(problemsDir)) {
    console.error(`Problems directory not found at: ${problemsDir}`);
    return null;
  }

  const targetId = id.trim().toLowerCase();

  try {
    const files = fs.readdirSync(problemsDir).filter((file) => file.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(problemsDir, file);
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const problem = JSON.parse(rawData);

      if (problem && String(problem.id).toLowerCase() === targetId) {
        return problem;
      }
    }
  } catch (err) {
    console.error(`Error reading problem files:`, err.message);
  }

  return null;
}

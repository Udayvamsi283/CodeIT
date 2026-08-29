import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProblemById } from './problemLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the directory path containing trusted Python reference solutions.
 * Checks SOLUTIONS_DIR environment variable or falls back to robust relative paths
 * across local development, monorepo roots, and cloud container layouts (Render).
 */
export function getSolutionsDirectory() {
  if (process.env.SOLUTIONS_DIR) {
    const customPath = path.resolve(process.env.SOLUTIONS_DIR);
    if (fs.existsSync(customPath)) {
      return customPath;
    }
  }

  const candidates = [
    path.resolve(__dirname, '../solutions'),
    path.resolve(process.cwd(), 'solutions'),
    path.resolve(process.cwd(), 'backend/solutions'),
    path.resolve(process.cwd(), 'CodeIT/backend/solutions'),
    path.resolve(__dirname, '../../../CodeIT/backend/solutions')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

/**
 * Converts a problem title to a standard lowercase hyphenated slug.
 * e.g. "FOOD STAMPS" -> "food-stamps", "Lock & Parity" -> "lock-parity"
 * @param {string} title
 * @returns {string}
 */
export function slugifyTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');
}

/**
 * Validates that a string does not contain path traversal characters.
 * @param {string} str
 * @returns {boolean}
 */
export function isSafeId(str) {
  if (!str || typeof str !== 'string') return false;
  // Disallow path separators, directory traversal, or control characters
  if (str.includes('/') || str.includes('\\') || str.includes('..') || str.includes('\0')) {
    return false;
  }
  return true;
}

/**
 * Resolves the absolute file path for a problem's trusted reference solution.
 * Strictly prevents path traversal attacks by validating problem registration and directory containment.
 * 
 * @param {string} problemId - Problem identifier
 * @returns {string|null} Absolute file path to the verified .py solution file or null if not found
 */
export function resolveReferenceSolutionPath(problemId) {
  if (!problemId || typeof problemId !== 'string' || !isSafeId(problemId)) {
    return null;
  }

  // Verify the problem exists in the official problem registry
  const problem = getProblemById(problemId);
  if (!problem) {
    return null;
  }

  const solutionsDir = getSolutionsDirectory();
  if (!fs.existsSync(solutionsDir)) {
    return null;
  }

  const canonicalDir = path.resolve(solutionsDir);

  // Generate deterministic candidate filenames
  const candidates = new Set();
  
  if (problem.id && isSafeId(problem.id)) {
    candidates.add(`${problem.id.toLowerCase().trim()}.py`);
  }
  
  if (problem.title) {
    const titleSlug = slugifyTitle(problem.title);
    if (titleSlug && isSafeId(titleSlug)) {
      candidates.add(`${titleSlug}.py`);
    }
  }

  const rawSlug = slugifyTitle(problemId);
  if (rawSlug && isSafeId(rawSlug)) {
    candidates.add(`${rawSlug}.py`);
  }

  for (const filename of candidates) {
    const targetPath = path.resolve(canonicalDir, filename);

    // Strict containment check to prevent path traversal
    if (!targetPath.startsWith(canonicalDir + path.sep) && targetPath !== canonicalDir) {
      continue;
    }

    if (fs.existsSync(targetPath)) {
      try {
        const stat = fs.statSync(targetPath);
        if (stat.isFile()) {
          return targetPath;
        }
      } catch (_) {
        // Continue to next candidate on filesystem access error
      }
    }
  }

  return null;
}

/**
 * Checks whether a trusted Python reference solution exists for a given problem.
 * @param {string} problemId 
 * @returns {boolean}
 */
export function hasReferenceSolution(problemId) {
  return resolveReferenceSolutionPath(problemId) !== null;
}

/**
 * Loads the trusted Python reference source code for a problem.
 * @param {string} problemId 
 * @returns {string|null} Python source code or null if unavailable
 */
export function getReferenceSolution(problemId) {
  const filePath = resolveReferenceSolutionPath(problemId);
  if (!filePath) {
    return null;
  }

  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading reference solution from ${filePath}:`, err.message);
    return null;
  }
}

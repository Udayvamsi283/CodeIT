/**
 * CodeIT Problem Loader
 * Automatically discovers all problem JSON files inside src/problems/
 * using Vite's import.meta.glob feature.
 */

// Dynamically discover all JSON files in the ../problems directory
const problemModules = import.meta.glob('../problems/*.json', {
  eager: true,
  import: 'default'
});

/**
 * Parses and returns all available public problems as an array.
 * Strictly excludes hidden test cases from the public problem model.
 * @returns {Array<Object>} List of all discovered public problems
 */
export function getAllProblems() {
  const problems = Object.values(problemModules)
    .filter(Boolean)
    .map((problem) => ({
      id: problem.id,
      title: problem.title || 'Untitled Problem',
      difficulty: problem.difficulty || 'Medium',
      topics: Array.isArray(problem.topics) ? problem.topics : [],
      description: problem.description || '',
      inputFormat: problem.inputFormat || '',
      outputFormat: problem.outputFormat || '',
      constraints: Array.isArray(problem.constraints) ? problem.constraints : [],
      examples: Array.isArray(problem.examples) ? problem.examples : [],
      starterCode: problem.starterCode || {
        cpp: '// Write your C++ code here\n',
        java: '// Write your Java code here\n',
        python: '# Write your Python code here\n'
      }
    }));

  // Natural sorting by id
  return problems.sort((a, b) => {
    return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Finds a single public problem by its ID.
 * @param {string} id - The unique problem ID (e.g. 'infosys-001' or 'example-001')
 * @returns {Object|null} Public problem object or null if not found
 */
export function getProblemById(id) {
  if (!id) return null;
  const problems = getAllProblems();
  return problems.find((p) => String(p.id).toLowerCase() === String(id).toLowerCase()) || null;
}

/**
 * PRACTICE MODE ONLY: Retrieves hidden test cases for a problem from the local development bundle.
 * This is kept intentionally separated from the generic public problem model above so that it can
 * be completely removed or replaced with a server-side endpoint in future Test Mode phases.
 * @param {string} id - Problem ID
 * @returns {Array<Object>} List of 12 hidden test cases or empty array
 */
export function getPracticeHiddenTests(id) {
  if (!id) return [];
  const targetId = String(id).toLowerCase();
  const rawProblem = Object.values(problemModules).find(
    (p) => p && String(p.id).toLowerCase() === targetId
  );
  return Array.isArray(rawProblem?.hiddenTestCases) ? rawProblem.hiddenTestCases : [];
}

/**
 * Extracts all unique topics sorted alphabetically
 * @returns {Array<string>} List of unique topics
 */
export function getAllTopics() {
  const problems = getAllProblems();
  const topicsSet = new Set();
  problems.forEach((p) => {
    p.topics.forEach((t) => topicsSet.add(t));
  });
  return Array.from(topicsSet).sort();
}

/**
 * Returns statistical counts by difficulty
 * @returns {Object} { total, easy, medium, hard }
 */
export function getProblemStats() {
  const problems = getAllProblems();
  return {
    total: problems.length,
    easy: problems.filter((p) => p.difficulty.toLowerCase() === 'easy').length,
    medium: problems.filter((p) => p.difficulty.toLowerCase() === 'medium').length,
    hard: problems.filter((p) => p.difficulty.toLowerCase() === 'hard').length
  };
}

/**
 * CodeIT Output Normalizer for Competitive Programming
 * 
 * Normalization Rules:
 * 1. Convert all CRLF (\r\n) line endings to standard LF (\n).
 * 2. Trim leading and trailing whitespace from the entire output.
 * 3. Trim trailing whitespace on each individual line.
 * 4. Remove empty trailing lines.
 * 5. Compare line-by-line. If line count matches and every trimmed line matches, outputs are equal.
 * 6. As a secondary check for single-line whitespace variance (e.g. "0 1" vs "0  1\n"), compare whitespace-split tokens.
 */

/**
 * Normalizes output string for competitive programming comparison
 * @param {string|any} output 
 * @returns {string}
 */
export function normalizeOutput(output) {
  if (output === null || output === undefined) {
    return '';
  }

  const str = String(output);

  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Compares user output with expected output
 * @param {string} actualOutput - Program stdout
 * @param {string} expectedOutput - Problem test case expected output
 * @returns {boolean} true if outputs match under competitive programming rules
 */
export function compareOutputs(actualOutput, expectedOutput) {
  const normActual = normalizeOutput(actualOutput);
  const normExpected = normalizeOutput(expectedOutput);

  // Exact normalized match
  if (normActual === normExpected) {
    return true;
  }

  // Token-by-token comparison (handles multiple spaces or tab differences)
  const actualTokens = normActual.split(/\s+/).filter(Boolean);
  const expectedTokens = normExpected.split(/\s+/).filter(Boolean);

  if (actualTokens.length !== expectedTokens.length) {
    return false;
  }

  for (let i = 0; i < actualTokens.length; i++) {
    if (actualTokens[i] !== expectedTokens[i]) {
      return false;
    }
  }

  return true;
}

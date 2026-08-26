import axios from 'axios';

/**
 * Validates that Judge0 environment variables and language IDs are properly configured.
 * Returns an error object if not configured, or null if valid.
 */
export function validateJudge0Config(language) {
  const apiUrl = process.env.JUDGE0_API_URL;
  if (!apiUrl || !apiUrl.trim()) {
    return {
      success: false,
      status: 'JUDGE_UNAVAILABLE',
      message: 'Code execution service is currently unavailable. (JUDGE0_API_URL not configured)'
    };
  }

  const lang = String(language).toLowerCase();
  let langId = null;

  if (lang === 'cpp') {
    langId = process.env.JUDGE0_CPP_LANGUAGE_ID;
  } else if (lang === 'java') {
    langId = process.env.JUDGE0_JAVA_LANGUAGE_ID;
  } else if (lang === 'python') {
    langId = process.env.JUDGE0_PYTHON_LANGUAGE_ID;
  }

  if (!langId || !String(langId).trim()) {
    return {
      success: false,
      status: 'JUDGE_UNAVAILABLE',
      message: `Code execution service is not configured for language: ${language}. (Missing JUDGE0_${language.toUpperCase()}_LANGUAGE_ID)`
    };
  }

  return null;
}

/**
 * Retrieves the Judge0 language ID for a supported language code from environment variables.
 * @param {string} language - 'cpp' | 'java' | 'python'
 * @returns {number|null}
 */
export function getLanguageId(language) {
  const lang = String(language).toLowerCase();
  let idStr = null;

  if (lang === 'cpp') {
    idStr = process.env.JUDGE0_CPP_LANGUAGE_ID;
  } else if (lang === 'java') {
    idStr = process.env.JUDGE0_JAVA_LANGUAGE_ID;
  } else if (lang === 'python') {
    idStr = process.env.JUDGE0_PYTHON_LANGUAGE_ID;
  }

  if (!idStr) return null;
  const parsed = parseInt(idStr, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Builds HTTP headers for Judge0 requests based on environment variables.
 * Only adds authentication headers if JUDGE0_API_KEY is configured.
 */
function getJudge0Headers() {
  const headers = {
    'Content-Type': 'application/json'
  };

  const apiKey = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST;

  if (apiKey && apiKey.trim()) {
    if (apiHost && apiHost.trim()) {
      // RapidAPI format
      headers['X-RapidAPI-Key'] = apiKey.trim();
      headers['X-RapidAPI-Host'] = apiHost.trim();
    } else {
      // Standard Judge0 / Auth Token format
      headers['X-Auth-Token'] = apiKey.trim();
    }
  }

  return headers;
}

/**
 * Helper to safely encode strings to Base64 for Judge0 API
 */
function encodeBase64(str) {
  return Buffer.from(str || '', 'utf8').toString('base64');
}

/**
 * Helper to safely decode Base64 strings returned from Judge0 API
 */
function decodeBase64(b64) {
  if (!b64 || typeof b64 !== 'string') return '';
  try {
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch (_) {
    return String(b64);
  }
}

/**
 * Sanitizes compilation output or error messages to avoid leaking internal server paths.
 * @param {string} text 
 * @returns {string}
 */
export function sanitizeMessage(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/(?:[a-zA-Z]:|\/)[\\/][^\s:]+[/]/g, '') // remove absolute directory paths
    .trim();
}

/**
 * Executes a single submission on Judge0 with robust Base64 encoding and asynchronous polling.
 * 
 * @param {Object} params
 * @param {string} params.sourceCode - User's source code
 * @param {string} params.language - 'cpp' | 'java' | 'python'
 * @param {string} params.stdin - Test case input
 * @returns {Promise<Object>} Execution result { stdout, stderr, compileOutput, statusId, statusDescription, time, memory }
 */
export async function executeSubmission({ sourceCode, language, stdin }) {
  // Validate configuration before making request
  const configError = validateJudge0Config(language);
  if (configError) {
    throw { isJudgeUnavailable: true, ...configError };
  }

  const languageId = getLanguageId(language);
  const baseUrl = process.env.JUDGE0_API_URL.replace(/\/+$/, '');
  const headers = getJudge0Headers();

  // Use base64 encoding to prevent UTF-8 / compiler special character encoding issues
  const submissionPayload = {
    source_code: encodeBase64(sourceCode),
    language_id: languageId,
    stdin: encodeBase64(stdin || ''),
    cpu_time_limit: parseFloat(process.env.JUDGE0_CPU_TIME_LIMIT) || 3.0,
    memory_limit: parseInt(process.env.JUDGE0_MEMORY_LIMIT, 10) || 128000
  };

  // Step 1: Submit code to Judge0
  let submissionRes;
  try {
    submissionRes = await axios.post(`${baseUrl}/submissions?base64_encoded=true&wait=false`, submissionPayload, {
      headers,
      timeout: 10000
    });
  } catch (err) {
    console.error('Judge0 submission error:', err.response?.data || err.message);
    let detail = err.response?.data?.message || err.response?.data?.error || err.response?.data || err.message;
    if (typeof detail === 'object') {
      try { detail = JSON.stringify(detail); } catch (_) {}
    }
    const statusCode = err.response?.status ? `HTTP ${err.response.status}` : 'Network Error';
    throw {
      isJudgeUnavailable: true,
      success: false,
      status: 'JUDGE_UNAVAILABLE',
      message: `Judge0 submission failed (${statusCode}): ${detail}`
    };
  }

  const token = submissionRes.data?.token;
  if (!token) {
    throw {
      isJudgeUnavailable: true,
      success: false,
      status: 'JUDGE_UNAVAILABLE',
      message: 'Judge0 did not return a valid submission token.'
    };
  }

  // Step 2: Poll for execution result
  const maxAttempts = parseInt(process.env.JUDGE0_MAX_POLL_ATTEMPTS, 10) || 20;
  const pollIntervalMs = parseInt(process.env.JUDGE0_POLL_INTERVAL_MS, 10) || 500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    let pollRes;
    try {
      pollRes = await axios.get(`${baseUrl}/submissions/${token}?base64_encoded=true`, {
        headers,
        timeout: 5000
      });
    } catch (err) {
      console.error(`Judge0 poll attempt ${attempt + 1} error:`, err.response?.data || err.message);
      continue;
    }

    const data = pollRes.data;
    const statusId = data?.status?.id;

    // Status 1: In Queue, Status 2: Processing -> continue polling
    if (statusId === 1 || statusId === 2) {
      continue;
    }

    // Finished execution -> decode Base64 outputs safely
    const rawStdout = decodeBase64(data?.stdout);
    const rawStderr = decodeBase64(data?.stderr);
    const rawCompileOutput = decodeBase64(data?.compile_output);

    return {
      statusId: statusId,
      statusDescription: data?.status?.description || 'Unknown',
      stdout: rawStdout,
      stderr: rawStderr,
      compileOutput: rawCompileOutput,
      time: data?.time ? `${data.time}s` : '0.00s',
      memory: data?.memory ? `${data.memory} KB` : null
    };
  }

  // Polling timed out
  throw {
    isJudgeUnavailable: false,
    success: false,
    status: 'TIME_LIMIT_EXCEEDED',
    message: 'Judge execution polling timed out.'
  };
}

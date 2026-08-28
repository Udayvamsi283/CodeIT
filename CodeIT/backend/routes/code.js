import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import SavedCode from '../models/SavedCode.js';
import { getProblemById } from '../utils/problemLoader.js';

const router = express.Router();
const SUPPORTED_LANGUAGES = ['python', 'cpp', 'java'];
const MAX_SOURCE_CODE_BYTES = 64 * 1024; // 64 KB

/**
 * Validate params helper
 */
function validateCodeParams(req, res) {
  const { problemId, language } = req.params;

  if (!problemId || typeof problemId !== 'string' || !problemId.trim()) {
    res.status(400).json({
      success: false,
      error: 'Invalid or missing problemId parameter.'
    });
    return null;
  }

  const normalizedLang = String(language || '').toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES.includes(normalizedLang)) {
    res.status(400).json({
      success: false,
      error: `Unsupported language "${language}". Supported languages are: ${SUPPORTED_LANGUAGES.join(', ')}.`
    });
    return null;
  }

  // Validate problem exists in problem definition bank
  const problem = getProblemById(problemId.trim());
  if (!problem) {
    res.status(404).json({
      success: false,
      error: `Problem with ID "${problemId}" was not found.`
    });
    return null;
  }

  return {
    problemId: problem.id,
    language: normalizedLang
  };
}

/**
 * GET /api/code/:problemId/:language
 * Retrieve the authenticated user's saved code for a problem & language.
 */
router.get('/:problemId/:language', requireAuth, async (req, res) => {
  const params = validateCodeParams(req, res);
  if (!params) return;

  try {
    const saved = await SavedCode.findOne({
      userId: req.user.id,
      problemId: params.problemId,
      language: params.language
    });

    return res.json({
      success: true,
      sourceCode: saved ? saved.sourceCode : null
    });
  } catch (error) {
    console.error('Error fetching saved code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve saved code.'
    });
  }
});

/**
 * PUT /api/code/:problemId/:language
 * Upsert the authenticated user's saved code for a problem & language.
 */
router.put('/:problemId/:language', requireAuth, async (req, res) => {
  const params = validateCodeParams(req, res);
  if (!params) return;

  const { sourceCode } = req.body || {};

  if (typeof sourceCode !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid sourceCode in request body.'
    });
  }

  if (Buffer.byteLength(sourceCode, 'utf8') > MAX_SOURCE_CODE_BYTES) {
    return res.status(400).json({
      success: false,
      error: `Source code exceeds maximum allowed size of ${MAX_SOURCE_CODE_BYTES / 1024} KB.`
    });
  }

  try {
    const doc = await SavedCode.findOneAndUpdate(
      {
        userId: req.user.id,
        problemId: params.problemId,
        language: params.language
      },
      {
        sourceCode
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({
      success: true,
      savedAt: doc.updatedAt || new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save code.'
    });
  }
});

/**
 * DELETE /api/code/:problemId/:language
 * Delete the authenticated user's saved code for a problem & language.
 */
router.delete('/:problemId/:language', requireAuth, async (req, res) => {
  const params = validateCodeParams(req, res);
  if (!params) return;

  try {
    await SavedCode.findOneAndDelete({
      userId: req.user.id,
      problemId: params.problemId,
      language: params.language
    });

    return res.json({
      success: true,
      message: 'Saved code reset successfully.'
    });
  } catch (error) {
    console.error('Error deleting saved code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete saved code.'
    });
  }
});

export default router;

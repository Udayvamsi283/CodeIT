import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import ProblemProgress from '../models/ProblemProgress.js';
import { getProblemById } from '../utils/problemLoader.js';

const router = express.Router();

/**
 * GET /api/progress
 * Retrieve all problem progress for the authenticated user.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const list = await ProblemProgress.find({ userId: req.user.id }).lean();

    const progress = list.map((doc) => ({
      problemId: doc.problemId,
      status: doc.status,
      solvedLanguages: doc.solvedLanguages || [],
      firstAttemptedAt: doc.firstAttemptedAt,
      lastAttemptedAt: doc.lastAttemptedAt,
      solvedAt: doc.solvedAt
    }));

    return res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve progress records.'
    });
  }
});

/**
 * GET /api/progress/stats
 * Aggregate user statistics (solved/attempted breakdown by difficulty)
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const list = await ProblemProgress.find({ userId: req.user.id }).lean();

    let totalSolved = 0;
    let totalAttempted = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    for (const item of list) {
      if (item.status === 'ATTEMPTED' || item.status === 'SOLVED') {
        totalAttempted++;
      }

      if (item.status === 'SOLVED') {
        totalSolved++;
        const prob = getProblemById(item.problemId);
        if (prob) {
          const diff = String(prob.difficulty || '').toLowerCase();
          if (diff === 'easy') easySolved++;
          else if (diff === 'medium') mediumSolved++;
          else if (diff === 'hard') hardSolved++;
        }
      }
    }

    return res.json({
      success: true,
      stats: {
        totalSolved,
        totalAttempted,
        easySolved,
        mediumSolved,
        hardSolved
      }
    });
  } catch (error) {
    console.error('Error calculating progress stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to calculate user statistics.'
    });
  }
});

/**
 * GET /api/progress/:problemId
 * Retrieve progress for a single problem.
 */
router.get('/:problemId', requireAuth, async (req, res) => {
  const { problemId } = req.params;

  if (!problemId || typeof problemId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid problemId parameter.'
    });
  }

  try {
    const doc = await ProblemProgress.findOne({
      userId: req.user.id,
      problemId: problemId.trim()
    }).lean();

    if (!doc) {
      return res.json({
        success: true,
        progress: null
      });
    }

    return res.json({
      success: true,
      progress: {
        problemId: doc.problemId,
        status: doc.status,
        solvedLanguages: doc.solvedLanguages || [],
        firstAttemptedAt: doc.firstAttemptedAt,
        lastAttemptedAt: doc.lastAttemptedAt,
        solvedAt: doc.solvedAt
      }
    });
  } catch (error) {
    console.error('Error fetching problem progress:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve problem progress.'
    });
  }
});

/**
 * POST /api/progress/:problemId/attempt
 * Explicitly mark a problem as attempted without overriding SOLVED.
 */
router.post('/:problemId/attempt', requireAuth, async (req, res) => {
  const { problemId } = req.params;

  if (!problemId || typeof problemId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid problemId parameter.'
    });
  }

  const problem = getProblemById(problemId.trim());
  if (!problem) {
    return res.status(404).json({
      success: false,
      error: `Problem with ID "${problemId}" was not found.`
    });
  }

  try {
    const now = new Date();
    let doc = await ProblemProgress.findOne({
      userId: req.user.id,
      problemId: problem.id
    });

    if (!doc) {
      doc = new ProblemProgress({
        userId: req.user.id,
        problemId: problem.id,
        status: 'ATTEMPTED',
        firstAttemptedAt: now,
        lastAttemptedAt: now
      });
      await doc.save();
    } else {
      doc.lastAttemptedAt = now;
      // Do not downgrade SOLVED back to ATTEMPTED
      if (doc.status === 'NOT_STARTED') {
        doc.status = 'ATTEMPTED';
      }
      await doc.save();
    }

    return res.json({
      success: true,
      progress: {
        problemId: doc.problemId,
        status: doc.status,
        solvedLanguages: doc.solvedLanguages || [],
        firstAttemptedAt: doc.firstAttemptedAt,
        lastAttemptedAt: doc.lastAttemptedAt,
        solvedAt: doc.solvedAt
      }
    });
  } catch (error) {
    console.error('Error updating problem attempt:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record problem attempt.'
    });
  }
});

export default router;

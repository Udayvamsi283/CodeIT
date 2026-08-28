import express from 'express';
import mongoose from 'mongoose';
import { requireAuth } from '../middleware/auth.js';
import Submission from '../models/Submission.js';

const router = express.Router();

/**
 * GET /api/submissions
 * Paginated submission history for the authenticated user.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (req.query.problemId && typeof req.query.problemId === 'string' && req.query.problemId.trim()) {
      filter.problemId = req.query.problemId.trim();
    }

    const [total, docs] = await Promise.all([
      Submission.countDocuments(filter),
      Submission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const submissions = docs.map((doc) => ({
      id: doc._id.toString(),
      problemId: doc.problemId,
      language: doc.language,
      status: doc.status,
      passed: doc.passed,
      total: doc.total,
      publicPassed: doc.publicPassed,
      publicTotal: doc.publicTotal,
      hiddenPassed: doc.hiddenPassed,
      hiddenTotal: doc.hiddenTotal,
      executionTime: doc.executionTime,
      memory: doc.memory,
      createdAt: doc.createdAt
    }));

    return res.json({
      success: true,
      submissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve submission history.'
    });
  }
});

/**
 * GET /api/submissions/:id
 * Retrieve single submission by ID belonging to authenticated user.
 */
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      error: 'Submission not found.'
    });
  }

  try {
    const doc = await Submission.findOne({
      _id: id,
      userId: req.user.id
    }).lean();

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found.'
      });
    }

    return res.json({
      success: true,
      submission: {
        id: doc._id.toString(),
        problemId: doc.problemId,
        language: doc.language,
        status: doc.status,
        passed: doc.passed,
        total: doc.total,
        publicPassed: doc.publicPassed,
        publicTotal: doc.publicTotal,
        hiddenPassed: doc.hiddenPassed,
        hiddenTotal: doc.hiddenTotal,
        executionTime: doc.executionTime,
        memory: doc.memory,
        createdAt: doc.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching single submission:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve submission.'
    });
  }
});

export default router;

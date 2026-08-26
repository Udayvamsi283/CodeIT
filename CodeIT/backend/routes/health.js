import express from 'express';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint to verify backend service status.
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

export default router;

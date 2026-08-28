import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint to verify backend and database connectivity safely.
 * Never exposes connection strings or internal database errors.
 */
router.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'disconnected'
  });
});

export default router;


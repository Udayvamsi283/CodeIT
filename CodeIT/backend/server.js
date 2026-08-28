import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import connectDB from './config/db.js';
import healthRoutes from './routes/health.js';
import judgeRoutes from './routes/judge.js';
import authRoutes from './routes/auth.js';
import codeRoutes from './routes/code.js';
import progressRoutes from './routes/progress.js';
import submissionRoutes from './routes/submissions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Render, AWS, Cloudflare) for secure cookie forwarding
app.set('trust proxy', 1);

// Parse configured frontend origins from environment (supports comma-separated list or wildcard)
const configuredOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

// Production-ready CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, curl, health checks)
    if (!origin) return callback(null, true);

    // Allow wildcard if configured
    if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Always allow localhost in development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Mount API Routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api', judgeRoutes);

// Fallback for unmatched API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found.`
  });
});

// Global Production Error Handler (avoids leaking stack traces)
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message.includes('CORS') ? err.message : 'Internal server error occurred.'
  });
});

// Initialize database connection on server startup
if (process.env.MONGODB_URI) {
  connectDB().catch((err) => {
    console.error('⚠️ Server continuing startup, but database connection failed:', err.message);
  });
} else {
  console.warn('⚠️ MONGODB_URI not set. Database features will be unavailable until configured.');
}

app.listen(PORT, () => {
  console.log(`🚀 CodeIT Backend Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

export default app;

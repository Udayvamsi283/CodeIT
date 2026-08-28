import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getClearCookieOptions } from '../config/cookie.js';

/**
 * Authentication Middleware
 * Reads JWT from HTTP-only cookie 'codeit_token', verifies token,
 * fetches user from MongoDB, and attaches sanitized req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.codeit_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('❌ JWT_SECRET environment variable is missing.');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please log in again.'
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session payload.'
      });
    }

    const user = await User.findById(decoded.userId).select('username email isAdmin');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.'
      });
    }

    // Attach sanitized user to req.user (ensuring isAdmin is present and clean)
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      isAdmin: Boolean(user.isAdmin)
    };

    next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Authentication verification failed.'
    });
  }
}

/**
 * Optional Authentication Middleware
 * If a valid 'codeit_token' cookie is present, attaches sanitized req.user.
 * If no cookie is present, treats request as anonymous (req.user = null).
 * If cookie is invalid or expired, clears the cookie safely and treats as anonymous (req.user = null).
 * Never crashes or throws 401 for anonymous/invalid tokens.
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.codeit_token;
    if (!token) {
      req.user = null;
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      // Clear invalid/expired cookie safely
      res.clearCookie('codeit_token', getClearCookieOptions());
      req.user = null;
      return next();
    }

    if (!decoded || !decoded.userId) {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.userId).select('username email isAdmin');
    if (!user) {
      // User account no longer exists in database, clear cookie
      res.clearCookie('codeit_token', getClearCookieOptions());
      req.user = null;
      return next();
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      isAdmin: Boolean(user.isAdmin)
    };

    next();
  } catch (err) {
    req.user = null;
    next();
  }
}

/**
 * Future-ready Admin Authorization Middleware
 * Enforces requireAuth and verifies req.user.isAdmin === true
 */
export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Administrator privileges required.'
    });
  }
  next();
}

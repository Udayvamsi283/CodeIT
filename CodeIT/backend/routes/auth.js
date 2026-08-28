import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper to build production-hardened cookie configuration.
 * For cross-site production (Vercel frontend -> Render backend), defaults to SameSite: 'none' and Secure: true.
 * For local development, defaults to SameSite: 'lax' and Secure: false.
 */
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
  const secure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : isProd;
  const sameSite = process.env.COOKIE_SAME_SITE || (secure ? 'none' : 'lax');

  return {
    httpOnly: true,
    secure: secure,
    sameSite: sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path: '/'
  };
}

/**
 * Generate a signed JWT for a given user ID
 */
function generateToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing.');
  }

  return jwt.sign(
    { userId: userId.toString() },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * POST /api/auth/register
 * Register a new user with email, username, and password.
 * Security: Strictly enforces isAdmin: false regardless of client request payload.
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate presence
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required.'
      });
    }

    const trimmedUsername = String(username).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const rawPassword = String(password);

    // Validation rules
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 30 characters.'
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        error: 'Username can only contain alphanumeric characters and underscores.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    if (rawPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.'
      });
    }

    // Check existing records
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists.'
      });
    }

    const existingUsername = await User.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        error: 'Username is already taken.'
      });
    }

    // Hash password with salt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    // Server-enforced isAdmin: false
    const newUser = await User.create({
      username: trimmedUsername,
      email: normalizedEmail,
      passwordHash,
      isAdmin: false
    });

    // Create session token and set HTTP-only cookie
    const token = generateToken(newUser._id);
    const cookieOptions = getCookieOptions();
    res.cookie('codeit_token', token, cookieOptions);

    return res.status(201).json({
      success: true,
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        isAdmin: false
      }
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (E11000) race conditions
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      if (field === 'email') {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists.'
        });
      }
      if (field === 'username') {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken.'
        });
      }
      return res.status(409).json({
        success: false,
        error: 'User with this username or email already exists.'
      });
    }

    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Registration failed. Please try again later.'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and sets HTTP-only cookie.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const rawPassword = String(password);

    // Look up user with passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.'
      });
    }

    // Create session token and set HTTP-only cookie
    const token = generateToken(user._id);
    const cookieOptions = getCookieOptions();
    res.cookie('codeit_token', token, cookieOptions);

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isAdmin: Boolean(user.isAdmin)
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Login failed. Please try again later.'
    });
  }
});

/**
 * GET /api/auth/me
 * Protected route to retrieve currently authenticated user profile.
 */
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

/**
 * POST /api/auth/logout
 * Clears session cookie.
 */
router.post('/logout', (req, res) => {
  try {
    const cookieOptions = getCookieOptions();
    delete cookieOptions.maxAge;
    res.clearCookie('codeit_token', cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Logout failed.'
    });
  }
});

export default router;

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── Helper: create a signed JWT ─────────────────────────────
const createToken = (userId) => {
  return jwt.sign(
    { userId },                          // payload
    process.env.JWT_SECRET,              // secret
    { expiresIn: '7d' }                  // token lives for 7 days
  );
};

// ─── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for duplicates
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        message: existingUser.email === email
          ? 'Email already in use'
          : 'Username already taken'
      });
    }

    // Create user — password gets hashed by the pre('save') hook
    const user = await User.create({ username, email, password });

    const token = createToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user — include password this time to compare it
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    // comparePassword is the method we added to the User model

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Note: same error message for "user not found" and "wrong password"
    // — never tell an attacker which one it was

    const token = createToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────
// Protected route — returns the logged-in user's data
router.get('/me', authMiddleware, (req, res) => {
  // req.user was attached by the middleware
  res.json({ user: req.user });
});

module.exports = router;
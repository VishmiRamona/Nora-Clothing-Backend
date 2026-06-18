const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// ── Nodemailer setup ────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  socket: {
    family: 4, // Force IPv4 to avoid potential IPv6 issues
  }
});

// ── Helper: escape regex ──────────────────────────────────────────────────
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── Get all users (admin only) ──────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Register ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const existingUser = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    const user = new User({ name, email, password });
    await user.save();
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      role: user.isAdmin ? 'admin' : 'user'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Login ──────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(401).json({ message: 'Invalid credentials' });
    const user = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin },
      role: user.isAdmin ? 'admin' : 'user'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Get current user ──────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ── NEW: Forgot Password ──────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
    if (!user) {
      return res.json({ message: 'If that email is registered, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset Request – Nora Clothing',
      html: `
        <p>Hello ${user.name || 'there'},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="background:#2F4156;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link expires in 1 hour.</p>
        <p>– Nora Clothing Team</p>
      `
    });

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ── NEW: Reset Password ──────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
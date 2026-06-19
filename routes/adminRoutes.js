const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const ContactMessage = require('../models/ContactMessage');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// Escape regex special characters so emails can be safely used in a case-insensitive match
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();
    if (!email) return res.status(401).json({ message: 'Invalid credentials' });
    const admin = await Admin.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/products', authMiddleware, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/products/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/products/:id', authMiddleware, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── NEW: Reply to a contact message & send email ────────────────────────
router.post('/contacts/:id/reply', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const contact = await ContactMessage.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Add reply to the replies array
    const newReply = { message: message.trim(), sentAt: new Date().toISOString() };
    contact.replies = contact.replies || [];
    contact.replies.push(newReply);
    await contact.save();

    // Send email to the user via Resend
    await resend.emails.send({
      from: 'Nora Clothing <onboarding@resend.dev>', // Change to your verified domain
      to: [contact.email],
      subject: `Re: Your message to Nora Clothing`,
      html: `
        <p>Hello ${contact.name},</p>
        <p>Thank you for reaching out to us. Here is our reply to your message:</p>
        <blockquote style="background:#f5f5f5;padding:15px;border-left:4px solid #2F4156;margin:10px 0;">
          ${message.replace(/\n/g, '<br>')}
        </blockquote>
        <p>If you have any further questions, feel free to reply to this email.</p>
        <p>– Nora Clothing Team</p>
      `
    });

    res.json({ reply: newReply });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ message: 'Failed to send reply' });
  }
});

module.exports = router;
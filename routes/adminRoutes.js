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
    // Token expires in 7 days (reduced 401 errors)
    const token = jwt.sign({ id: admin._id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
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

// ── Reply to a contact message & send email ─────────────────────────────
router.post('/contacts/:id/reply', authMiddleware, async (req, res) => {
  console.log('📨 Reply endpoint called');
  try {
    const { id } = req.params;
    const { message } = req.body;
    console.log(`📝 Replying to message ID: ${id}`);

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const contact = await ContactMessage.findById(id);
    if (!contact) {
      console.log('❌ Contact not found');
      return res.status(404).json({ message: 'Message not found' });
    }
    console.log(`👤 Contact: ${contact.name} (${contact.email})`);

    // 1. Save reply to database
    const newReply = { message: message.trim(), sentAt: new Date().toISOString() };
    contact.replies = contact.replies || [];
    contact.replies.push(newReply);
    await contact.save();
    console.log('✅ Reply saved to database');

    // 2. Send reply email
    console.log(`📧 Sending email to ${contact.email}...`);
    const replyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reply from Nora Clothing</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          .email-header {
            background-color: #2F4156;
            padding: 20px;
            text-align: center;
          }
          .email-header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
          }
          .email-body {
            padding: 24px;
          }
          .message-detail {
            margin-bottom: 20px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 12px;
          }
          .message-label {
            font-weight: bold;
            color: #567C8D;
            font-size: 16px;
            margin-bottom: 4px;
          }
          .message-value {
            color: #333333;
            font-size: 15px;
            line-height: 1.5;
          }
          .message-content {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
          }
          .email-footer {
            background-color: #f0f0f0;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #777777;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Nora Clothing</h1>
          </div>
          <div class="email-body">
            <div class="message-detail">
              <div class="message-label">To:</div>
              <div class="message-value">${contact.name}</div>
            </div>
            <div class="message-detail">
              <div class="message-label">Your original message:</div>
              <div class="message-content">${contact.message.replace(/\n/g, '<br>')}</div>
            </div>
            <div class="message-detail">
              <div class="message-label">Our reply:</div>
              <div class="message-content">${message.trim().replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          <div class="email-footer">
            This is a reply from Nora Clothing support.
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const result = await resend.emails.send({
        from: 'Nora Clothing <onboarding@resend.dev>',
        to: [contact.email],
        subject: `Re: Your message to Nora Clothing`,
        html: replyHtml,
      });
      console.log('✅ Email sent successfully:', result);
    } catch (emailError) {
      console.error('❌ Resend error:', emailError.message);
      if (emailError.response) {
        console.error('❌ Resend response:', JSON.stringify(emailError.response, null, 2));
      }
    }

    res.json({ reply: newReply });
  } catch (error) {
    console.error('❌ Reply handler error:', error);
    res.status(500).json({ message: 'Failed to process reply' });
  }
});

module.exports = router;
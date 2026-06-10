const express = require('express');
const nodemailer = require('nodemailer');
const ContactMessage = require('../models/ContactMessage');
const router = express.Router();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newMessage = new ContactMessage({ name, email, message });
    await newMessage.save();

    // Updated HTML email template with new color scheme
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Message</title>
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
            background-color: #2F4156;  /* Navy */
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
            color: #567C8D;  /* Teal */
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
              <div class="message-label">From:</div>
              <div class="message-value">${name}</div>
            </div>
            <div class="message-detail">
              <div class="message-label">Email:</div>
              <div class="message-value">${email}</div>
            </div>
            <div class="message-detail">
              <div class="message-label">Message:</div>
              <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
          <div class="email-footer">
            This message was sent from your Nora Clothing website contact form.
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'support.noraonlineclothing@gmail.com',
      subject: `New Contact Message from ${name}`,
      text: `You have received a new message.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(201).json({ message: 'Message saved, but email notification failed.' });
  }
});

module.exports = router;
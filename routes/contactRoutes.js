const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const router = express.Router();

// ── Brevo (Sendinblue) setup ─────────────────────────────────────────────
const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
const brevoInstance = new SibApiV3Sdk.TransactionalEmailsApi();

router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // 1. Save to database
    const newMessage = new ContactMessage({ name, email, message });
    await newMessage.save();

    // 2. Respond immediately – don't make the user wait for email
    res.status(201).json({ message: 'Message sent successfully!' });

    // 3. HTML email template (same as before)
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

    // 4. Send email via Brevo – sender MUST be verified in Brevo
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { name: 'Nora Clothing', email: 'support.noraonlineclothing@gmail.com' }; // <-- changed to verified email
      sendSmtpEmail.to = [{ email: 'support.noraonlineclothing@gmail.com' }];
      sendSmtpEmail.subject = `New Contact Message from ${name}`;
      sendSmtpEmail.htmlContent = htmlContent;

      await brevoInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Contact email sent via Brevo');
    } catch (emailError) {
      console.error('❌ Brevo email error:', emailError.message);
      // The message is already saved, so we don't throw an error
    }

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
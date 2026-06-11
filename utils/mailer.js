const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

const sendMail = (mailOptions) => {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
    ...mailOptions,
  });
};

// Verify SMTP credentials/connection at startup so misconfiguration shows up
// clearly in the server logs instead of failing silently on every contact submission.
transporter.verify((error) => {
  if (error) {
    console.error('SMTP connection failed:', error.message);
  } else {
    console.log('SMTP connection verified — ready to send emails as', transporter.options.auth.user);
  }
});

module.exports = { transporter, sendMail };

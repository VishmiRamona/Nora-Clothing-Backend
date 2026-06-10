const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
});

const sendMail = (mailOptions) => {
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
    ...mailOptions,
  });
};

module.exports = { transporter, sendMail };

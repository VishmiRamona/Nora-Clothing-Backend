const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared domain works without verifying your own domain, but can
// only send to the email address you signed up with. Once you verify a
// domain in Resend, set RESEND_FROM to an address on that domain (e.g.
// "Nora Clothing <noreply@noraclothing.com>") to send to anyone.
const DEFAULT_FROM = process.env.RESEND_FROM || 'Nora Clothing <onboarding@resend.dev>';

const sendMail = ({ to, subject, text, html, from }) => {
  return resend.emails.send({
    from: from || DEFAULT_FROM,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendMail };

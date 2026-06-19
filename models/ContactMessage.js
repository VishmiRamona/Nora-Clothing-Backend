const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [{ message: String, sentAt: Date }]   // <-- stores reply history
});

module.exports = mongoose.model('ContactMessage', contactSchema);
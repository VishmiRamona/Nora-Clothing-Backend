const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerAddress: { type: String, required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // new field
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
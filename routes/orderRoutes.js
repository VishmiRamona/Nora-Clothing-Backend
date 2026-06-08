const express = require('express');
const Order = require('../models/Order');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { customerName, customerEmail, customerAddress, items, totalAmount } = req.body;
    const order = new Order({
      customerName,
      customerEmail,
      customerAddress,
      items,
      totalAmount
    });
    await order.save();
    res.status(201).json({ orderId: order._id, message: 'Order placed successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my-orders', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const orders = await Order.find({ customerEmail: email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');
const contactRoutes = require('./routes/contactRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Vite picks the next free port (5173, 5174, 5175, ...) when the default is
// already in use, so allow any localhost dev port rather than hardcoding one.
// Vercel also gives every deploy of this project its own *.vercel.app subdomain,
// so allow those too instead of hardcoding one preview URL.
const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/nora-clothing-frontend(-[a-z0-9]+)?(-vishmi-s-projects)?\.vercel\.app$/,
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOriginPatterns.some((pattern) => pattern.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
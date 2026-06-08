require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await Product.updateMany(
      {},
      { $set: { keywords: '', details: '', fabricCare: '', sizeFit: '', isNewArrival: false } }
    );
    console.log(`Migration done. Updated ${result.modifiedCount} products.`);
    process.exit();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
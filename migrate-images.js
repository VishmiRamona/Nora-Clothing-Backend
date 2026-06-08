require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await Product.find({ imageUrl: { $exists: true, $ne: null } });
    for (let product of products) {
      if (!product.images || product.images.length === 0) {
        product.images = [product.imageUrl];
        product.imageUrl = undefined;
        await product.save();
        console.log(`Migrated: ${product.name}`);
      }
    }
    console.log(`✅ Migration completed. Migrated ${products.length} products.`);
    process.exit();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}
migrate();
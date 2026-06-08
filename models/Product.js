const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],          // array of up to 4 image URLs
  description: { type: String },
  keywords: { type: String },
  details: { type: String },
  fabricCare: { type: String },
  sizeFit: { type: String },
  isBestSeller: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  brand: { type: String },
  colors: [{ type: String }],
  sizes: [{ type: String }],
  oldPrice: { type: Number },
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Migrate old single imageUrl to images array (if you had one)
productSchema.pre('save', async function() {
  if (this.imageUrl && (!this.images || this.images.length === 0)) {
    this.images = [this.imageUrl];
    this.imageUrl = undefined;
  }
});

module.exports = mongoose.model('Product', productSchema);
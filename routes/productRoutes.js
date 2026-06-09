const express = require('express');
const Product = require('../models/Product');
const router = express.Router();
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, brand, color, size, rating, inStock } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.category = category;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { category: regex }, { brand: regex }];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (brand) filter.brand = { $in: brand.split(',') };
    if (color) filter.colors = { $in: color.split(',') };
    if (size) filter.sizes = { $in: size.split(',') };
    if (rating) filter.rating = { $gte: Number(rating) };
    if (inStock === 'true') filter.inStock = true;

    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/bestsellers', async (req, res) => {
  try {
    const bestSellers = await Product.find({ isBestSeller: true });
    res.json(bestSellers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/new-arrivals', async (req, res) => {
  try {
    const newArrivals = await Product.find({ isNewArrival: true });
    res.json(newArrivals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
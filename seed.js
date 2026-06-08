require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Admin = require('./models/Admin');

const sampleProducts = [
  { name: 'Floral Summer Dress', price: 2000, category: 'Casual Dresses', imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400', description: 'Light and airy floral dress', isBestSeller: true },
  { name: 'Elegant Party Gown', price: 3500, category: 'Party Dresses', imageUrl: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400', description: 'Perfect for evening events', isBestSeller: true },
  { name: 'Office Blazer Dress', price: 2800, category: 'Office Dresses', imageUrl: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=400', description: 'Professional yet stylish' },
  { name: 'Bohemian Maxi', price: 4200, category: 'Maxi Dresses', imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400', description: 'Flowing maxi dress' },
  { name: 'Cocktail Mini', price: 1900, category: 'Mini Dresses', imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400', description: 'Fun and flirty mini' },
  { name: 'Silk Party Dress', price: 3800, category: 'Party Dresses', imageUrl: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400', description: 'Luxurious silk fabric', isBestSeller: true },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Product.deleteMany();
    await Product.insertMany(sampleProducts);
    
    const adminExists = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminExists) {
      await Admin.create({
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD
      });
      console.log('Admin created');
    }
    console.log('Database seeded!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
seed();
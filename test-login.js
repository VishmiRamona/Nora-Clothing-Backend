require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await Admin.findOne({ email: 'admin@noraclothing.com' });
    if (!admin) {
      console.log('Admin not found');
      return;
    }
    const isMatch = await admin.comparePassword('admin123');
    console.log('Password match:', isMatch); // Should be true
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
testLogin();
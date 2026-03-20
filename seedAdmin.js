// backend/seedAdmin.js
// Run this script to create an admin user: node seedAdmin.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freshrecipe';

// Use the existing User model
const User = require('./models/User');

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const adminEmail = 'admin@freshrecipe.com';
    const adminPassword = 'admin123';
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    } else {
      // Create admin user using create method (which triggers pre-save hook for hashing)
      const admin = await User.create({
        username: 'admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      
      console.log('Admin user created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      console.log('User ID:', admin._id);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAdmin();

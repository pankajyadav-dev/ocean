import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/oceanguard');
    console.log('Connected to MongoDB');

    // Admin credentials
    const adminData = {
      name: 'Admin',
      email: 'admin@oceanguard.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log('Email:', adminData.email);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create(adminData);
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('=================================');
    console.log('Admin Credentials:');
    console.log('=================================');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('=================================');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();

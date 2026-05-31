const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/astroagent';
    await mongoose.connect(connStr);
    console.log('🌌 Successfully connected to MongoDB Atlas (MVC Database Layer).');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

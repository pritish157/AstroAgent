const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load .env FIRST so all process.env values are available
dotenv.config();

const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// 1. Connect to MongoDB
connectDB();

// 2. Configure Global Middlewares
app.use(cors());
app.use(express.json());

// 3. Mount API Routers (MVC routing layer)
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// General health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

module.exports = app;

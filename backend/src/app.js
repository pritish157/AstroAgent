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

// 2. Configure Global Middlewares & Comprehensive CORS Setup
const corsOptions = {
  origin: true, // Reflect request origin to support localhost (3000, 5173, 5000) and production deployments
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// 3. Mount API Routers (MVC routing layer)
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// General health check & Render keep-alive endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Render keep-alive / ping route (hit every 5 mins by external cron or self-ping to prevent free-tier sleeping)
app.get(['/api/ping', '/ping'], (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'AstroAgent backend is awake and active',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

module.exports = app;

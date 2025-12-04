import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import lunchRoutes from './routes/lunchRoutes.js';
import brunchRoutes from './routes/brunchRoutes.js';
import reveillonRoutes from './routes/reveillonRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Debug CORS en développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('🌍 CORS Debug:', {
      origin: req.headers.origin,
      method: req.method,
      allowedOrigins: [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL
      ]
    });
    next();
  });
}

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:4173',
    'https://thebrunch.netlify.app',
    'https://*.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lunch', lunchRoutes);
app.use('/api/brunch', brunchRoutes);
app.use('/api/reveillon', reveillonRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/communication', communicationRoutes);

// Root route for Railway health check
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'The Brunch Traiteur API',
    status: 'Online',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      menus: ['/api/lunch', '/api/brunch', '/api/reveillon']
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'The Brunch Traiteur API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to The Brunch Traiteur API',
    documentation: '/api/health'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`⚙️ Admin URL: ${process.env.ADMIN_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});


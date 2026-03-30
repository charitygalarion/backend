const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('express-async-errors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes - Modular Architecture
const authRoutes = require('./modules/auth/auth.routes');

// Import the user status middleware
const checkUserStatus = require('./middlewares/checkUserStatus');

const userRoutes = require('./modules/user/user.routes');
const recipeRoutes = require('./modules/recipe/recipe.routes');
const ingredientRoutes = require('./modules/ingredient/ingredient.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const chatbotRoutes = require('./modules/chatbot/chatbot.routes');
const notificationRoutes = require('./modules/notification/notification.routes');



// API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);

// Apply user status check AFTER authentication routes
// This will check if user is suspended/banned on every request
app.use('/api', checkUserStatus);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
const errorHandler = require('./middlewares/error.middleware');
app.use(errorHandler);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;
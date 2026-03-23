// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/Auth.routes'));
app.use('/api/users', require('./routes/User.routes'));
app.use('/api/recipes', require('./routes/Recipe.routes'));
app.use('/api/ingredients', require('./routes/Ingredient.routes'));
app.use('/api/admin', require('./routes/Admin.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

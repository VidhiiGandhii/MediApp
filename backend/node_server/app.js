const express = require('express');
const cors = require('cors');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorMiddleware');
const allRoutes = require('./routes'); // Will import from /routes/index.js

// Create Express app
const app = express();

// ============================================
// GLOBAL MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// =F===========================================
// API ROUTES
// ============================================
app.use('/api', allRoutes);

// ============================================
// HEALTH CHECK & ERROR HANDLERS
// ============================================
app.get('/', (req, res) => {
  res.json({
    message: 'MediApp Backend API',
    status: 'running',
    version: '1.0.0'
  });
});

// 404 Not Found Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
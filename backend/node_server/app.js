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

// NO app.use(authenticateToken) should be here

// ============================================
// API ROUTES
// ============================================
app.use('/api', allRoutes);

// ============================================
// HEALTH CHECK & ERROR HANDLERS
// ============================================
app.get('/', (req, res) => {
  // Debug route to list all registered routes
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Routes registered on routers
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push(`${Object.keys(handler.route.methods).join(', ').toUpperCase()} ${handler.route.path}`);
        }
      });
    }
  });

  res.json({
    message: 'MediApp Backend API',
    status: 'running',
    version: '1.0.0',
    routes: routes.sort()
  });
});

// 404 Not Found Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
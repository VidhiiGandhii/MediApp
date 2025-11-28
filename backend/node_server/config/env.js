require('dotenv').config();

// ============================================
// ENVIRONMENT VARIABLES VALIDATION
// ============================================
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT || 3000,
  PYTHON_API_URL: process.env.PYTHON_API_URL || 'http://localhost:8000',
  OCR_SERVICE_URL: process.env.OCR_SERVICE_URL || 'https://ocr-service-h1eo.onrender.com',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
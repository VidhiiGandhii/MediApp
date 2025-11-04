const app = require('./app');
const { connectDB } = require('./config/db');
const { PORT } = require('./config/env');
const os = require('os');

const startServer = async () => {
  try {
    // 1. Connect to the database
    await connectDB();

    // 2. Start the Express server
    app.listen(PORT, '0.0.0.0', () => {
      const networkInterfaces = os.networkInterfaces();
      const ipAddress = Object.values(networkInterfaces)
        .flat()
        .find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

      console.log('\n' + '='.repeat(70));
      console.log('🚀 MediApp Node.js Backend Started Successfully!');
      console.log('='.repeat(70));
      console.log(`📍 Local:       http://localhost:${PORT}`);
      console.log(`📍 Network:     http://${ipAddress}:${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(70));
      console.log('✅ Database:    Connected to MongoDB Atlas');
      console.log('✅ File Storage: MongoDB GridFS (Files in DB)');
      console.log('✅ JWT:         Authentication enabled');
      console.log('='.repeat(70) + '\n');
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
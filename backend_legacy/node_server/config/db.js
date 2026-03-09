const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { MONGO_URI } = require('./env');

let db;
let filesBucket;

const connectDB = async (retries = 5) => {
  try {
    const connection = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    db = connection.connection.db;
    filesBucket = new GridFSBucket(db, { bucketName: 'documents' });
    
    console.log("✅ Connected to MongoDB Atlas");
    console.log("✅ GridFS bucket initialized for file storage");
  } catch (err) {
    if (retries > 0) {
      console.log(`⏳ Retrying MongoDB connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 3000);
    } else {
      console.error("❌ Failed to connect to MongoDB after retries:", err.message);
      process.exit(1);
    }
  }
};

/**
 * Gets the initialized GridFSBucket instance.
 * @returns {GridFSBucket}
 */
const getBucket = () => {
  if (!filesBucket) {
    throw new Error('GridFS bucket is not initialized. Ensure connectDB() was successful.');
  }
  return filesBucket;
};

module.exports = { connectDB, getBucket };
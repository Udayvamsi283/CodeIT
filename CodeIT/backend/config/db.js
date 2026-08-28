import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas via Mongoose
 * Validates environment variables, prevents duplicate connections,
 * and handles startup failures cleanly.
 */
let isConnected = false;

export async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    const errorMsg = '❌ MongoDB Error: MONGODB_URI environment variable is not defined.';
    console.error(errorMsg);
    throw new Error('MONGODB_URI is required to connect to the database.');
  }

  try {
    const conn = await mongoose.connect(uri.trim(), {
      // Standard recommended Mongoose options
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
  }
}

export default connectDB;

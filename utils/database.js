import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URL; // Ensure you have this set in your environment variables
if (!MONGODB_URI) {
  throw new Error('MONGODB_URL environment variable not defined.');
}

// Caching the connection globally
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectToDB = async () => {
  if (cached.conn) {
    console.log('MongoDB is already connected');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "videoData",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected');
        return mongoose;
      })
      .catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        throw err; // Rethrow to prevent further execution
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err; // Rethrow to prevent further execution
  }
};

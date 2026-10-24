import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGO_URI = process.env.MONGO_URI;

export let isMongoConnected = false;

export const connectDB = async (): Promise<boolean> => {
  if (!MONGO_URI) {
    isMongoConnected = false;
    console.warn('[ReturnHome DB] MONGO_URI is not configured. Authentication and protected data APIs are unavailable.');
    return false;
  }
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log('[ReturnHome DB] Connected to MongoDB.');
    return true;
  } catch (error: any) {
    isMongoConnected = false;
    console.warn(`[ReturnHome DB] MongoDB connection skipped (${error.message}). Authentication and protected data APIs are unavailable.`);
    return false;
  }
};



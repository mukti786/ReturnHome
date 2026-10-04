import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khojsetu';

export let isMongoConnected = false;

export const connectDB = async (): Promise<boolean> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`[ReturnHome DB] Connected to MongoDB: ${MONGO_URI}`);
    return true;
  } catch (error: any) {
    isMongoConnected = false;
    console.warn(`[ReturnHome DB] MongoDB connection skipped (${error.message}). Operating in High-Performance Embedded Store Mode.`);
    return false;
  }
};

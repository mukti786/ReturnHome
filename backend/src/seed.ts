import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { MissingPerson } from './models/MissingPerson';
import { Camera } from './models/Camera';
import { Match } from './models/Match';
import { AuditLog } from './models/AuditLog';
import { initialMemoryStore } from './store/memoryStore';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

const seed = async () => {
  if (!MONGO_URI) throw new Error('Set MONGO_URI before running the seed command.');
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters before seeding.');
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('[ReturnHome Seed] Connected to MongoDB.');

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.findOneAndUpdate(
      { email: ADMIN_EMAIL },
      {
        $set: {
          name: process.env.SEED_ADMIN_NAME || 'ReturnHome Administrator',
          email: ADMIN_EMAIL,
          passwordHash,
          role: 'Admin',
          organization: process.env.SEED_ADMIN_ORGANIZATION || 'Organization Administrator',
          status: 'Active'
        },
        $setOnInsert: { sessionVersion: 0 }
      },
      { upsert: true, new: true, runValidators: true }
    );

    for (const c of initialMemoryStore.cases) {
      await MissingPerson.updateOne({ caseId: c.caseId }, { $setOnInsert: c }, { upsert: true });
    }
    for (const cam of initialMemoryStore.cameras) {
      await Camera.updateOne({ cameraId: cam.cameraId }, { $setOnInsert: cam }, { upsert: true });
    }
    for (const m of initialMemoryStore.matches) {
      await Match.updateOne({ matchId: m.matchId }, { $setOnInsert: m }, { upsert: true });
    }
    if (await AuditLog.countDocuments() === 0) {
      for (const log of initialMemoryStore.auditLogs) await AuditLog.create(log);
    }

    console.log('[ReturnHome Seed] Seed records ensured without deleting existing data.');
    await mongoose.disconnect();
  } catch (error) {
    console.error('[ReturnHome Seed] Seeding error:', error);
    await mongoose.disconnect().catch(() => undefined);
    process.exitCode = 1;
  }
};

void seed();


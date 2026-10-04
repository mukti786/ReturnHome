import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';
import { MissingPerson } from './models/MissingPerson';
import { Camera } from './models/Camera';
import { Match } from './models/Match';
import { AuditLog } from './models/AuditLog';
import { initialMemoryStore } from './store/memoryStore';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khojsetu';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[ReturnHome Seed] Connected to MongoDB...');

    await User.deleteMany({});
    await MissingPerson.deleteMany({});
    await Camera.deleteMany({});
    await Match.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('[ReturnHome Seed] Existing collections cleared.');

    for (const u of initialMemoryStore.users) {
      await User.create({
        name: u.name,
        email: u.email,
        passwordHash: '$2a$10$wN9D9B2/4P6T0L9...mockhash',
        role: u.role,
        organization: u.organization,
        status: u.status
      });
    }

    for (const c of initialMemoryStore.cases) {
      await MissingPerson.create(c);
    }

    for (const cam of initialMemoryStore.cameras) {
      await Camera.create(cam);
    }

    for (const m of initialMemoryStore.matches) {
      await Match.create(m);
    }

    for (const log of initialMemoryStore.auditLogs) {
      await AuditLog.create(log);
    }

    console.log('[ReturnHome Seed] Database seeded successfully with demo investigation profiles!');
    process.exit(0);
  } catch (error) {
    console.error('[ReturnHome Seed] Seeding error:', error);
    process.exit(1);
  }
};

seed();

import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { User, IUser, UserRole, UserStatus } from '../models/User';
import { memoryStore, saveToDisk } from '../store/memoryStore';
import { isMongoConnected } from '../config/db';

export interface UserRecord {
  id: string;
  _id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  status: UserStatus;
  sessionVersion: number;
  avatarUrl?: string;
  bio?: string;
  approvedByName?: string;
  approvedAt?: string | Date;
  rejectedReason?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export class UserService {
  static async findByEmail(email: string, includePassword = false): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    if (isMongoConnected) {
      try {
        const query = User.findOne({ email: normalized });
        if (includePassword) query.select('+passwordHash');
        const doc = await query.lean();
        if (doc) {
          return {
            ...doc,
            id: String(doc._id)
          } as UserRecord;
        }
      } catch (err) {
        console.warn('[ReturnHome UserService] Mongo findByEmail failed, using memory fallback:', err);
      }
    }

    // MemoryStore fallback
    const found = memoryStore.users.find(
      (u: any) => u.email && u.email.toLowerCase() === normalized
    );
    if (!found) return null;
    return {
      ...found,
      id: String(found.id || found._id)
    };
  }

  static async findById(id: string): Promise<UserRecord | null> {
    if (isMongoConnected) {
      try {
        const doc = await User.findById(id).lean();
        if (doc) {
          return {
            ...doc,
            id: String(doc._id)
          } as UserRecord;
        }
      } catch (err) {
        console.warn('[ReturnHome UserService] Mongo findById failed, using memory fallback:', err);
      }
    }

    const found = memoryStore.users.find(
      (u: any) => String(u.id || u._id) === String(id)
    );
    if (!found) return null;
    return {
      ...found,
      id: String(found.id || found._id)
    };
  }

  static async findByGoogleId(googleId: string): Promise<UserRecord | null> {
    if (isMongoConnected) {
      try {
        const doc = await User.findOne({ googleId }).lean();
        if (doc) {
          return {
            ...doc,
            id: String(doc._id)
          } as UserRecord;
        }
      } catch (err) {
        console.warn('[ReturnHome UserService] Mongo findByGoogleId failed, using memory fallback:', err);
      }
    }

    const found = memoryStore.users.find((u: any) => u.googleId === googleId);
    if (!found) return null;
    return {
      ...found,
      id: String(found.id || found._id)
    };
  }

  static async create(data: {
    name: string;
    email: string;
    passwordHash?: string;
    role: UserRole;
    organization?: string;
    phone?: string;
    status: UserStatus;
    googleId?: string;
    avatarUrl?: string;
  }): Promise<UserRecord> {
    const normalizedEmail = data.email.trim().toLowerCase();

    if (isMongoConnected) {
      try {
        const user = await User.create({
          name: data.name.trim(),
          email: normalizedEmail,
          passwordHash: data.passwordHash,
          role: data.role,
          organization: data.organization || '',
          phone: data.phone || '',
          status: data.status,
          googleId: data.googleId,
          avatarUrl: data.avatarUrl || '',
          sessionVersion: 0
        });
        const obj = user.toObject();
        return {
          ...obj,
          id: String(obj._id)
        } as UserRecord;
      } catch (err: any) {
        if (err.code === 11000) {
          const duplicateError: any = new Error('An account with this email already exists.');
          duplicateError.code = 11000;
          throw duplicateError;
        }
        console.warn('[ReturnHome UserService] Mongo create failed, using memory fallback:', err.message);
      }
    }

    // Check duplicate in memoryStore
    const existing = memoryStore.users.find(
      (u: any) => u.email && u.email.toLowerCase() === normalizedEmail
    );
    if (existing) {
      const duplicateError: any = new Error('An account with this email already exists.');
      duplicateError.code = 11000;
      throw duplicateError;
    }

    const newId = `usr-${Date.now()}-${randomUUID().slice(0, 6)}`;
    const newRecord: UserRecord = {
      id: newId,
      name: data.name.trim(),
      email: normalizedEmail,
      passwordHash: data.passwordHash,
      role: data.role,
      organization: data.organization || '',
      phone: data.phone || '',
      status: data.status,
      googleId: data.googleId,
      avatarUrl: data.avatarUrl || '',
      sessionVersion: 0,
      createdAt: new Date().toISOString()
    };

    memoryStore.users.push(newRecord);
    try { saveToDisk(); } catch { /* ignore disk save errors */ }

    return newRecord;
  }

  static async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    if (isMongoConnected) {
      try {
        const doc = await User.findByIdAndUpdate(id, updates, { new: true }).lean();
        if (doc) {
          return {
            ...doc,
            id: String(doc._id)
          } as UserRecord;
        }
      } catch (err) {
        console.warn('[ReturnHome UserService] Mongo update failed, using memory fallback:', err);
      }
    }

    const idx = memoryStore.users.findIndex(
      (u: any) => String(u.id || u._id) === String(id)
    );
    if (idx === -1) return null;

    memoryStore.users[idx] = {
      ...memoryStore.users[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    try { saveToDisk(); } catch { /* ignore */ }

    return memoryStore.users[idx];
  }

  static async incrementSession(id: string): Promise<void> {
    if (isMongoConnected) {
      try {
        await User.findByIdAndUpdate(id, { $inc: { sessionVersion: 1 } });
        return;
      } catch { /* fallback below */ }
    }

    const user = memoryStore.users.find(
      (u: any) => String(u.id || u._id) === String(id)
    );
    if (user) {
      user.sessionVersion = (user.sessionVersion || 0) + 1;
      try { saveToDisk(); } catch { /* ignore */ }
    }
  }

  static async list(filter: { role?: string; status?: string; search?: string } = {}): Promise<UserRecord[]> {
    if (isMongoConnected) {
      try {
        const query: any = {};
        if (filter.role && filter.role !== 'All') query.role = filter.role;
        if (filter.status && filter.status !== 'All') query.status = filter.status;
        if (filter.search) {
          query.$or = [
            { name: { $regex: filter.search, $options: 'i' } },
            { email: { $regex: filter.search, $options: 'i' } },
            { organization: { $regex: filter.search, $options: 'i' } }
          ];
        }
        const docs = await User.find(query).sort({ createdAt: -1 }).lean();
        return docs.map((d: any) => ({ ...d, id: String(d._id) }));
      } catch (err) {
        console.warn('[ReturnHome UserService] Mongo list failed, using memory fallback:', err);
      }
    }

    return memoryStore.users
      .filter((u: any) => {
        if (filter.role && filter.role !== 'All' && u.role !== filter.role) return false;
        if (filter.status && filter.status !== 'All' && u.status !== filter.status) return false;
        if (filter.search) {
          const s = filter.search.toLowerCase();
          const match = (u.name && u.name.toLowerCase().includes(s)) ||
                        (u.email && u.email.toLowerCase().includes(s)) ||
                        (u.organization && u.organization.toLowerCase().includes(s));
          if (!match) return false;
        }
        return true;
      })
      .map((u: any) => ({ ...u, id: String(u.id || u._id) }));
  }
}

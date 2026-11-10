import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'Admin' | 'Investigator' | 'Analyst' | 'Viewer' | 'Citizen';
export type UserStatus = 'Active' | 'Inactive' | 'Pending';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  organization: string;
  phone?: string;
  status: UserStatus;
  sessionVersion: number;
  avatarUrl?: string;
  bio?: string;
  // For investigators: approval tracking
  approvedBy?: Types.ObjectId;
  approvedByName?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true
    },
    passwordHash: { type: String, select: false },
    googleId: { type: String, sparse: true, index: true },
    role: {
      type: String,
      enum: ['Admin', 'Investigator', 'Analyst', 'Viewer', 'Citizen'],
      default: 'Citizen'
    },
    organization: {
      type: String,
      default: '',
      maxlength: 160
    },
    phone: { type: String, maxlength: 40 },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Pending'],
      default: 'Pending',
      index: true
    },
    sessionVersion: { type: Number, default: 0 },
    avatarUrl: { type: String, maxlength: 1000 },
    bio: { type: String, maxlength: 500 },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedByName: { type: String, maxlength: 160 },
    approvedAt: Date,
    rejectedReason: { type: String, maxlength: 500 }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

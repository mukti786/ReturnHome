import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Investigator' | 'Analyst' | 'Viewer';
  organization: string;
  status: 'Active' | 'Inactive' | 'Pending';
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['Admin', 'Investigator', 'Analyst', 'Viewer'], default: 'Investigator' },
    organization: { type: String, default: 'ReturnHome Investigation Unit', maxlength: 160 },
    status: { type: String, enum: ['Active', 'Inactive', 'Pending'], default: 'Pending' },
    sessionVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);


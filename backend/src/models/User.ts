import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Investigator' | 'Analyst' | 'Viewer';
  organization: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Investigator', 'Analyst', 'Viewer'], default: 'Investigator' },
    organization: { type: String, default: 'ReturnHome Investigation Unit' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

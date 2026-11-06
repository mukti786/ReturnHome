import mongoose, { Schema, Document } from 'mongoose';

export interface IMissingPerson extends Document {
  caseId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: string;
  weight: string;
  hairColor: string;
  eyeColor: string;
  distinguishingFeatures: string;
  lastSeenDate: string;
  lastSeenTime: string;
  lastSeenLocation: string;
  latitude?: number;
  longitude?: number;
  description: string;
  clothingDescription: string;
  status: 'Active' | 'Under Investigation' | 'Potential Match' | 'Found' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  photos: string[];
  contactAuthority: string;
  contactNumber: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const MissingPersonSchema: Schema = new Schema(
  {
    caseId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    height: { type: String, default: '' },
    weight: { type: String, default: '' },
    hairColor: { type: String, default: '' },
    eyeColor: { type: String, default: '' },
    distinguishingFeatures: { type: String, default: '' },
    lastSeenDate: { type: String, required: true },
    lastSeenTime: { type: String, default: '' },
    lastSeenLocation: { type: String, required: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    description: { type: String, required: true },
    clothingDescription: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['Active', 'Under Investigation', 'Potential Match', 'Found', 'Closed'], 
      default: 'Active' 
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    photos: [{ type: String }],
    contactAuthority: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    createdBy: { type: String, default: 'Investigator Officer' }
  },
  { timestamps: true }
);

export const MissingPerson = mongoose.model<IMissingPerson>('MissingPerson', MissingPersonSchema);

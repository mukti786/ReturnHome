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
    height: { type: String, default: '5 ft 8 in' },
    weight: { type: String, default: '65 kg' },
    hairColor: { type: String, default: 'Black' },
    eyeColor: { type: String, default: 'Brown' },
    distinguishingFeatures: { type: String, default: 'Mole on right cheek' },
    lastSeenDate: { type: String, required: true },
    lastSeenTime: { type: String, default: '14:00' },
    lastSeenLocation: { type: String, required: true },
    latitude: { type: Number, default: 28.6139 },
    longitude: { type: Number, default: 77.2090 },
    description: { type: String, required: true },
    clothingDescription: { type: String, default: 'Blue jacket, denim jeans, white sneakers' },
    status: { 
      type: String, 
      enum: ['Active', 'Under Investigation', 'Potential Match', 'Found', 'Closed'], 
      default: 'Active' 
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'High' },
    photos: [{ type: String }],
    contactAuthority: { type: String, default: 'Delhi Police - Special Missing Unit' },
    contactNumber: { type: String, default: '+91-11-23410000' },
    createdBy: { type: String, default: 'Investigator Officer' }
  },
  { timestamps: true }
);

export const MissingPerson = mongoose.model<IMissingPerson>('MissingPerson', MissingPersonSchema);

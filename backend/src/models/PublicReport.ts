import mongoose, { Document, Schema } from 'mongoose';

export interface IPublicReport extends Document {
  referenceId: string;
  missingPerson: {
    fullName: string;
    age?: number;
    dateOfBirth?: string;
    gender?: string;
    photoUrl?: string;
    physicalDescription?: string;
    identifyingMarks?: string;
    clothing?: string;
    additionalInformation?: string;
  };
  lastSeen: {
    date?: string;
    time?: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    circumstances?: string;
  };
  reporter: {
    name: string;
    phone?: string;
    email?: string;
    relationship?: string;
    preferredContact?: string;
  };
  status: 'Pending Review' | 'Reviewed';
  createdAt: Date;
  updatedAt: Date;
}

const PublicReportSchema = new Schema<IPublicReport>({
  referenceId: { type: String, required: true, unique: true, index: true },
  missingPerson: {
    fullName: { type: String, required: true, trim: true, maxlength: 160 },
    age: { type: Number, min: 0, max: 130 },
    dateOfBirth: { type: String, maxlength: 20 },
    gender: { type: String, maxlength: 80 },
    photoUrl: { type: String, maxlength: 500 },
    physicalDescription: { type: String, maxlength: 3000 },
    identifyingMarks: { type: String, maxlength: 2000 },
    clothing: { type: String, maxlength: 2000 },
    additionalInformation: { type: String, maxlength: 4000 }
  },
  lastSeen: {
    date: { type: String, maxlength: 20 },
    time: { type: String, maxlength: 20 },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    city: { type: String, maxlength: 120 },
    state: { type: String, maxlength: 120 },
    country: { type: String, maxlength: 120 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    circumstances: { type: String, maxlength: 4000 }
  },
  reporter: {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    phone: { type: String, maxlength: 40 },
    email: { type: String, maxlength: 254 },
    relationship: { type: String, maxlength: 120 },
    preferredContact: { type: String, enum: ['', 'Phone', 'Email'], maxlength: 20 }
  },
  status: { type: String, enum: ['Pending Review', 'Reviewed'], default: 'Pending Review', index: true }
}, { timestamps: true, minimize: false });

export const PublicReport = mongoose.model<IPublicReport>('PublicReport', PublicReportSchema);

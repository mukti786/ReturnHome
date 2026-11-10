import mongoose, { Document, Schema } from 'mongoose';

export type SightingStatus = 'Pending Review' | 'Verified' | 'Rejected';

export interface ISighting extends Document {
  sightingId: string;
  caseId: mongoose.Types.ObjectId;
  caseRef: string;
  reportedBy: mongoose.Types.ObjectId;
  reporterName: string;
  reporterEmail?: string;
  reporterPhone?: string;
  photoUrl?: string;
  dateTimeSeen: Date;
  location: string;
  latitude?: number;
  longitude?: number;
  locationSource: 'citizen_gps' | 'manual_entry';
  notes: string;
  clothingSeen?: string;
  status: SightingStatus;
  reviewNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedByName?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sightingSchema = new Schema<ISighting>(
  {
    sightingId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: 'Case',
      required: true,
      index: true
    },
    caseRef: {
      type: String,
      required: true,
      index: true
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reporterName: {
      type: String,
      required: true,
      trim: true
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    reporterPhone: {
      type: String,
      trim: true
    },
    photoUrl: {
      type: String,
      trim: true
    },
    dateTimeSeen: {
      type: Date,
      required: true,
      default: Date.now
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    locationSource: {
      type: String,
      enum: ['citizen_gps', 'manual_entry'],
      default: 'manual_entry'
    },
    notes: {
      type: String,
      required: true,
      trim: true
    },
    clothingSeen: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending Review', 'Verified', 'Rejected'],
      default: 'Pending Review',
      index: true
    },
    reviewNotes: {
      type: String,
      trim: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedByName: {
      type: String,
      trim: true
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

sightingSchema.index({ caseRef: 1, createdAt: -1 });
sightingSchema.index({ status: 1, createdAt: -1 });

export const Sighting = mongoose.model<ISighting>('Sighting', sightingSchema);

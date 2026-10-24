import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  matchId: string;
  caseId: string;
  missingPersonName: string;
  missingPersonPhoto: string;
  detectedFrameUrl: string;
  cameraId: string;
  cameraName: string;
  location: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  similarityScore: number; // e.g. 0.91
  confidenceTier: 'HIGH' | 'MEDIUM' | 'LOW';
  trackingId: string; // e.g. TRACK-00021
  status: 'Pending Review' | 'Accepted Lead' | 'Rejected' | 'Escalated' | 'Verified';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: Date;
}

const MatchSchema: Schema = new Schema(
  {
    matchId: { type: String, required: true, unique: true },
    caseId: { type: String, required: true },
    missingPersonName: { type: String, required: true },
    missingPersonPhoto: { type: String, required: true },
    detectedFrameUrl: { type: String, required: true },
    cameraId: { type: String, required: true },
    cameraName: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number, default: 28.6139 },
    longitude: { type: Number, default: 77.2090 },
    timestamp: { type: String, required: true },
    similarityScore: { type: Number, required: true },
    confidenceTier: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'HIGH' },
    trackingId: { type: String, default: 'TRACK-00021' },
    status: { 
      type: String, 
      enum: ['Pending Review', 'Accepted Lead', 'Rejected', 'Escalated', 'Verified'], 
      default: 'Pending Review' 
    },
    reviewedBy: { type: String },
    reviewedAt: { type: String },
    notes: { type: String }
  },
  { timestamps: true }
);

export const Match = mongoose.model<IMatch>('Match', MatchSchema);

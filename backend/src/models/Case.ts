import mongoose, { Schema, Document, Types } from 'mongoose';

export type CaseStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Active Investigation'
  | 'Potential Sighting'
  | 'Match Under Verification'
  | 'Located'
  | 'Closed';

export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ICase extends Document {
  caseId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Not Specified';
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
  status: CaseStatus;
  priority: CasePriority;
  photos: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactAuthority: string;
  contactNumber: string;
  createdBy: Types.ObjectId;
  createdByName: string;
  createdByRole: string;
  assignedInvestigator?: Types.ObjectId;
  assignedInvestigatorName?: string;
  faceEmbedding?: number[];
  faceQuality?: {
    blur_score: number;
    lighting_score: number;
    pose_angle: number;
    overall_quality: number;
  };
  activityLog: Array<{
    timestamp: Date;
    userId: Types.ObjectId | string;
    userName: string;
    action: string;
    description: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema: Schema = new Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160, index: true },
    age: { type: Number, required: true, min: 0, max: 130 },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Not Specified'],
      default: 'Not Specified'
    },
    height: { type: String, default: '', maxlength: 80 },
    weight: { type: String, default: '', maxlength: 80 },
    hairColor: { type: String, default: '', maxlength: 120 },
    eyeColor: { type: String, default: '', maxlength: 120 },
    distinguishingFeatures: { type: String, default: '', maxlength: 2000 },
    lastSeenDate: { type: String, required: true, maxlength: 20 },
    lastSeenTime: { type: String, default: '', maxlength: 20 },
    lastSeenLocation: { type: String, required: true, maxlength: 500, index: true },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    description: { type: String, required: true, maxlength: 4000 },
    clothingDescription: { type: String, default: '', maxlength: 2000 },
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Active Investigation',
        'Potential Sighting',
        'Match Under Verification',
        'Located',
        'Closed'
      ],
      default: 'Submitted',
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true
    },
    photos: [{ type: String, maxlength: 1000 }],
    contactName: { type: String, default: '', maxlength: 160 },
    contactPhone: { type: String, default: '', maxlength: 40 },
    contactEmail: { type: String, default: '', maxlength: 254 },
    contactAuthority: { type: String, default: '', maxlength: 200 },
    contactNumber: { type: String, default: '', maxlength: 40 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, required: true, maxlength: 160 },
    createdByRole: { type: String, default: '', maxlength: 40 },
    assignedInvestigator: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedInvestigatorName: { type: String, maxlength: 160 },
    faceEmbedding: { type: [Number], select: false },
    faceQuality: {
      blur_score: Number,
      lighting_score: Number,
      pose_angle: Number,
      overall_quality: Number,
      _id: false
    },
    activityLog: [
      {
        timestamp: { type: Date, default: Date.now },
        userId: { type: Schema.Types.Mixed },
        userName: { type: String, maxlength: 160 },
        action: { type: String, maxlength: 100 },
        description: { type: String, maxlength: 2000 },
        _id: false
      }
    ]
  },
  { timestamps: true }
);

CaseSchema.index({ name: 'text', lastSeenLocation: 'text', description: 'text' });

export const Case = mongoose.model<ICase>('Case', CaseSchema);

import mongoose, { Schema, Document, Types } from 'mongoose';

export type DetectionSource = 'live_camera' | 'video_upload' | 'manual_upload';
export type ReviewStatus = 'Pending Review' | 'Accepted Lead' | 'Rejected' | 'Escalated' | 'Verified';
export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface IDetectionEvent extends Document {
  detectionId: string;
  caseId?: Types.ObjectId;
  caseRef?: string; // Human-readable case ID like MP-2026-0001
  source: DetectionSource;
  cameraId?: string;
  cameraName?: string;
  videoJobId?: Types.ObjectId;
  sourceTimestamp: Date;
  processingTimestamp: Date;
  frameTimestamp?: string; // e.g. "00:03:15" for video
  frameOffset?: number; // seconds into video
  evidenceImageUrl?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  detectionConfidence: number;
  matchingConfidence?: number;
  confidenceTier?: ConfidenceTier;
  cameraLocation?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationSource?: 'camera_config' | 'gps' | 'manual' | 'unknown';
  missingPersonName?: string;
  missingPersonPhoto?: string;
  trackingId?: string;
  reviewStatus: ReviewStatus;
  reviewedBy?: Types.ObjectId;
  reviewedByName?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  faceQuality?: {
    blur_score: number;
    lighting_score: number;
    pose_angle: number;
    overall_quality: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DetectionEventSchema: Schema = new Schema(
  {
    detectionId: { type: String, required: true, unique: true, index: true },
    caseId: { type: Schema.Types.ObjectId, ref: 'Case', index: true },
    caseRef: { type: String, maxlength: 40, index: true },
    source: {
      type: String,
      enum: ['live_camera', 'video_upload', 'manual_upload'],
      required: true
    },
    cameraId: { type: String, maxlength: 60 },
    cameraName: { type: String, maxlength: 200 },
    videoJobId: { type: Schema.Types.ObjectId, ref: 'VideoJob' },
    sourceTimestamp: { type: Date, required: true, index: true },
    processingTimestamp: { type: Date, required: true },
    frameTimestamp: { type: String, maxlength: 20 },
    frameOffset: { type: Number, min: 0 },
    evidenceImageUrl: { type: String, maxlength: 1000 },
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      _id: false
    },
    detectionConfidence: { type: Number, min: 0, max: 1, required: true },
    matchingConfidence: { type: Number, min: 0, max: 1 },
    confidenceTier: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
    cameraLocation: { type: String, maxlength: 500 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    locationAccuracy: { type: Number, min: 0 },
    locationSource: {
      type: String,
      enum: ['camera_config', 'gps', 'manual', 'unknown'],
      default: 'unknown'
    },
    missingPersonName: { type: String, maxlength: 160 },
    missingPersonPhoto: { type: String, maxlength: 1000 },
    trackingId: { type: String, maxlength: 60 },
    reviewStatus: {
      type: String,
      enum: ['Pending Review', 'Accepted Lead', 'Rejected', 'Escalated', 'Verified'],
      default: 'Pending Review',
      index: true
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedByName: { type: String, maxlength: 160 },
    reviewedAt: Date,
    reviewNotes: { type: String, maxlength: 4000 },
    faceQuality: {
      blur_score: Number,
      lighting_score: Number,
      pose_angle: Number,
      overall_quality: Number,
      _id: false
    }
  },
  { timestamps: true }
);

DetectionEventSchema.index({ caseId: 1, reviewStatus: 1 });
DetectionEventSchema.index({ sourceTimestamp: -1 });

export const DetectionEvent = mongoose.model<IDetectionEvent>('DetectionEvent', DetectionEventSchema);

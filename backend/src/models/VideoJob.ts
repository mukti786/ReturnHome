import mongoose, { Schema, Document, Types } from 'mongoose';

export type VideoJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface IVideoJob extends Document {
  jobId: string;
  caseId?: Types.ObjectId;
  caseRef?: string;
  cameraId?: string;
  cameraName?: string;
  cameraLocation?: string;
  cameraLatitude?: number;
  cameraLongitude?: number;
  uploadedBy: Types.ObjectId;
  uploadedByName: string;
  originalFilename: string;
  storedFilename: string;
  storedPath: string;
  fileSizeBytes: number;
  mimeType: string;
  status: VideoJobStatus;
  progress: number; // 0-100
  framesAnalyzed: number;
  facesDetected: number;
  candidateMatchesFound: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  detectionEventIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const VideoJobSchema: Schema = new Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    caseId: { type: Schema.Types.ObjectId, ref: 'Case', index: true },
    caseRef: { type: String, maxlength: 40 },
    cameraId: { type: String, maxlength: 60 },
    cameraName: { type: String, maxlength: 200 },
    cameraLocation: { type: String, maxlength: 500 },
    cameraLatitude: { type: Number, min: -90, max: 90 },
    cameraLongitude: { type: Number, min: -180, max: 180 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedByName: { type: String, required: true, maxlength: 160 },
    originalFilename: { type: String, required: true, maxlength: 500 },
    storedFilename: { type: String, required: true, maxlength: 500 },
    storedPath: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true, min: 0 },
    mimeType: { type: String, required: true, maxlength: 100 },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
      index: true
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    framesAnalyzed: { type: Number, default: 0 },
    facesDetected: { type: Number, default: 0 },
    candidateMatchesFound: { type: Number, default: 0 },
    error: { type: String, maxlength: 2000 },
    startedAt: Date,
    completedAt: Date,
    detectionEventIds: [{ type: Schema.Types.ObjectId, ref: 'DetectionEvent' }]
  },
  { timestamps: true }
);

export const VideoJob = mongoose.model<IVideoJob>('VideoJob', VideoJobSchema);

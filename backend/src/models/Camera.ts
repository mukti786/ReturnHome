import mongoose, { Schema, Document } from 'mongoose';

export type CameraStatus = 'Online' | 'Offline' | 'Maintenance';
export type CameraType = 'Fixed Optical' | 'PTZ Dome' | 'Traffic Surveillance' | 'Live Browser Ingestion' | 'Other';

export interface ICamera extends Document {
  cameraId: string;
  name: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  status: CameraStatus;
  cameraType: CameraType;
  resolution: string;
  fps: number;
  registeredBy: string;
  registeredById: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CameraSchema: Schema = new Schema(
  {
    cameraId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    location: { type: String, required: true, maxlength: 500 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    locationAccuracy: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ['Online', 'Offline', 'Maintenance'],
      default: 'Online'
    },
    cameraType: {
      type: String,
      enum: ['Fixed Optical', 'PTZ Dome', 'Traffic Surveillance', 'Live Browser Ingestion', 'Other'],
      default: 'Other'
    },
    resolution: { type: String, default: '1080p Full HD', maxlength: 60 },
    fps: { type: Number, default: 30, min: 1, max: 120 },
    registeredBy: { type: String, default: '' },
    registeredById: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Camera = mongoose.model<ICamera>('Camera', CameraSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ICamera extends Document {
  cameraId: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'Online' | 'Offline' | 'Maintenance';
  resolution: string;
  fps: number;
}

const CameraSchema: Schema = new Schema(
  {
    cameraId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: { type: String, enum: ['Online', 'Offline', 'Maintenance'], default: 'Online' },
    resolution: { type: String, default: '1080p Full HD' },
    fps: { type: Number, default: 30 }
  },
  { timestamps: true }
);

export const Camera = mongoose.model<ICamera>('Camera', CameraSchema);

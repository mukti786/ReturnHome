import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'case_status'
  | 'sighting_received'
  | 'sighting_reviewed'
  | 'detection_match'
  | 'system';

export interface INotification extends Document {
  notificationId: string;
  recipient?: mongoose.Types.ObjectId;
  recipientRole?: 'Admin' | 'Investigator' | 'Citizen' | 'Analyst';
  title: string;
  message: string;
  type: NotificationType;
  caseRef?: string;
  link?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    notificationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    recipientRole: {
      type: String,
      enum: ['Admin', 'Investigator', 'Citizen', 'Analyst'],
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['case_status', 'sighting_received', 'sighting_reviewed', 'detection_match', 'system'],
      default: 'system',
      index: true
    },
    caseRef: {
      type: String,
      trim: true,
      index: true
    },
    link: {
      type: String,
      trim: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);

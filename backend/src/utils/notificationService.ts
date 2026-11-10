import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { Notification, NotificationType } from '../models/Notification';
import { isMongoConnected } from '../config/db';

export interface SendNotificationOptions {
  recipientId?: string | mongoose.Types.ObjectId;
  recipientRole?: 'Admin' | 'Investigator' | 'Citizen' | 'Analyst';
  title: string;
  message: string;
  type: NotificationType;
  caseRef?: string;
  link?: string;
}

export async function createAndSendNotification(opts: SendNotificationOptions) {
  try {
    if (!isMongoConnected) return null;

    const notificationId = `NOTIF-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const doc = await Notification.create({
      notificationId,
      recipient: opts.recipientId ? new mongoose.Types.ObjectId(String(opts.recipientId)) : undefined,
      recipientRole: opts.recipientRole,
      title: opts.title,
      message: opts.message,
      type: opts.type,
      caseRef: opts.caseRef,
      link: opts.link,
      read: false
    });

    const io = (global as any).__returnhome_io;
    if (io) {
      io.emit('notification:new', {
        notificationId: doc.notificationId,
        recipient: opts.recipientId ? String(opts.recipientId) : null,
        recipientRole: opts.recipientRole,
        title: doc.title,
        message: doc.message,
        type: doc.type,
        caseRef: doc.caseRef,
        link: doc.link,
        createdAt: doc.createdAt
      });
    }

    return doc;
  } catch (err: any) {
    console.warn('[ReturnHome Notification] Error creating notification:', err.message);
    return null;
  }
}

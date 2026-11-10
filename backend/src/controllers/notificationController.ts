import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import { Notification } from '../models/Notification';
import { isMongoConnected } from '../config/db';

function dbUnavailable(res: Response) {
  return res.status(503).json({ success: false, message: 'Database is unavailable. Please try again later.' });
}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { unreadOnly, page = 1, limit = 20 } = req.query;

    const recipientFilter: any = [];
    if (mongoose.isValidObjectId(user.id)) {
      recipientFilter.push({ recipient: new mongoose.Types.ObjectId(user.id) });
    }
    if (['Admin', 'Investigator', 'Analyst'].includes(user.role)) {
      recipientFilter.push({ recipientRole: user.role });
    }

    const filter: Record<string, any> = recipientFilter.length > 0 ? { $or: recipientFilter } : {};

    if (String(unreadOnly) === 'true') {
      filter.read = false;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, unreadCount, notifications] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, read: false }),
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return res.json({
      success: true,
      total,
      unreadCount,
      page: pageNum,
      limit: limitNum,
      notifications
    });
  } catch (error: any) {
    console.error('[ReturnHome Notification] Get error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch notifications.' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const recipientFilter: any = [];
    if (mongoose.isValidObjectId(user.id)) {
      recipientFilter.push({ recipient: new mongoose.Types.ObjectId(user.id) });
    }
    if (['Admin', 'Investigator', 'Analyst'].includes(user.role)) {
      recipientFilter.push({ recipientRole: user.role });
    }

    const count = await Notification.countDocuments({
      ...(recipientFilter.length > 0 ? { $or: recipientFilter } : {}),
      read: false
    });

    return res.json({ success: true, count });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to get unread count.' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { id } = req.params;
    const recipientConditions: any = [];
    if (mongoose.isValidObjectId(user.id)) {
      recipientConditions.push({ recipient: new mongoose.Types.ObjectId(user.id) });
    }
    recipientConditions.push({ recipientRole: user.role });

    const notification = await Notification.findOneAndUpdate(
      {
        $and: [
          { $or: [{ notificationId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined }] },
          { $or: recipientConditions }
        ]
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found or access denied.' });
    }

    return res.json({ success: true, notification });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to mark notification as read.' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const recipientFilter: any = [];
    if (mongoose.isValidObjectId(user.id)) {
      recipientFilter.push({ recipient: new mongoose.Types.ObjectId(user.id) });
    }
    if (['Admin', 'Investigator', 'Analyst'].includes(user.role)) {
      recipientFilter.push({ recipientRole: user.role });
    }

    await Notification.updateMany(
      {
        ...(recipientFilter.length > 0 ? { $or: recipientFilter } : {}),
        read: false
      },
      { read: true }
    );

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to mark all as read.' });
  }
};

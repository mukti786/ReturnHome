import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import { Notification } from '../models/Notification';
import { isMongoConnected } from '../config/db';

function dbUnavailable(res: Response) {
  return res.status(503).json({ success: false, message: 'Database is unavailable. Please try again later.' });
}

const inMemoryNotifications = [
  {
    notificationId: 'notif-1',
    title: 'New Sighting Submitted',
    message: 'A citizen reported a potential sighting near Botanical Garden Metro for Case MP-2026-0001 (Aarav Sharma).',
    type: 'sighting',
    priority: 'high',
    read: false,
    link: '/cases/MP-2026-0001',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    notificationId: 'notif-2',
    title: 'AI Video Analysis Completed',
    message: 'Video job VID-DEMO-2026 processed 1,840 frames. 2 candidate leads identified for investigator review.',
    type: 'detection',
    priority: 'medium',
    read: false,
    link: '/evidence',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    notificationId: 'notif-3',
    title: 'Investigator Access Request',
    message: 'Officer Rajesh Kumar submitted an access application for Crime Branch Unit. Review required.',
    type: 'system',
    priority: 'low',
    read: true,
    link: '/users',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    if (!isMongoConnected) {
      const { unreadOnly, page = 1, limit = 20 } = req.query;
      let list = inMemoryNotifications;
      if (String(unreadOnly) === 'true') list = list.filter(n => !n.read);
      const total = list.length;
      const unreadCount = inMemoryNotifications.filter(n => !n.read).length;
      const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 20));
      const notifications = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);
      return res.json({ success: true, total, unreadCount, page: pageNum, limit: limitNum, notifications });
    }

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
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    if (!isMongoConnected) {
      const count = inMemoryNotifications.filter(n => !n.read).length;
      return res.json({ success: true, count });
    }

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
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { id } = req.params;

    if (!isMongoConnected) {
      const found = inMemoryNotifications.find(n => n.notificationId === id);
      if (found) found.read = true;
      return res.json({ success: true, notification: found || { notificationId: id, read: true } });
    }
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
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    if (!isMongoConnected) {
      inMemoryNotifications.forEach(n => { n.read = true; });
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

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

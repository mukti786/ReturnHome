import { Request, Response } from 'express';
import { memoryStore } from '../store/memoryStore';
import { isMongoConnected } from '../config/db';
import { AuditLog } from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { action, resource, search, page = 1, limit = 20 } = req.query;

    if (isMongoConnected) {
      const filter: Record<string, any> = {};
      if (action && action !== 'All') filter.action = action;
      if (resource && resource !== 'All') filter.resource = resource;
      if (search) {
        const q = String(search).trim();
        filter.$or = [
          { userName: { $regex: q, $options: 'i' } },
          { details: { $regex: q, $options: 'i' } },
          { action: { $regex: q, $options: 'i' } }
        ];
      }

      const total = await AuditLog.countDocuments(filter);
      const logs = await AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean();

      if (total > 0 || logs.length > 0) {
        return res.json({
          success: true,
          total,
          page: Number(page),
          limit: Number(limit),
          logs: logs.map((l: any) => ({
            id: String(l._id),
            userId: String(l.userId),
            userName: l.userName,
            userRole: l.userRole,
            action: l.action,
            resource: l.resource,
            resourceId: l.resourceId,
            ipAddress: l.ipAddress,
            details: l.details,
            timestamp: l.timestamp ? new Date(l.timestamp).toISOString() : new Date().toISOString()
          }))
        });
      }
    }

    // Fallback to memoryStore
    let filtered = [...memoryStore.auditLogs];

    if (action && action !== 'All') {
      filtered = filtered.filter(l => l.action === action);
    }
    if (resource && resource !== 'All') {
      filtered = filtered.filter(l => l.resource === resource);
    }
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        l => l.userName.toLowerCase().includes(q) ||
             l.details.toLowerCase().includes(q) ||
             l.action.toLowerCase().includes(q)
      );
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = filtered.slice(startIndex, startIndex + Number(limit));

    return res.json({
      success: true,
      total: filtered.length,
      page: Number(page),
      limit: Number(limit),
      logs: paginated
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import { Request, Response } from 'express';
import { memoryStore } from '../store/memoryStore';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { action, resource, search, page = 1, limit = 20 } = req.query;

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

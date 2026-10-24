import { Request, Response } from 'express';
import { memoryStore } from '../store/memoryStore';
import { AuthRequest } from '../middleware/authMiddleware';

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { status, caseId, minScore, cameraId } = req.query;

    let filtered = [...memoryStore.matches];

    if (status && status !== 'All') {
      filtered = filtered.filter(m => m.status === status);
    }

    if (caseId) {
      filtered = filtered.filter(m => m.caseId === caseId);
    }

    if (cameraId && cameraId !== 'All') {
      filtered = filtered.filter(m => m.cameraId === cameraId);
    }

    if (minScore) {
      filtered = filtered.filter(m => m.similarityScore >= Number(minScore));
    }

    // Sort by similarity score descending
    filtered.sort((a, b) => b.similarityScore - a.similarityScore);

    return res.json({
      success: true,
      total: filtered.length,
      matches: filtered,
      disclaimer: 'AI-generated matches are potential leads only and must be independently verified by authorized personnel.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const match = memoryStore.matches.find(m => m.matchId === id || m._id === id);

    if (!match) {
      return res.status(404).json({ success: false, message: 'Candidate match record not found.' });
    }

    const relatedCase = memoryStore.cases.find(c => c.caseId === match.caseId);

    return res.json({
      success: true,
      match,
      case: relatedCase,
      disclaimer: 'AI-generated matches are potential leads only and must be independently verified by authorized personnel.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status || !['Accepted Lead', 'Rejected', 'Escalated', 'Verified'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid review status is required (Accepted Lead, Rejected, Escalated, Verified).'
      });
    }

    const matchIndex = memoryStore.matches.findIndex(m => m.matchId === id || m._id === id);
    if (matchIndex === -1) {
      return res.status(404).json({ success: false, message: 'Match record not found.' });
    }

    const match = memoryStore.matches[matchIndex];
    const reviewerName = req.user?.name || 'Authorized Investigator';

    match.status = status;
    match.reviewedBy = reviewerName;
    match.reviewedAt = new Date().toISOString();
    match.notes = notes || `Investigator verification performed by ${reviewerName}.`;

    memoryStore.matches[matchIndex] = match;

    // Update Case status if Accepted Lead or Verified
    const caseIndex = memoryStore.cases.findIndex(c => c.caseId === match.caseId);
    if (caseIndex !== -1) {
      if (status === 'Accepted Lead' || status === 'Verified') {
        memoryStore.cases[caseIndex].status = 'Potential Match';
      }
    }

    // Add Timeline Event
    memoryStore.timeline.unshift({
      id: `evt-${Date.now()}`,
      caseId: match.caseId,
      timestamp: new Date().toISOString(),
      user: reviewerName,
      action: 'Investigator Match Review',
      description: `Candidate Match ${match.matchId} on ${match.cameraName} marked as '${status}'. Notes: ${match.notes}`
    });

    // Add Audit Log
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'usr-admin-1',
      userName: reviewerName,
      userRole: req.user?.role || 'Admin',
      action: 'MATCH_VERIFY',
      resource: 'Matches',
      resourceId: match.matchId,
      ipAddress: req.ip || '127.0.0.1',
      details: `Match ${match.matchId} for case ${match.caseId} reviewed. Status: ${status}. Score: ${Math.round(match.similarityScore * 100)}%.`,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      match,
      message: `Candidate match review updated to '${status}'.`,
      disclaimer: 'AI-generated matches are potential leads only and must be independently verified by authorized personnel.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

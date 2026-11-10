import { Request, Response } from 'express';
import { memoryStore, saveToDisk } from '../store/memoryStore';
import { AuthRequest } from '../middleware/authMiddleware';
import { isMongoConnected } from '../config/db';
import { DetectionEvent } from '../models/DetectionEvent';
import { Case } from '../models/Case';
import { AuditLog } from '../models/AuditLog';

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { status, caseId, minScore, cameraId } = req.query;

    let matches: any[] = [];

    if (isMongoConnected) {
      const filter: Record<string, any> = {};
      if (status && status !== 'All') filter.reviewStatus = status;
      if (caseId) filter.caseRef = caseId;
      if (cameraId && cameraId !== 'All') filter.cameraId = cameraId;
      if (minScore) filter.matchingConfidence = { $gte: Number(minScore) };

      const detections = await DetectionEvent.find(filter)
        .sort({ matchingConfidence: -1, sourceTimestamp: -1 })
        .limit(100)
        .lean();

      matches = detections.map((d: any) => ({
        matchId: d.detectionId,
        caseId: d.caseRef || '',
        missingPersonName: d.missingPersonName || '',
        missingPersonPhoto: d.missingPersonPhoto || '',
        detectedFrameUrl: d.evidenceImageUrl || '',
        cameraId: d.cameraId || '',
        cameraName: d.cameraName || '',
        location: d.cameraLocation || '',
        latitude: d.latitude || 28.6139,
        longitude: d.longitude || 77.2090,
        timestamp: d.sourceTimestamp ? new Date(d.sourceTimestamp).toISOString() : new Date().toISOString(),
        similarityScore: d.matchingConfidence || d.detectionConfidence || 0,
        confidenceTier: d.confidenceTier || 'MEDIUM',
        trackingId: d.trackingId || '',
        status: d.reviewStatus || 'Pending Review',
        reviewedBy: d.reviewedByName,
        reviewedAt: d.reviewedAt ? new Date(d.reviewedAt).toISOString() : undefined,
        notes: d.reviewNotes || '',
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString()
      }));
    }

    // Include memoryStore items if not already in matches
    const existingIds = new Set(matches.map(m => m.matchId));
    let storeFiltered = [...memoryStore.matches].filter(m => !existingIds.has(m.matchId));

    if (status && status !== 'All') {
      storeFiltered = storeFiltered.filter(m => m.status === status);
    }
    if (caseId) {
      storeFiltered = storeFiltered.filter(m => m.caseId === caseId);
    }
    if (cameraId && cameraId !== 'All') {
      storeFiltered = storeFiltered.filter(m => m.cameraId === cameraId);
    }
    if (minScore) {
      storeFiltered = storeFiltered.filter(m => m.similarityScore >= Number(minScore));
    }

    const allMatches = [...matches, ...storeFiltered].sort((a, b) => b.similarityScore - a.similarityScore);

    return res.json({
      success: true,
      total: allMatches.length,
      matches: allMatches,
      disclaimer: 'Candidate records and generic image-feature similarities are unverified suggestions, not confirmed identities or sightings.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let match: any = null;
    let relatedCase: any = null;

    if (isMongoConnected) {
      const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { detectionId: id };
      const d = await DetectionEvent.findOne(filter).lean();
      if (d) {
        match = {
          matchId: (d as any).detectionId,
          caseId: (d as any).caseRef || '',
          missingPersonName: (d as any).missingPersonName || '',
          missingPersonPhoto: (d as any).missingPersonPhoto || '',
          detectedFrameUrl: (d as any).evidenceImageUrl || '',
          cameraId: (d as any).cameraId || '',
          cameraName: (d as any).cameraName || '',
          location: (d as any).cameraLocation || '',
          latitude: (d as any).latitude || 28.6139,
          longitude: (d as any).longitude || 77.2090,
          timestamp: (d as any).sourceTimestamp,
          similarityScore: (d as any).matchingConfidence || (d as any).detectionConfidence || 0,
          confidenceTier: (d as any).confidenceTier || 'MEDIUM',
          trackingId: (d as any).trackingId || '',
          status: (d as any).reviewStatus || 'Pending Review',
          reviewedBy: (d as any).reviewedByName,
          reviewedAt: (d as any).reviewedAt,
          notes: (d as any).reviewNotes || '',
          createdAt: (d as any).createdAt
        };

        if ((d as any).caseId || (d as any).caseRef) {
          const caseFilter = (d as any).caseId ? { _id: (d as any).caseId } : { caseId: (d as any).caseRef };
          relatedCase = await Case.findOne(caseFilter).select('-faceEmbedding').lean();
        }
      }
    }

    if (!match) {
      match = memoryStore.matches.find(m => m.matchId === id || m._id === id);
      if (match) {
        relatedCase = memoryStore.cases.find(c => c.caseId === match.caseId);
      }
    }

    if (!match) {
      return res.status(404).json({ success: false, message: 'Candidate match record not found.' });
    }

    return res.json({
      success: true,
      match,
      case: relatedCase,
      disclaimer: 'Candidate records and generic image-feature similarities are unverified suggestions, not confirmed identities or sightings.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';

    if (!status || !['Accepted Lead', 'Rejected', 'Escalated', 'Verified'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid review status is required (Accepted Lead, Rejected, Escalated, Verified).'
      });
    }
    if (!notes || notes.length > 4000) {
      return res.status(400).json({ success: false, message: 'Enter review notes (up to 4,000 characters) before saving this decision.' });
    }

    const reviewerName = req.user?.name || 'Authorized Investigator';
    let updatedMatch: any = null;

    if (isMongoConnected) {
      const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { detectionId: id };
      const d = await DetectionEvent.findOneAndUpdate(
        filter,
        {
          reviewStatus: status,
          reviewedBy: req.user?.id,
          reviewedByName: reviewerName,
          reviewedAt: new Date(),
          reviewNotes: notes
        },
        { new: true }
      ).lean();

      if (d) {
        // Update case status if Accepted Lead or Verified
        if (status === 'Accepted Lead' || status === 'Verified') {
          const newStatus = status === 'Verified' ? 'Match Under Verification' : 'Potential Sighting';
          const caseFilter = (d as any).caseId ? { _id: (d as any).caseId } : { caseId: (d as any).caseRef };
          await Case.findOneAndUpdate(caseFilter, {
            status: newStatus,
            $push: {
              activityLog: {
                timestamp: new Date(),
                userId: req.user?.id || 'system',
                userName: reviewerName,
                action: 'Match Reviewed',
                description: `Candidate lead ${(d as any).detectionId} reviewed: ${status}. Notes: ${notes}`
              }
            }
          });
        }

        await AuditLog.create({
          userId: req.user?.id || 'system',
          userName: reviewerName,
          userRole: req.user?.role || 'Investigator',
          action: 'MATCH_VERIFY',
          resource: 'Matches',
          resourceId: (d as any).detectionId,
          ipAddress: req.ip || '127.0.0.1',
          details: `Match ${(d as any).detectionId} reviewed. Status: ${status}.`,
          timestamp: new Date()
        }).catch(() => undefined);

        updatedMatch = {
          matchId: (d as any).detectionId,
          caseId: (d as any).caseRef || '',
          missingPersonName: (d as any).missingPersonName || '',
          status,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString(),
          notes
        };
      }
    }

    // Update in memoryStore as well if present
    const matchIndex = memoryStore.matches.findIndex(m => m.matchId === id || m._id === id);
    if (matchIndex !== -1) {
      const match = memoryStore.matches[matchIndex];
      match.status = status;
      match.reviewedBy = reviewerName;
      match.reviewedAt = new Date().toISOString();
      match.notes = notes;
      memoryStore.matches[matchIndex] = match;

      const caseIndex = memoryStore.cases.findIndex(c => c.caseId === match.caseId);
      if (caseIndex !== -1 && (status === 'Accepted Lead' || status === 'Verified')) {
        memoryStore.cases[caseIndex].status = 'Potential Match';
      }

      memoryStore.timeline.unshift({
        id: `evt-${Date.now()}`,
        caseId: match.caseId,
        timestamp: new Date().toISOString(),
        user: reviewerName,
        action: 'Investigator Match Review',
        description: `Candidate Match ${match.matchId} marked as '${status}'. Notes: ${match.notes}`
      });

      memoryStore.auditLogs.unshift({
        id: `log-${Date.now()}`,
        userId: req.user?.id || 'usr-admin-1',
        userName: reviewerName,
        userRole: req.user?.role || 'Admin',
        action: 'MATCH_VERIFY',
        resource: 'Matches',
        resourceId: match.matchId,
        ipAddress: req.ip || '127.0.0.1',
        details: `Match ${match.matchId} reviewed. Status: ${status}.`,
        timestamp: new Date().toISOString()
      });

      try { saveToDisk(); } catch { /* ignore */ }
      if (!updatedMatch) updatedMatch = match;
    }

    if (!updatedMatch) {
      return res.status(404).json({ success: false, message: 'Match record not found.' });
    }

    return res.json({
      success: true,
      match: updatedMatch,
      message: `Candidate match review updated to '${status}'.`,
      disclaimer: 'Candidate records and generic image-feature similarities are unverified suggestions, not confirmed identities or sightings.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

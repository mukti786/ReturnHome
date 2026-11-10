import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { DetectionEvent } from '../models/DetectionEvent';
import { Case } from '../models/Case';
import { isMongoConnected } from '../config/db';

function dbUnavailable(res: Response) {
  return res.status(503).json({ success: false, message: 'Database is unavailable. Please try again later.' });
}

export interface UnifiedEvidenceItem {
  id: string;
  evidenceType: 'detection_frame' | 'sighting_photo' | 'reference_photo';
  caseRef?: string;
  missingPersonName?: string;
  source: string;
  sourceLabel: string;
  imageUrl: string;
  timestamp: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
  confidence?: number;
  confidenceTier?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  frameOffset?: number;
  frameTimestamp?: string;
  reviewStatus: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  notes?: string;
  cameraId?: string;
  cameraName?: string;
}

export const getEvidence = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const {
      source,
      caseRef,
      reviewStatus,
      confidenceMin,
      search,
      page = 1,
      limit = 24
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 24));

    // Detection query
    const detectionFilter: Record<string, any> = {};
    if (caseRef) detectionFilter.caseRef = String(caseRef);
    if (reviewStatus && reviewStatus !== 'all') detectionFilter.reviewStatus = String(reviewStatus);
    if (confidenceMin) detectionFilter.detectionConfidence = { $gte: Number(confidenceMin) };
    if (source && (source === 'live_camera' || source === 'video_upload')) {
      detectionFilter.source = source;
    }

    if (search) {
      const q = String(search).trim();
      detectionFilter.$or = [
        { caseRef: { $regex: q, $options: 'i' } },
        { missingPersonName: { $regex: q, $options: 'i' } },
        { cameraName: { $regex: q, $options: 'i' } },
        { cameraLocation: { $regex: q, $options: 'i' } }
      ];
    }

    // Role check: citizen can only view evidence for their own cases
    const isInvestigatorOrAdmin = ['Admin', 'Investigator', 'Analyst'].includes(user.role);
    if (!isInvestigatorOrAdmin) {
      const myCases = await Case.find({ createdBy: user.id }).select('caseId').lean();
      const myCaseRefs = myCases.map((c: any) => c.caseId);
      detectionFilter.caseRef = { $in: myCaseRefs };
    }

    const [detections, totalDetections] = await Promise.all([
      DetectionEvent.find(detectionFilter)
        .sort({ processingTimestamp: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      DetectionEvent.countDocuments(detectionFilter)
    ]);

    const items: UnifiedEvidenceItem[] = detections.map((d: any) => ({
      id: d.detectionId || String(d._id),
      evidenceType: 'detection_frame',
      caseRef: d.caseRef,
      missingPersonName: d.missingPersonName,
      source: d.source,
      sourceLabel: d.source === 'live_camera' ? 'Live Camera Feed' : 'Recorded Video Footage',
      imageUrl: d.evidenceImageUrl,
      timestamp: d.processingTimestamp || d.sourceTimestamp,
      location: d.cameraLocation,
      latitude: d.latitude,
      longitude: d.longitude,
      locationSource: d.locationSource || 'camera_config',
      confidence: d.detectionConfidence || d.matchingConfidence,
      confidenceTier: d.confidenceTier,
      boundingBox: d.boundingBox,
      frameOffset: d.frameOffset,
      frameTimestamp: d.frameTimestamp,
      reviewStatus: d.reviewStatus || 'Pending Review',
      reviewedByName: d.reviewedByName,
      reviewedAt: d.reviewedAt,
      notes: d.reviewNotes,
      cameraId: d.cameraId,
      cameraName: d.cameraName
    }));

    return res.json({
      success: true,
      total: totalDetections,
      page: pageNum,
      limit: limitNum,
      evidence: items
    });
  } catch (error: any) {
    console.error('[ReturnHome Evidence] Get error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch evidence.' });
  }
};

export const getEvidenceById = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const id = req.params.id;
    const detection = await DetectionEvent.findOne({
      $or: [{ detectionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined }]
    }).populate('caseId');

    if (!detection) {
      return res.status(404).json({ success: false, message: 'Evidence record not found.' });
    }

    const isInvestigatorOrAdmin = ['Admin', 'Investigator', 'Analyst'].includes(user.role);
    if (!isInvestigatorOrAdmin) {
      const targetCase = detection.caseId as any;
      if (!targetCase || String(targetCase.createdBy) !== user.id) {
        return res.status(403).json({ success: false, message: 'Access denied to this evidence item.' });
      }
    }

    return res.json({
      success: true,
      evidence: detection
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch evidence details.' });
  }
};

export const exportEvidenceDossier = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const id = req.params.id;
    const detection = await DetectionEvent.findOne({
      $or: [{ detectionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined }]
    }).populate('caseId');

    if (!detection) {
      return res.status(404).json({ success: false, message: 'Evidence record not found.' });
    }

    const dossier = {
      dossierId: `DOSSIER-${detection.detectionId}`,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      evidenceItem: {
        detectionId: detection.detectionId,
        source: detection.source,
        cameraId: detection.cameraId,
        cameraName: detection.cameraName,
        location: detection.cameraLocation,
        timestamp: detection.processingTimestamp,
        frameOffset: detection.frameOffset,
        frameTimestamp: detection.frameTimestamp,
        imageUrl: detection.evidenceImageUrl,
        boundingBox: detection.boundingBox,
        detectionConfidence: detection.detectionConfidence,
        matchingConfidence: detection.matchingConfidence,
        confidenceTier: detection.confidenceTier,
        reviewStatus: detection.reviewStatus,
        reviewedByName: detection.reviewedByName,
        reviewedAt: detection.reviewedAt,
        reviewNotes: detection.reviewNotes
      },
      caseMetadata: detection.caseId ? {
        caseId: (detection.caseId as any).caseId,
        name: (detection.caseId as any).name,
        status: (detection.caseId as any).status,
        lastSeenLocation: (detection.caseId as any).lastSeenLocation,
        lastSeenDate: (detection.caseId as any).lastSeenDate
      } : null,
      chainOfCustodyNotice: 'Official ReturnHome Evidence Export. Generated for verified investigative purposes.'
    };

    return res.json({
      success: true,
      dossier
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to export evidence dossier.' });
  }
};

import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';
import { AIService } from '../services/aiService';
import { DetectionEvent } from '../models/DetectionEvent';
import { Case } from '../models/Case';
import { Camera } from '../models/Camera';
import { AuditLog } from '../models/AuditLog';
import { isMongoConnected } from '../config/db';
import { memoryStore, saveToDisk } from '../store/memoryStore';

function dbUnavailable(res: Response) {
  return res.status(503).json({ success: false, message: 'Database is unavailable. Please try again later.' });
}

async function writeAuditLog(data: any) {
  try {
    if (isMongoConnected) await AuditLog.create({ ...data, timestamp: new Date() });
  } catch { /* ignore */ }
}

/**
 * Process a live webcam/CCTV frame.
 * Receives a multipart upload of a JPEG frame, runs face detection + matching,
 * and returns candidate matches. Saves evidence images and DetectionEvents.
 */
export const processLiveFrame = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No frame image provided.' });
  }

  const framePath = req.file.path;

  try {
    const { cameraId, cameraName, cameraLocation, threshold } = req.body;

    if (!cameraId) {
      fs.unlinkSync(framePath);
      return res.status(400).json({ success: false, message: 'Camera ID is required.' });
    }

    // Look up camera configuration for location data
    const camera = await Camera.findOne({ cameraId }).select('latitude longitude location name').lean();

    // Load active case embeddings
    const activeCases = await Case.find({
      status: { $nin: ['Located', 'Closed'] },
      faceEmbedding: { $exists: true, $not: { $size: 0 } }
    }).select('caseId name faceEmbedding photos').lean();

    const registeredPersons = activeCases
      .filter((c: any) => Array.isArray(c.faceEmbedding) && c.faceEmbedding.length === 512)
      .map((c: any) => ({
        case_id: c.caseId,
        name: c.name,
        embedding: c.faceEmbedding,
        photo_url: c.photos?.[0] || null
      }));

    const detectionThreshold = threshold ? Math.min(1, Math.max(0, Number(threshold))) : 0.65;
    const camName = cameraName || camera?.name || cameraId;
    const camLocation = cameraLocation || camera?.location || 'Unknown location';

    const result = await AIService.processFrame(
      framePath,
      registeredPersons,
      cameraId,
      camName,
      camLocation,
      detectionThreshold
    );

    // Clean up temp frame (evidence copies are saved by the AI service)
    try { fs.unlinkSync(framePath); } catch { /* ignore */ }

    const io = (global as any).__returnhome_io;
    const candidateMatches = [];

    for (const match of result.candidateMatches) {
      const eventId = `DET-LIVE-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

      const relatedCase = await Case.findOne({ caseId: match.caseId }).select('_id caseId').lean();

      const detection = await DetectionEvent.create({
        detectionId: eventId,
        caseId: relatedCase?._id,
        caseRef: match.caseId,
        source: 'live_camera',
        cameraId: match.cameraId,
        cameraName: match.cameraName,
        sourceTimestamp: new Date(match.timestamp || Date.now()),
        processingTimestamp: new Date(),
        evidenceImageUrl: match.detectedFrameUrl,
        boundingBox: match.boundingBox,
        detectionConfidence: match.similarityScore || 0,
        matchingConfidence: match.similarityScore,
        confidenceTier: match.confidenceTier,
        cameraLocation: camLocation,
        latitude: camera?.latitude,
        longitude: camera?.longitude,
        locationSource: camera?.latitude ? 'camera_config' : 'unknown',
        missingPersonName: match.missingPersonName,
        missingPersonPhoto: match.missingPersonPhoto,
        trackingId: match.trackingId,
        reviewStatus: 'Pending Review',
        faceQuality: match.faceQuality
      });

      candidateMatches.push({
        ...match,
        detectionId: eventId,
        detectionMongoId: detection._id
      });

      if (io) {
        io.emit('detection:new', {
          detectionId: eventId,
          caseId: match.caseId,
          missingPersonName: match.missingPersonName,
          similarityScore: match.similarityScore,
          confidenceTier: match.confidenceTier,
          cameraId: match.cameraId,
          cameraName: match.cameraName,
          evidenceImageUrl: match.detectedFrameUrl
        });
      }
    }

    return res.json({
      success: true,
      facesDetected: result.facesDetected,
      matchesFound: candidateMatches.length,
      candidateMatches,
      disclaimer: 'Candidate results are unverified experimental leads, not confirmed identities. Human review is mandatory.'
    });
  } catch (error: any) {
    try { if (framePath) fs.unlinkSync(framePath); } catch { /* ignore */ }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List detection events with filtering.
 */
export const listDetections = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId: caseRef, source, reviewStatus, page = 1, limit = 20 } = req.query;

    if (!isMongoConnected) {
      let list = (memoryStore.matches || []).map((m: any) => ({
        detectionId: m.matchId,
        caseRef: m.caseId,
        missingPersonName: m.missingPersonName,
        missingPersonPhoto: m.missingPersonPhoto,
        source: 'live_camera',
        cameraId: m.cameraId,
        cameraName: m.cameraName,
        cameraLocation: m.location,
        sourceTimestamp: m.timestamp,
        processingTimestamp: m.timestamp,
        evidenceImageUrl: m.detectedFrameUrl || m.missingPersonPhoto || '',
        detectionConfidence: m.similarityScore || 0.85,
        matchingConfidence: m.similarityScore || 0.85,
        confidenceTier: m.confidenceTier || 'HIGH',
        reviewStatus: m.status || 'Pending Review',
        reviewNotes: m.notes || '',
        faceQuality: { overall_quality: 0.91, blur_score: 0.88, lighting_score: 0.94, pose_angle: 0.05 }
      }));

      if (caseRef) list = list.filter(d => d.caseRef === String(caseRef));
      if (reviewStatus && reviewStatus !== 'All') list = list.filter(d => d.reviewStatus === String(reviewStatus));

      const total = list.length;
      const p = Math.max(1, Number(page));
      const l = Math.max(1, Number(limit));
      const detections = list.slice((p - 1) * l, p * l);

      return res.json({
        success: true,
        total,
        page: p,
        limit: l,
        detections,
        disclaimer: 'Detection events are unverified candidate leads requiring human investigator review.'
      });
    }

    const filter: Record<string, any> = {};

    if (caseRef) filter.caseRef = caseRef;
    if (source) filter.source = source;
    if (reviewStatus && reviewStatus !== 'All') filter.reviewStatus = reviewStatus;

    const total = await DetectionEvent.countDocuments(filter);
    const detections = await DetectionEvent.find(filter)
      .sort({ sourceTimestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    return res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      detections,
      disclaimer: 'Detection events are unverified candidate leads requiring human investigator review.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Review a detection event (Investigator+).
 */
export const reviewDetection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewStatus, notes } = req.body;

    const validStatuses = ['Accepted Lead', 'Rejected', 'Escalated', 'Verified'];
    if (!reviewStatus || !validStatuses.includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid review decision: Accepted Lead, Rejected, Escalated, or Verified.'
      });
    }
    if (!notes || typeof notes !== 'string' || notes.trim().length === 0 || notes.length > 4000) {
      return res.status(400).json({ success: false, message: 'Review notes are required (up to 4,000 characters).' });
    }

    if (!isMongoConnected) {
      const match = (memoryStore.matches || []).find(m => m.matchId === id || String(m.id || m._id) === id);
      if (!match) return res.status(404).json({ success: false, message: 'Detection event not found.' });

      match.status = reviewStatus;
      match.notes = notes.trim();
      match.reviewedBy = req.user?.id;
      match.reviewedByName = req.user?.name;
      match.reviewedAt = new Date().toISOString();
      try { saveToDisk(); } catch { /* ignore */ }

      return res.json({
        success: true,
        detection: match,
        message: `Detection marked as ${reviewStatus}.`
      });
    }

    const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { detectionId: id };
    const detection = await DetectionEvent.findOneAndUpdate(
      filter,
      {
        reviewStatus,
        reviewedBy: req.user?.id,
        reviewedByName: req.user?.name,
        reviewedAt: new Date(),
        reviewNotes: notes.trim()
      },
      { new: true }
    ).lean();

    if (!detection) return res.status(404).json({ success: false, message: 'Detection event not found.' });

    // Update case status based on review
    if ((reviewStatus === 'Accepted Lead' || reviewStatus === 'Verified') && (detection as any).caseId) {
      const newCaseStatus = reviewStatus === 'Verified' ? 'Match Under Verification' : 'Potential Sighting';
      await Case.findByIdAndUpdate((detection as any).caseId, {
        status: newCaseStatus,
        $push: {
          activityLog: {
            timestamp: new Date(),
            userId: req.user?.id || 'system',
            userName: req.user?.name || 'Investigator',
            action: 'Detection Reviewed',
            description: `Detection ${(detection as any).detectionId} reviewed: ${reviewStatus}. Notes: ${notes.trim().slice(0, 200)}`
          }
        }
      });
    }

    await writeAuditLog({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      userRole: req.user?.role || '',
      action: 'DETECTION_REVIEW',
      resource: 'Detections',
      resourceId: (detection as any).detectionId,
      ipAddress: req.ip || 'unknown',
      details: `Detection ${(detection as any).detectionId} reviewed: ${reviewStatus}.`
    });

    return res.json({
      success: true,
      detection,
      message: `Detection marked as ${reviewStatus}.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Camera CRUD endpoints
 */
export const getCameras = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const cameras = await Camera.find({ isActive: true }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, total: cameras.length, cameras });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCamera = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const { name, description, location, latitude, longitude, cameraType, resolution, fps } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Camera name is required.' });
    }
    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Location description is required.' });
    }

    const hasLat = latitude !== undefined && latitude !== '';
    const hasLon = longitude !== undefined && longitude !== '';
    if (hasLat !== hasLon ||
        (hasLat && (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)) ||
        (hasLon && (!Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180))) {
      return res.status(400).json({ success: false, message: 'Provide valid latitude and longitude together, or leave both blank.' });
    }

    const count = await Camera.countDocuments();
    const cameraId = `CAM-${String(count + 1).padStart(3, '0')}`;

    const camera = await Camera.create({
      cameraId,
      name: name.trim(),
      description: description || '',
      location: location.trim(),
      latitude: hasLat ? Number(latitude) : undefined,
      longitude: hasLon ? Number(longitude) : undefined,
      cameraType: cameraType || 'Other',
      resolution: resolution || '1080p Full HD',
      fps: fps ? Number(fps) : 30,
      registeredBy: req.user?.name || '',
      registeredById: req.user?.id || ''
    });

    await writeAuditLog({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      userRole: req.user?.role || '',
      action: 'CAMERA_CREATE',
      resource: 'Cameras',
      resourceId: cameraId,
      ipAddress: req.ip || 'unknown',
      details: `Camera ${cameraId} (${name.trim()}) registered at ${location.trim()}.`
    });

    return res.status(201).json({ success: true, camera });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCamera = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const { id } = req.params;
    const allowedFields = ['name', 'description', 'location', 'latitude', 'longitude', 'status', 'cameraType', 'resolution', 'fps'];
    const updates: Record<string, any> = {};
    for (const f of allowedFields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }

    const camera = await Camera.findOneAndUpdate({ cameraId: id }, updates, { new: true }).lean();
    if (!camera) return res.status(404).json({ success: false, message: 'Camera not found.' });

    return res.json({ success: true, camera });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';
import { AIService } from '../services/aiService';
import { VideoJob } from '../models/VideoJob';
import { DetectionEvent } from '../models/DetectionEvent';
import { Case } from '../models/Case';
import { AuditLog } from '../models/AuditLog';
import { isMongoConnected } from '../config/db';

function dbUnavailable(res: Response) {
  return res.status(503).json({ success: false, message: 'Database is unavailable. Please try again later.' });
}

async function writeAuditLog(data: any) {
  try {
    if (isMongoConnected) await AuditLog.create({ ...data, timestamp: new Date() });
  } catch { /* Audit log failure must not block operations */ }
}

/**
 * Upload a video file and create a processing job.
 * The actual processing runs asynchronously in the background.
 */
export const uploadVideo = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video file provided.' });
  }

  const allowedMimes = ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska', 'video/webm'];
  if (!allowedMimes.includes(req.file.mimetype)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: 'Only MP4, AVI, MOV, MKV, and WebM video files are supported.' });
  }

  try {
    const { caseId: caseRef, cameraId, cameraName, cameraLocation, cameraLatitude, cameraLongitude } = req.body;

    // Resolve case if provided
    let caseObjectId: any;
    let resolvedCaseRef = caseRef;
    if (caseRef) {
      const caseDoc = await Case.findOne(
        caseRef.match(/^[0-9a-fA-F]{24}$/) ? { _id: caseRef } : { caseId: caseRef }
      ).select('_id caseId').lean();
      if (caseDoc) {
        caseObjectId = caseDoc._id;
        resolvedCaseRef = caseDoc.caseId;
      }
    }

    const jobId = `JOB-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const job = await VideoJob.create({
      jobId,
      caseId: caseObjectId,
      caseRef: resolvedCaseRef,
      cameraId: cameraId || 'MANUAL',
      cameraName: cameraName || 'Manual Upload',
      cameraLocation: cameraLocation || 'Not specified',
      cameraLatitude: cameraLatitude ? Number(cameraLatitude) : undefined,
      cameraLongitude: cameraLongitude ? Number(cameraLongitude) : undefined,
      uploadedBy: req.user?.id,
      uploadedByName: req.user?.name || 'Unknown',
      originalFilename: req.file.originalname,
      storedFilename: req.file.filename,
      storedPath: req.file.path,
      fileSizeBytes: req.file.size,
      mimeType: req.file.mimetype,
      status: 'queued'
    });

    await writeAuditLog({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      userRole: req.user?.role || '',
      action: 'VIDEO_UPLOAD',
      resource: 'Videos',
      resourceId: jobId,
      ipAddress: req.ip || 'unknown',
      details: `Video uploaded for job ${jobId}. File: ${req.file.originalname} (${Math.round(req.file.size / 1024)} KB).`
    });

    // Start processing asynchronously — do not await
    setImmediate(() => processVideoJob(job._id.toString()).catch(err => {
      console.error(`[ReturnHome Video] Background job ${jobId} failed:`, err.message);
    }));

    return res.status(202).json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Video uploaded. Processing will begin shortly.'
    });
  } catch (error: any) {
    // Clean up the uploaded file if DB save failed
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Background video processing worker. Called with setImmediate after upload.
 */
async function processVideoJob(jobMongoId: string): Promise<void> {
  const job = await VideoJob.findById(jobMongoId);
  if (!job) return;

  await VideoJob.findByIdAndUpdate(jobMongoId, { status: 'processing', startedAt: new Date(), progress: 5 });

  // Emit socket event if io is available (we'll attach it at module level)
  const io = (global as any).__returnhome_io;

  try {
    // Load all active case embeddings for matching
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

    await VideoJob.findByIdAndUpdate(jobMongoId, { progress: 10 });

    if (io) io.emit('video:progress', { jobId: job.jobId, status: 'processing', progress: 10 });

    // Run AI analysis on the video
    const result = await AIService.analyzeVideo(
      job.storedPath,
      job.caseRef || '',
      job.cameraId || 'MANUAL',
      job.cameraName || 'Manual Upload',
      job.cameraLocation || 'Not specified',
      registeredPersons
    );

    await VideoJob.findByIdAndUpdate(jobMongoId, { progress: 80 });
    if (io) io.emit('video:progress', { jobId: job.jobId, status: 'processing', progress: 80 });

    // Persist each potential match as a DetectionEvent
    const detectionIds: any[] = [];
    for (const match of result.potentialMatches) {
      const eventId = `DET-VID-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;

      // Resolve caseId from caseRef
      const relatedCase = await Case.findOne({ caseId: match.caseId }).select('_id caseId').lean();

      const detection = await DetectionEvent.create({
        detectionId: eventId,
        caseId: relatedCase?._id,
        caseRef: match.caseId,
        source: 'video_upload',
        cameraId: match.cameraId,
        cameraName: match.cameraName,
        videoJobId: job._id,
        sourceTimestamp: new Date(),
        processingTimestamp: new Date(),
        frameTimestamp: match.videoTimestamp,
        frameOffset: match.videoTimestamp ? parseFrameOffset(match.videoTimestamp) : undefined,
        evidenceImageUrl: match.detectedFrameUrl,
        boundingBox: match.boundingBox,
        detectionConfidence: match.similarityScore || 0,
        matchingConfidence: match.similarityScore,
        confidenceTier: match.confidenceTier,
        cameraLocation: job.cameraLocation,
        latitude: job.cameraLatitude,
        longitude: job.cameraLongitude,
        locationSource: job.cameraLatitude ? 'camera_config' : 'unknown',
        missingPersonName: match.missingPersonName,
        missingPersonPhoto: match.missingPersonPhoto,
        trackingId: match.trackingId,
        reviewStatus: 'Pending Review',
        faceQuality: match.faceQuality
      });

      detectionIds.push(detection._id);

      // Update the related case status
      if (relatedCase) {
        await Case.findByIdAndUpdate(relatedCase._id, {
          $set: { status: 'Potential Sighting' },
          $push: {
            activityLog: {
              timestamp: new Date(),
              userId: 'system',
              userName: 'ReturnHome AI Engine',
              action: 'Potential Sighting Detected',
              description: `Video analysis produced candidate match (${Math.round((match.similarityScore || 0) * 100)}% similarity) in job ${job.jobId}.`
            }
          }
        });
      }

      if (io) {
        io.emit('detection:new', {
          jobId: job.jobId,
          detectionId: eventId,
          caseId: match.caseId,
          missingPersonName: match.missingPersonName,
          similarityScore: match.similarityScore,
          confidenceTier: match.confidenceTier,
          evidenceImageUrl: match.detectedFrameUrl
        });
      }
    }

    // Mark job complete
    await VideoJob.findByIdAndUpdate(jobMongoId, {
      status: 'completed',
      progress: 100,
      framesAnalyzed: result.framesAnalyzed,
      facesDetected: result.facesDetected,
      candidateMatchesFound: result.potentialMatches.length,
      completedAt: new Date(),
      detectionEventIds: detectionIds
    });

    if (io) {
      io.emit('video:complete', {
        jobId: job.jobId,
        framesAnalyzed: result.framesAnalyzed,
        facesDetected: result.facesDetected,
        matchesFound: result.potentialMatches.length
      });
    }

    console.log(`[ReturnHome Video] Job ${job.jobId} complete. Frames: ${result.framesAnalyzed}, Faces: ${result.facesDetected}, Matches: ${result.potentialMatches.length}`);
  } catch (err: any) {
    console.error(`[ReturnHome Video] Job ${job.jobId} failed:`, err.message);
    await VideoJob.findByIdAndUpdate(jobMongoId, {
      status: 'failed',
      error: err.message?.slice(0, 2000) || 'Unknown error',
      completedAt: new Date()
    });

    if (io) io.emit('video:error', { jobId: job.jobId, error: err.message });
  }
}

function parseFrameOffset(timestamp: string): number {
  // Parse "MM:SS" or "HH:MM:SS" into seconds
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

export const getVideoJobs = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const { caseId: caseRef, status, page = 1, limit = 10 } = req.query;
    const filter: Record<string, any> = {};
    if (caseRef) filter.caseRef = caseRef;
    if (status && status !== 'All') filter.status = status;

    // Non-admins only see their own jobs
    if (req.user?.role === 'Citizen') {
      filter.uploadedBy = req.user.id;
    }

    const total = await VideoJob.countDocuments(filter);
    const jobs = await VideoJob.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-storedPath -detectionEventIds')
      .lean();

    return res.json({ success: true, total, page: Number(page), limit: Number(limit), jobs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVideoJobById = async (req: AuthRequest, res: Response) => {
  if (!isMongoConnected) return dbUnavailable(res);
  try {
    const { id } = req.params;
    const job = await VideoJob.findOne({ jobId: id }).select('-storedPath').lean();
    if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });

    // Citizen can only access their own jobs
    if (req.user?.role === 'Citizen' && String((job as any).uploadedBy) !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Fetch associated detection events
    const detections = await DetectionEvent.find({
      videoJobId: (job as any)._id
    }).sort({ sourceTimestamp: -1 }).lean();

    return res.json({ success: true, job, detections });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

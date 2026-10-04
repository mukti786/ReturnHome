import { Request, Response } from 'express';
import { memoryStore } from '../store/memoryStore';
import { AuthRequest } from '../middleware/authMiddleware';

export const analyzeVideo = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId, cameraId, videoName } = req.body;

    const targetCaseId = caseId || 'MP-2026-0001';
    const targetCameraId = cameraId || 'CAM-01';

    const targetCase = memoryStore.cases.find(c => c.caseId === targetCaseId) || memoryStore.cases[0];
    const camera = memoryStore.cameras.find(c => c.cameraId === targetCameraId) || memoryStore.cameras[0];

    const framesAnalyzed = Math.floor(Math.random() * 4000) + 5000;
    const facesDetected = Math.floor(Math.random() * 250) + 150;
    const tracksCreated = Math.floor(Math.random() * 15) + 10;
    const trackingId = `TRACK-000${Math.floor(Math.random() * 80) + 20}`;

    // Create a new candidate match in memory store
    const matchId = `MATCH-2026-${String(memoryStore.matches.length + 1).padStart(3, '0')}`;
    const newMatch = {
      matchId,
      caseId: targetCase.caseId,
      missingPersonName: targetCase.name,
      missingPersonPhoto: targetCase.photos[0] || 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
      detectedFrameUrl: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=600&q=80',
      cameraId: camera.cameraId,
      cameraName: camera.name,
      location: camera.location,
      latitude: camera.latitude,
      longitude: camera.longitude,
      timestamp: new Date().toISOString().replace('Z', ''),
      similarityScore: 0.91,
      confidenceTier: 'HIGH',
      trackingId,
      status: 'Pending Review',
      notes: `Automated detection generated during video analysis of ${videoName || 'CCTV_Stream_2026.mp4'}.`,
      createdAt: new Date().toISOString()
    };

    memoryStore.matches.unshift(newMatch);

    // Record timeline
    memoryStore.timeline.unshift({
      id: `evt-${Date.now()}`,
      caseId: targetCase.caseId,
      timestamp: new Date().toISOString(),
      user: req.user?.name || 'ReturnHome AI Service',
      action: 'Video Evidence Analyzed',
      description: `Ingested video footage from ${camera.name}. Analyzed ${framesAnalyzed} frames, detected ${facesDetected} faces, and generated candidate lead ${matchId} (${trackingId}).`
    });

    // Record audit log
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'usr-admin-1',
      userName: req.user?.name || 'Inspector Vikram Singh',
      userRole: req.user?.role || 'Admin',
      action: 'VIDEO_ANALYZE',
      resource: 'Video',
      resourceId: camera.cameraId,
      ipAddress: req.ip || '127.0.0.1',
      details: `Processed CCTV video for camera ${camera.name}. Generated candidate match ${matchId}.`,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      jobId: `JOB-${Date.now()}`,
      caseId: targetCase.caseId,
      cameraId: camera.cameraId,
      framesAnalyzed,
      facesDetected,
      tracksCreated,
      trackingId,
      potentialMatches: [newMatch],
      message: 'Video analysis complete. Candidate match generated for investigator verification.',
      disclaimer: 'AI-generated matches are potential leads only and must be independently verified by authorized personnel.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

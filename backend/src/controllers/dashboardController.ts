import { Request, Response } from 'express';
import { memoryStore } from '../store/memoryStore';
import { isMongoConnected } from '../config/db';
import { Case } from '../models/Case';
import { DetectionEvent } from '../models/DetectionEvent';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    let totalCases = memoryStore.cases.length;
    let activeCases = memoryStore.cases.filter(c => c.status === 'Active' || c.status === 'Under Investigation' || c.status === 'Submitted' || c.status === 'Active Investigation').length;
    let potentialMatches = memoryStore.matches.filter(m => m.status === 'Pending Review').length;
    let verifiedMatches = memoryStore.matches.filter(m => m.status === 'Accepted Lead' || m.status === 'Verified').length;
    let resolvedCases = memoryStore.cases.filter(c => c.status === 'Found' || c.status === 'Closed' || c.status === 'Located').length;

    let recentCases: any[] = memoryStore.cases.slice(0, 5);
    let recentMatches: any[] = memoryStore.matches.slice(0, 5);
    let recentTimeline: any[] = memoryStore.timeline.slice(0, 6);

    if (isMongoConnected) {
      const dbTotalCases = await Case.countDocuments();
      if (dbTotalCases > 0) {
        totalCases = dbTotalCases;
        activeCases = await Case.countDocuments({
          status: { $in: ['Active', 'Under Investigation', 'Submitted', 'Under Review', 'Active Investigation'] }
        });
        potentialMatches = await DetectionEvent.countDocuments({ reviewStatus: 'Pending Review' });
        verifiedMatches = await DetectionEvent.countDocuments({ reviewStatus: { $in: ['Accepted Lead', 'Verified'] } });
        resolvedCases = await Case.countDocuments({ status: { $in: ['Found', 'Closed', 'Located'] } });

        const dbRecentCases = await Case.find().sort({ createdAt: -1 }).limit(5).select('-faceEmbedding -activityLog').lean();
        if (dbRecentCases.length > 0) {
          recentCases = dbRecentCases;
        }

        const dbRecentDetections = await DetectionEvent.find().sort({ sourceTimestamp: -1 }).limit(5).lean();
        if (dbRecentDetections.length > 0) {
          recentMatches = dbRecentDetections.map((d: any) => ({
            matchId: d.detectionId,
            caseId: d.caseRef || '',
            missingPersonName: d.missingPersonName || '',
            missingPersonPhoto: d.missingPersonPhoto || '',
            detectedFrameUrl: d.evidenceImageUrl || '',
            cameraId: d.cameraId || '',
            cameraName: d.cameraName || '',
            location: d.cameraLocation || '',
            timestamp: d.sourceTimestamp ? new Date(d.sourceTimestamp).toISOString() : new Date().toISOString(),
            similarityScore: d.matchingConfidence || d.detectionConfidence || 0,
            confidenceTier: d.confidenceTier || 'MEDIUM',
            status: d.reviewStatus || 'Pending Review'
          }));
        }
      }
    }

    const casesByStatus = [
      { name: 'Active', value: activeCases },
      { name: 'Potential Lead', value: potentialMatches },
      { name: 'Under Verification', value: verifiedMatches },
      { name: 'Located / Closed', value: resolvedCases }
    ];

    const monthlyTrends = Array.from({ length: 6 }, (_, offset) => {
      const monthDate = new Date();
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);
      monthDate.setMonth(monthDate.getMonth() - (5 - offset));
      return {
        month: monthDate.toLocaleString('en', { month: 'short' }),
        cases: Math.max(0, Math.round(totalCases / 6) + (offset % 2)),
        matches: Math.max(0, Math.round(potentialMatches / 6) + (offset % 3))
      };
    });

    return res.json({
      success: true,
      stats: {
        totalCases,
        activeCases,
        potentialMatches,
        verifiedMatches,
        resolvedCases
      },
      recentCases,
      recentMatches,
      recentTimeline,
      charts: {
        casesByStatus,
        monthlyTrends
      },
      disclaimer: 'Candidate records and generic image-feature similarities are unverified suggestions, not confirmed identities or sightings.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

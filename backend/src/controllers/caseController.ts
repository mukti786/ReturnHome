import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { memoryStore, saveToDisk, FaceRepresentation } from '../store/memoryStore';
import { AuthRequest } from '../middleware/authMiddleware';
import { AIService } from '../services/aiService';

const CASES_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/cases');

// Helper to save base64 data URL to disk
function saveBase64Image(dataUrl: string, prefix: string): string {
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrl; // return original if not base64

    const ext = matches[1].includes('png') ? '.png' : '.jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`;
    const filePath = path.join(CASES_UPLOAD_DIR, filename);

    if (!fs.existsSync(CASES_UPLOAD_DIR)) {
      fs.mkdirSync(CASES_UPLOAD_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
    return `/uploads/cases/${filename}`;
  } catch (err) {
    return dataUrl;
  }
}

export const getCases = async (req: Request, res: Response) => {
  try {
    const { search, status, priority, gender, ageMin, ageMax, page = 1, limit = 10 } = req.query;

    let filtered = [...memoryStore.cases];

    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        c => c.name.toLowerCase().includes(q) ||
             c.caseId.toLowerCase().includes(q) ||
             c.lastSeenLocation.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'All') {
      filtered = filtered.filter(c => c.status === status);
    }

    if (priority && priority !== 'All') {
      filtered = filtered.filter(c => c.priority === priority);
    }

    if (gender && gender !== 'All') {
      filtered = filtered.filter(c => c.gender === gender);
    }

    if (ageMin) {
      filtered = filtered.filter(c => c.age >= Number(ageMin));
    }
    if (ageMax) {
      filtered = filtered.filter(c => c.age <= Number(ageMax));
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = filtered.slice(startIndex, startIndex + Number(limit));

    return res.json({
      success: true,
      total: filtered.length,
      page: Number(page),
      limit: Number(limit),
      cases: paginated
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCaseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const caseItem = memoryStore.cases.find(c => c.caseId === id || c._id === id);

    if (!caseItem) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Get related potential matches
    const relatedMatches = memoryStore.matches.filter(m => m.caseId === caseItem.caseId);
    // Get timeline events
    const timelineEvents = memoryStore.timeline.filter(t => t.caseId === caseItem.caseId);
    // Get face representations
    const representations = memoryStore.faceRepresentations.filter(f => f.caseId === caseItem.caseId);

    return res.json({
      success: true,
      case: caseItem,
      matches: relatedMatches,
      timeline: timelineEvents,
      faceRepresentations: representations
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadCasePhotoHandler = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo file provided.' });
    }

    const photoUrl = `/uploads/cases/${req.file.filename}`;
    const filePath = req.file.path;

    // Run AI feature extraction on the uploaded photo
    const aiResult = await AIService.extractEmbedding(filePath);

    return res.json({
      success: true,
      photoUrl,
      quality: aiResult.quality,
      confidence: aiResult.confidence,
      box: aiResult.box,
      hasEmbedding: aiResult.embedding.length === 512,
      message: 'Photo uploaded and facial embedding extracted successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCase = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, age, gender, height, weight, hairColor, eyeColor,
      distinguishingFeatures, lastSeenDate, lastSeenTime, lastSeenLocation,
      description, clothingDescription, priority, contactAuthority, contactNumber, photos
    } = req.body;

    if (!name || !age || !gender || !lastSeenDate || !lastSeenLocation) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, gender, last seen date, and location are required fields.'
      });
    }

    const nextIdNum = memoryStore.cases.length + 1;
    const caseId = `MP-2026-${String(nextIdNum).padStart(4, '0')}`;

    // Process and persist photos (convert any base64 to real files)
    const processedPhotos: string[] = [];
    if (Array.isArray(photos)) {
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (typeof p === 'string' && p.startsWith('data:image/')) {
          const savedUrl = saveBase64Image(p, `ref-${caseId}-${i}`);
          processedPhotos.push(savedUrl);
        } else if (typeof p === 'string' && p.trim()) {
          processedPhotos.push(p.trim());
        }
      }
    }



    // Extract real face embedding for primary photo
    let primaryEmbedding: number[] = [];
    let faceQuality: any = { blur_score: 90.0, lighting_score: 85.0, pose_angle: 5.0, overall_quality: 0.90 };

    const firstPhoto = processedPhotos[0] || '';
    if (firstPhoto.startsWith('/uploads/cases/')) {
      const localFilePath = path.resolve(__dirname, '../../', firstPhoto.replace(/^\//, ''));
      if (fs.existsSync(localFilePath)) {
        try {
          const aiRes = await AIService.extractEmbedding(localFilePath);
          primaryEmbedding = aiRes.embedding;
          faceQuality = aiRes.quality;
        } catch {
          // Keep the case record, but do not fabricate an embedding when analysis is unavailable.
        }
      }
    }

    const faceRep: FaceRepresentation | null = primaryEmbedding.length === 512 ? {
      id: `emb-${caseId}-1`,
      caseId,
      photoUrl: processedPhotos[0],
      embedding: primaryEmbedding,
      model: 'PyTorch-ResNet18-512d',
      quality: faceQuality,
      createdAt: new Date().toISOString()
    } : null;
    if (faceRep) memoryStore.faceRepresentations.unshift(faceRep);

    const newCase = {
      caseId,
      name,
      age: Number(age),
      gender,
      height: height || '5 ft 7 in',
      weight: weight || '60 kg',
      hairColor: hairColor || 'Black',
      eyeColor: eyeColor || 'Brown',
      distinguishingFeatures: distinguishingFeatures || 'None noted',
      lastSeenDate,
      lastSeenTime: lastSeenTime || '12:00',
      lastSeenLocation,
      latitude: undefined,
      longitude: undefined,
      description: description || 'Missing person case reported to ReturnHome portal.',
      clothingDescription: clothingDescription || 'Dark jacket and trousers',
      status: 'Active',
      priority: priority || 'High',
      photos: processedPhotos,
      contactAuthority: contactAuthority || 'Special Missing Persons Unit, Delhi Police',
      contactNumber: contactNumber || '+91-11-23410000',
      createdBy: req.user?.name || 'Investigator Officer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    memoryStore.cases.unshift(newCase);

    // Record initial timeline event
    memoryStore.timeline.unshift({
      id: `evt-${Date.now()}`,
      caseId,
      timestamp: new Date().toISOString(),
      user: req.user?.name || 'Investigator Officer',
      action: 'Case Registered',
      description: `New missing person profile registered for ${name} (${caseId}). Reference record created; analysis features are available only when a valid representation exists.`
    });

    // Record Audit Log
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'usr-admin-1',
      userName: req.user?.name || 'Inspector Vikram Singh',
      userRole: req.user?.role || 'Admin',
      action: 'CASE_CREATE',
      resource: 'Cases',
      resourceId: caseId,
      ipAddress: req.ip || '127.0.0.1',
      details: `Created missing person case ${caseId} for ${name}.`,
      timestamp: new Date().toISOString()
    });

    // Save to disk
    saveToDisk();

    return res.status(201).json({
      success: true,
      case: newCase,
      ...(faceRep ? { faceRepresentation: faceRep } : {}),
      message: `Case ${caseId} registered successfully in ReturnHome database.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const caseIndex = memoryStore.cases.findIndex(c => c.caseId === id || c._id === id);

    if (caseIndex === -1) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const currentCase = memoryStore.cases[caseIndex];
    const updatedCase = {
      ...currentCase,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    memoryStore.cases[caseIndex] = updatedCase;

    // Timeline event if status changed
    if (req.body.status && req.body.status !== currentCase.status) {
      memoryStore.timeline.unshift({
        id: `evt-${Date.now()}`,
        caseId: currentCase.caseId,
        timestamp: new Date().toISOString(),
        user: req.user?.name || 'Investigator Officer',
        action: 'Status Updated',
        description: `Case status changed from '${currentCase.status}' to '${req.body.status}'.`
      });
    }

    // Audit Log
    memoryStore.auditLogs.unshift({
      id: `log-${Date.now()}`,
      userId: req.user?.id || 'usr-admin-1',
      userName: req.user?.name || 'Inspector Vikram Singh',
      userRole: req.user?.role || 'Admin',
      action: 'CASE_UPDATE',
      resource: 'Cases',
      resourceId: currentCase.caseId,
      ipAddress: req.ip || '127.0.0.1',
      details: `Updated details for case ${currentCase.caseId}.`,
      timestamp: new Date().toISOString()
    });

    saveToDisk();

    return res.json({
      success: true,
      case: updatedCase,
      message: `Case ${currentCase.caseId} updated successfully.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




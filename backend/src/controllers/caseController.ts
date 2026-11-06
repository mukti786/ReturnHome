import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { memoryStore, saveToDisk, FaceRepresentation } from '../store/memoryStore';
import { AuthRequest } from '../middleware/authMiddleware';
import { AIService } from '../services/aiService';

const CASES_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/cases');

// Helper to save base64 data URL to disk
function saveBase64Image(dataUrl: string, prefix: string): string {
  const matches = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/i);
  if (!matches) throw new Error('Reference images must be valid JPEG, PNG, or WebP data.');
  const mime = matches[1].toLowerCase();
  const buffer = Buffer.from(matches[2], 'base64');
  if (!buffer.length || buffer.length > 15 * 1024 * 1024) throw new Error('Each reference image must be 15 MB or smaller.');
  const valid = mime === 'jpeg' ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    : mime === 'png' ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) throw new Error('Reference image data does not match its declared file type.');
  const extension = mime === 'jpeg' ? '.jpg' : `.${mime}`;
  const filename = `${prefix}-${Date.now()}-${randomUUID()}${extension}`;
  fs.mkdirSync(CASES_UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(CASES_UPLOAD_DIR, filename), buffer, { flag: 'wx' });
  return `/uploads/cases/${filename}`;
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
      message: aiResult ? 'Photo uploaded and experimental image features generated.' : 'Photo uploaded. Image analysis is unavailable; no features were generated.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createCase = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, age, gender, height, weight, hairColor, eyeColor, latitude, longitude,
      distinguishingFeatures, lastSeenDate, lastSeenTime, lastSeenLocation,
      description, clothingDescription, priority, contactAuthority, contactNumber, photos
    } = req.body;

    if (typeof name !== 'string' || !name.trim() || age === undefined || age === null || age === '' || gender === undefined || gender === null || gender === '' || !lastSeenDate || typeof lastSeenLocation !== 'string' || !lastSeenLocation.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, gender, last seen date, and location are required fields.'
      });
    }
    if (name.trim().length > 160 || !Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 130 || !['Male', 'Female', 'Other'].includes(gender) || lastSeenLocation.trim().length > 500 || !/^\d{4}-\d{2}-\d{2}$/.test(lastSeenDate)) {
      return res.status(400).json({ success: false, message: 'Check the name, age, gender, date, and last-seen location values.' });
    }
    const hasLatitude = latitude !== undefined && latitude !== '';
    const hasLongitude = longitude !== undefined && longitude !== '';
    if (hasLatitude !== hasLongitude || (hasLatitude && hasLongitude)) {
      if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Number(latitude) < -90 || Number(latitude) > 90 || Number(longitude) < -180 || Number(longitude) > 180) {
        return res.status(400).json({ success: false, message: 'Enter valid latitude and longitude together, or leave both blank.' });
      }
    }
    if (photos !== undefined && (!Array.isArray(photos) || photos.length > 8 || photos.some((photo) => typeof photo !== 'string' || photo.length > 21 * 1024 * 1024) || photos.reduce((total, photo) => total + (typeof photo === 'string' && photo.startsWith('data:image/') ? photo.length : 0), 0) > 60 * 1024 * 1024)) {
      return res.status(400).json({ success: false, message: 'Provide up to 8 reference photo URLs or images of 15 MB or smaller.' });
    }

    const caseYear = new Date().getUTCFullYear();
    const nextIdNum = memoryStore.cases.reduce((highest, record) => {
      const id = typeof record.caseId === 'string' ? record.caseId.match(new RegExp(`^MP-${caseYear}-(\\d+)$`)) : null;
      return Math.max(highest, id ? Number(id[1]) : 0);
    }, 0) + 1;
    const caseId = `MP-${caseYear}-${String(nextIdNum).padStart(4, '0')}`;

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



    // Store experimental generic image features only when the AI service supplies them.
    let primaryEmbedding: number[] = [];
    let faceQuality: FaceRepresentation['quality'] | undefined;

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

    const faceRep: FaceRepresentation | null = primaryEmbedding.length === 512 && faceQuality ? {
      id: `emb-${caseId}-1`,
      caseId,
      photoUrl: processedPhotos[0],
      embedding: primaryEmbedding,
      model: 'ImageNet-ResNet18-generic-512d',
      quality: faceQuality,
      createdAt: new Date().toISOString()
    } : null;
    if (faceRep) memoryStore.faceRepresentations.unshift(faceRep);

    const newCase = {
      caseId,
      name,
      age: Number(age),
      gender,
      height: height || '',
      weight: weight || '',
      hairColor: hairColor || '',
      eyeColor: eyeColor || '',
      distinguishingFeatures: distinguishingFeatures || '',
      lastSeenDate,
      lastSeenTime: lastSeenTime || '',
      lastSeenLocation,
      latitude: !hasLatitude ? undefined : Number(latitude),
      longitude: !hasLongitude ? undefined : Number(longitude),
      description: description || '',
      clothingDescription: clothingDescription || '',
      status: 'Active',
      priority: priority || 'Medium',
      photos: processedPhotos,
      contactAuthority: contactAuthority || '',
      contactNumber: contactNumber || '',
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
    try {
      saveToDisk();
    } catch {
      memoryStore.cases.shift();
      if (faceRep) memoryStore.faceRepresentations.shift();
      memoryStore.timeline.shift();
      memoryStore.auditLogs.shift();
      return res.status(503).json({ success: false, message: 'The case could not be persisted to disk. Check backend storage permissions and try again.' });
    }

    return res.status(201).json({
      success: true,
      case: newCase,
      ...(faceRep ? { faceRepresentation: faceRep } : {}),
      message: `Case ${caseId} registered successfully in ReturnHome database.`
    });
  } catch (error: any) {
    const badImage = /reference image|each reference image/i.test(error?.message || '');
    return res.status(badImage ? 400 : 500).json({ success: false, message: badImage ? error.message : 'Could not create the case record. Check the submitted values and backend storage.' });
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
    const previousCase = { ...currentCase };
    const previousTimelineLength = memoryStore.timeline.length;
    const previousAuditLength = memoryStore.auditLogs.length;
    const allowedFields = ['name', 'age', 'gender', 'height', 'weight', 'hairColor', 'eyeColor', 'distinguishingFeatures', 'lastSeenDate', 'lastSeenTime', 'lastSeenLocation', 'latitude', 'longitude', 'description', 'clothingDescription', 'status', 'priority', 'photos', 'contactAuthority', 'contactNumber'];
    const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
    const updates = Object.fromEntries(allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(requestBody, field)).map((field) => [field, requestBody[field]]));
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim() || updates.name.trim().length > 160)) {
      return res.status(400).json({ success: false, message: 'Enter a valid name up to 160 characters.' });
    }
    if (updates.age !== undefined && (!Number.isInteger(Number(updates.age)) || Number(updates.age) < 0 || Number(updates.age) > 130)) {
      return res.status(400).json({ success: false, message: 'Age must be a whole number between 0 and 130.' });
    }
    if (updates.gender !== undefined && !['Male', 'Female', 'Other'].includes(updates.gender)) {
      return res.status(400).json({ success: false, message: 'Choose a supported gender value.' });
    }
    if (updates.status !== undefined && !['Active', 'Under Investigation', 'Potential Match', 'Found', 'Closed'].includes(updates.status)) {
      return res.status(400).json({ success: false, message: 'Choose a supported case status.' });
    }
    if (updates.priority !== undefined && !['Low', 'Medium', 'High', 'Critical'].includes(updates.priority)) {
      return res.status(400).json({ success: false, message: 'Choose a supported priority.' });
    }
    const hasLatitude = updates.latitude !== undefined && updates.latitude !== '';
    const hasLongitude = updates.longitude !== undefined && updates.longitude !== '';
    if (hasLatitude !== hasLongitude || (hasLatitude && (!Number.isFinite(Number(updates.latitude)) || !Number.isFinite(Number(updates.longitude)) || Number(updates.latitude) < -90 || Number(updates.latitude) > 90 || Number(updates.longitude) < -180 || Number(updates.longitude) > 180))) {
      return res.status(400).json({ success: false, message: 'Enter valid latitude and longitude together.' });
    }
    const textFieldLimits: Record<string, number> = { height: 80, weight: 80, hairColor: 120, eyeColor: 120, distinguishingFeatures: 2000, lastSeenDate: 20, lastSeenTime: 20, lastSeenLocation: 500, description: 4000, clothingDescription: 2000, contactAuthority: 200, contactNumber: 40 };
    for (const [field, maxLength] of Object.entries(textFieldLimits)) {
      if (updates[field] !== undefined && (typeof updates[field] !== 'string' || updates[field].length > maxLength)) {
        return res.status(400).json({ success: false, message: `Check the ${field} value; it must be text with at most ${maxLength} characters.` });
      }
    }
    if (updates.photos !== undefined && (!Array.isArray(updates.photos) || updates.photos.length > 8 || updates.photos.some((photo: unknown) => typeof photo !== 'string' || photo.length > 21 * 1024 * 1024))) {
      return res.status(400).json({ success: false, message: 'Provide up to 8 valid reference photos.' });
    }
    const updatedCase = {
      ...currentCase,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    memoryStore.cases[caseIndex] = updatedCase;

    // Timeline event if status changed
    if (updates.status && updates.status !== currentCase.status) {
      memoryStore.timeline.unshift({
        id: `evt-${Date.now()}`,
        caseId: currentCase.caseId,
        timestamp: new Date().toISOString(),
        user: req.user?.name || 'Investigator Officer',
        action: 'Status Updated',
        description: `Case status changed from '${currentCase.status}' to '${updates.status}'.`
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

    try {
      saveToDisk();
    } catch {
      memoryStore.cases[caseIndex] = previousCase;
      memoryStore.timeline.length = previousTimelineLength;
      memoryStore.auditLogs.length = previousAuditLength;
      return res.status(503).json({ success: false, message: 'The case update could not be persisted to disk. Check backend storage permissions and try again.' });
    }

    return res.json({
      success: true,
      case: updatedCase,
      message: `Case ${currentCase.caseId} updated successfully.`
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};




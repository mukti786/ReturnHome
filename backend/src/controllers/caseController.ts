import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware';
import { AIService } from '../services/aiService';
import { Case } from '../models/Case';
import { DetectionEvent } from '../models/DetectionEvent';
import { Sighting } from '../models/Sighting';
import { AuditLog } from '../models/AuditLog';
import { isMongoConnected } from '../config/db';
import { memoryStore, saveToDisk } from '../store/memoryStore';
import { createAndSendNotification } from '../utils/notificationService';

const CASES_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/cases');

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

async function writeAuditLog(data: {
  userId: string; userName: string; userRole: string;
  action: string; resource: string; resourceId?: string;
  ipAddress: string; details: string;
}) {
  try {
    if (isMongoConnected) {
      await AuditLog.create({ ...data, timestamp: new Date() });
    }
  } catch { /* Audit log failure must not block operations */ }
}

function dbUnavailable(res: Response) {
  return res.status(503).json({ success: false, message: 'Database is unavailable. Please try again later.' });
}

export const getCases = async (req: Request, res: Response) => {
  try {
    const { search, status, priority, gender, ageMin, ageMax, page = 1, limit = 10 } = req.query;

    if (!isMongoConnected) {
      let list = [...memoryStore.cases];
      if (search) {
        const q = String(search).toLowerCase().trim();
        list = list.filter(c =>
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.caseId && c.caseId.toLowerCase().includes(q)) ||
          (c.lastSeenLocation && c.lastSeenLocation.toLowerCase().includes(q))
        );
      }
      if (status && status !== 'All') list = list.filter(c => c.status === status);
      if (priority && priority !== 'All') list = list.filter(c => c.priority === priority);
      if (gender && gender !== 'All') list = list.filter(c => c.gender === gender);
      if (ageMin) list = list.filter(c => Number(c.age) >= Number(ageMin));
      if (ageMax) list = list.filter(c => Number(c.age) <= Number(ageMax));

      const total = list.length;
      const p = Math.max(1, Number(page));
      const l = Math.max(1, Number(limit));
      const cases = list.slice((p - 1) * l, p * l);
      return res.json({ success: true, total, page: p, limit: l, cases });
    }

    const filter: Record<string, any> = {};
    if (search) {
      const q = String(search).trim();
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { caseId: { $regex: q, $options: 'i' } },
          { lastSeenLocation: { $regex: q, $options: 'i' } }
        ];
      }
    }
    if (status && status !== 'All') filter.status = status;
    if (priority && priority !== 'All') filter.priority = priority;
    if (gender && gender !== 'All') filter.gender = gender;
    if (ageMin) filter.age = { ...filter.age, $gte: Number(ageMin) };
    if (ageMax) filter.age = { ...filter.age, $lte: Number(ageMax) };

    const total = await Case.countDocuments(filter);
    const cases = await Case.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-faceEmbedding -activityLog')
      .lean();

    return res.json({ success: true, total, page: Number(page), limit: Number(limit), cases });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCaseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isMongoConnected) {
      const caseDoc = memoryStore.cases.find(c => String(c.id || c._id) === id || c.caseId === id);
      if (!caseDoc) {
        return res.status(404).json({ success: false, message: 'Case not found.' });
      }
      const detections = (memoryStore.matches || []).filter(m => m.caseId === caseDoc.caseId);
      const sightings = ((memoryStore as any).sightings || []).filter((s: any) => s.caseRef === caseDoc.caseId);
      return res.json({
        success: true,
        case: caseDoc,
        detections,
        sightings,
        activityLog: caseDoc.activityLog || []
      });
    }

    const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { caseId: id };
    const caseDoc = await Case.findOne(filter).select('-faceEmbedding').lean();

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Get related detection events (matches)
    const [detections, sightings] = await Promise.all([
      DetectionEvent.find({ $or: [{ caseId: caseDoc._id }, { caseRef: caseDoc.caseId }] })
        .sort({ sourceTimestamp: -1 })
        .limit(50)
        .lean(),
      Sighting.find({ caseRef: caseDoc.caseId })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    return res.json({
      success: true,
      case: caseDoc,
      detections,
      sightings,
      activityLog: (caseDoc as any).activityLog || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadCasePhotoHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo file provided.' });
    }
    const photoUrl = `/uploads/cases/${req.file.filename}`;
    const filePath = req.file.path;

    let quality: any = null;
    let confidence: number | null = null;
    let box: any = null;

    try {
      const aiResult = await AIService.extractEmbedding(filePath);
      quality = aiResult.quality;
      confidence = aiResult.confidence;
      box = aiResult.box;
    } catch {
      // AI service may be offline — photo is still saved
    }

    return res.json({
      success: true,
      photoUrl,
      quality,
      confidence,
      box,
      message: quality ? 'Photo uploaded and experimental image features assessed.' : 'Photo uploaded. Image analysis unavailable.'
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
      description, clothingDescription, priority, photos,
      contactName, contactPhone, contactEmail, contactAuthority, contactNumber
    } = req.body;

    // Required field validation
    if (typeof name !== 'string' || !name.trim() ||
        age === undefined || age === null || age === '' ||
        !lastSeenDate || typeof lastSeenLocation !== 'string' || !lastSeenLocation.trim() ||
        typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, last seen date, location, and description are required fields.'
      });
    }
    if (name.trim().length > 160 ||
        !Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 130 ||
        (gender && !['Male', 'Female', 'Other', 'Not Specified'].includes(gender)) ||
        lastSeenLocation.trim().length > 500 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(lastSeenDate)) {
      return res.status(400).json({ success: false, message: 'Check the name, age, gender, date, and last-seen location values.' });
    }

    // Coordinate validation
    const hasLatitude = latitude !== undefined && latitude !== '';
    const hasLongitude = longitude !== undefined && longitude !== '';
    if (hasLatitude !== hasLongitude ||
        (hasLatitude && (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) ||
         Number(latitude) < -90 || Number(latitude) > 90 ||
         Number(longitude) < -180 || Number(longitude) > 180))) {
      return res.status(400).json({ success: false, message: 'Enter valid latitude and longitude together, or leave both blank.' });
    }

    // Photo validation
    if (photos !== undefined && (!Array.isArray(photos) || photos.length > 8 ||
        photos.some((photo: unknown) => typeof photo !== 'string' || photo.length > 21 * 1024 * 1024))) {
      return res.status(400).json({ success: false, message: 'Provide up to 8 reference photos.' });
    }

    // Generate unique case ID
    const year = new Date().getUTCFullYear();
    let nextNum = 1;
    if (isMongoConnected) {
      const lastCase = await Case.findOne({ caseId: { $regex: `^MP-${year}-` } }).sort({ caseId: -1 }).select('caseId').lean();
      if (lastCase?.caseId) {
        const m = lastCase.caseId.match(/^MP-\d{4}-(\d+)$/);
        if (m) nextNum = parseInt(m[1], 10) + 1;
      }
    } else {
      const existing = memoryStore.cases.filter(c => c.caseId && c.caseId.startsWith(`MP-${year}-`));
      nextNum = existing.length + 1;
    }
    const caseId = `MP-${year}-${String(nextNum).padStart(4, '0')}`;

    // Process photos
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

    // AI embedding for first local photo
    let faceEmbedding: number[] | undefined;
    let faceQuality: any;

    const firstPhoto = processedPhotos[0] || '';
    if (firstPhoto.startsWith('/uploads/cases/')) {
      const localFilePath = path.resolve(__dirname, '../../', firstPhoto.replace(/^\//, ''));
      if (fs.existsSync(localFilePath)) {
        try {
          const aiRes = await AIService.extractEmbedding(localFilePath);
          if (aiRes.embedding.length === 512) {
            faceEmbedding = aiRes.embedding;
            faceQuality = aiRes.quality;
          }
        } catch {
          // AI service offline — keep case without embedding
        }
      }
    }

    const activityEntry = {
      timestamp: new Date(),
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'Case Registered',
      description: `Missing person case ${caseId} created for ${name.trim()}.`
    };

    let responseCase: any;
    if (isMongoConnected) {
      const newCase = await Case.create({
        caseId,
        name: name.trim(),
        age: Number(age),
        gender: gender || 'Not Specified',
        height: height || '',
        weight: weight || '',
        hairColor: hairColor || '',
        eyeColor: eyeColor || '',
        distinguishingFeatures: distinguishingFeatures || '',
        lastSeenDate,
        lastSeenTime: lastSeenTime || '',
        lastSeenLocation: lastSeenLocation.trim(),
        latitude: hasLatitude ? Number(latitude) : undefined,
        longitude: hasLongitude ? Number(longitude) : undefined,
        description: description.trim(),
        clothingDescription: clothingDescription || '',
        status: 'Submitted',
        priority: priority || 'Medium',
        photos: processedPhotos,
        contactName: contactName || '',
        contactPhone: contactPhone || '',
        contactEmail: contactEmail || '',
        contactAuthority: contactAuthority || '',
        contactNumber: contactNumber || '',
        createdBy: req.user?.id,
        createdByName: req.user?.name || 'Unknown',
        createdByRole: req.user?.role || '',
        faceEmbedding,
        faceQuality,
        activityLog: [activityEntry]
      });

      responseCase = newCase.toObject();
      delete (responseCase as any).faceEmbedding;
    } else {
      responseCase = {
        _id: `case-${Date.now()}-${randomUUID().slice(0, 6)}`,
        caseId,
        name: name.trim(),
        age: Number(age),
        gender: gender || 'Not Specified',
        height: height || '',
        weight: weight || '',
        hairColor: hairColor || '',
        eyeColor: eyeColor || '',
        distinguishingFeatures: distinguishingFeatures || '',
        lastSeenDate,
        lastSeenTime: lastSeenTime || '',
        lastSeenLocation: lastSeenLocation.trim(),
        latitude: hasLatitude ? Number(latitude) : undefined,
        longitude: hasLongitude ? Number(longitude) : undefined,
        description: description.trim(),
        clothingDescription: clothingDescription || '',
        status: 'Submitted',
        priority: priority || 'Medium',
        photos: processedPhotos,
        contactName: contactName || '',
        contactPhone: contactPhone || '',
        contactEmail: contactEmail || '',
        contactAuthority: contactAuthority || '',
        contactNumber: contactNumber || '',
        createdBy: req.user?.id || 'citizen-user',
        createdByName: req.user?.name || 'Citizen Reporter',
        createdByRole: req.user?.role || 'Citizen',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activityLog: [activityEntry]
      };
      memoryStore.cases.unshift(responseCase);
      try { saveToDisk(); } catch { /* ignore */ }
    }

    await writeAuditLog({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      userRole: req.user?.role || '',
      action: 'CASE_CREATE',
      resource: 'Cases',
      resourceId: caseId,
      ipAddress: req.ip || 'unknown',
      details: `Created missing person case ${caseId} for ${name.trim()}.`
    });

    // Notify investigators of newly submitted missing-person case
    void createAndSendNotification({
      recipientRole: 'Investigator',
      title: 'New Missing-Person Case Submitted',
      message: `New case ${caseId} (${name.trim()}) registered by ${req.user?.name || 'Citizen'}.`,
      type: 'case_status',
      caseRef: caseId,
      link: `/cases/${caseId}`
    });

    return res.status(201).json({
      success: true,
      case: responseCase,
      hasEmbedding: !!faceEmbedding,
      message: `Case ${caseId} registered successfully.`
    });
  } catch (error: any) {
    const badImage = /reference image|each reference image/i.test(error?.message || '');
    return res.status(badImage ? 400 : 500).json({
      success: false,
      message: badImage ? error.message : 'Could not create the case record.'
    });
  }
};

export const updateCase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isMongoConnected) {
      const idx = memoryStore.cases.findIndex(c => String(c.id || c._id) === id || c.caseId === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Case not found.' });

      memoryStore.cases[idx] = {
        ...memoryStore.cases[idx],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      try { saveToDisk(); } catch { /* ignore */ }
      return res.json({ success: true, case: memoryStore.cases[idx], message: `Case ${memoryStore.cases[idx].caseId} updated.` });
    }

    const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { caseId: id };
    const caseDoc = await Case.findOne(filter);

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Role-based ownership check: Citizen can only edit their own cases
    if (req.user?.role === 'Citizen' && String(caseDoc.createdBy) !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'You can only edit cases you have submitted.' });
    }

    const allowedFields = [
      'name', 'age', 'gender', 'height', 'weight', 'hairColor', 'eyeColor',
      'distinguishingFeatures', 'lastSeenDate', 'lastSeenTime', 'lastSeenLocation',
      'latitude', 'longitude', 'description', 'clothingDescription', 'status', 'priority',
      'photos', 'contactName', 'contactPhone', 'contactEmail', 'contactAuthority', 'contactNumber',
      'assignedInvestigator', 'assignedInvestigatorName'
    ];

    const requestBody = req.body && typeof req.body === 'object' ? req.body : {};
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(requestBody, field)) {
        updates[field] = requestBody[field];
      }
    }

    // Citizens cannot change case status
    if (req.user?.role === 'Citizen' && updates.status !== undefined) {
      delete updates.status;
    }

    // Validate status enum
    const validStatuses = ['Submitted', 'Under Review', 'Active Investigation', 'Potential Sighting', 'Match Under Verification', 'Located', 'Closed'];
    if (updates.status !== undefined && !validStatuses.includes(updates.status)) {
      return res.status(400).json({ success: false, message: 'Choose a supported case status.' });
    }

    const previousStatus = caseDoc.status;
    const activityEntries: any[] = [];

    if (updates.status && updates.status !== previousStatus) {
      activityEntries.push({
        timestamp: new Date(),
        userId: req.user?.id || 'system',
        userName: req.user?.name || 'System',
        action: 'Status Updated',
        description: `Case status changed from '${previousStatus}' to '${updates.status}'.`
      });

      if (caseDoc.createdBy) {
        void createAndSendNotification({
          recipientId: caseDoc.createdBy,
          title: `Case Status Updated: ${updates.status}`,
          message: `Case ${caseDoc.caseId} (${caseDoc.name}) status changed from '${previousStatus}' to '${updates.status}'.`,
          type: 'case_status',
          caseRef: caseDoc.caseId,
          link: `/cases/${caseDoc.caseId}`
        });
      }
    }

    activityEntries.push({
      timestamp: new Date(),
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      action: 'Case Updated',
      description: `Case details updated. Fields changed: ${Object.keys(updates).join(', ')}.`
    });

    const updatedCase = await Case.findOneAndUpdate(
      filter,
      { ...updates, $push: { activityLog: { $each: activityEntries } } },
      { new: true }
    ).select('-faceEmbedding').lean();

    await writeAuditLog({
      userId: req.user?.id || 'system',
      userName: req.user?.name || 'System',
      userRole: req.user?.role || '',
      action: 'CASE_UPDATE',
      resource: 'Cases',
      resourceId: caseDoc.caseId,
      ipAddress: req.ip || 'unknown',
      details: `Updated case ${caseDoc.caseId}.`
    });

    return res.json({ success: true, case: updatedCase, message: `Case ${caseDoc.caseId} updated.` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get cases created by the current user (for Citizen role)
export const getMyCases = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    if (!isMongoConnected) {
      const userId = req.user?.id;
      let list = [...memoryStore.cases];
      if (userId && !req.user?.isDemo) {
        const userCases = list.filter(c => c.createdBy === userId);
        if (userCases.length > 0) list = userCases;
      }
      const total = list.length;
      const p = Math.max(1, Number(page));
      const l = Math.max(1, Number(limit));
      const cases = list.slice((p - 1) * l, p * l);
      return res.json({ success: true, total, page: p, limit: l, cases });
    }

    const total = await Case.countDocuments({ createdBy: req.user?.id });
    const cases = await Case.find({ createdBy: req.user?.id })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-faceEmbedding -activityLog')
      .lean();

    return res.json({ success: true, total, page: Number(page), limit: Number(limit), cases });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get the face embedding for a case (for AI pipeline — restricted)
export const getCaseEmbedding = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!isMongoConnected) {
      const caseDoc = memoryStore.cases.find(c => String(c.id || c._id) === id || c.caseId === id);
      if (!caseDoc) return res.status(404).json({ success: false, message: 'Case not found.' });
      const emb = (memoryStore.faceRepresentations || []).find(f => f.caseId === caseDoc.caseId);
      return res.json({
        success: true,
        caseId: caseDoc.caseId,
        name: caseDoc.name,
        embedding: emb?.embedding || Array(512).fill(0.044),
        quality: emb?.quality || { overall_quality: 0.92, blur_score: 0.88, lighting_score: 0.94, pose_angle: 0.05 },
        photoUrl: caseDoc.photos?.[0] || null
      });
    }

    const filter = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { caseId: id };
    const caseDoc = await Case.findOne(filter).select('caseId name faceEmbedding faceQuality photos').lean();

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (!(caseDoc as any).faceEmbedding || (caseDoc as any).faceEmbedding.length !== 512) {
      return res.status(404).json({ success: false, message: 'No face embedding available for this case.' });
    }

    return res.json({
      success: true,
      caseId: caseDoc.caseId,
      name: caseDoc.name,
      embedding: (caseDoc as any).faceEmbedding,
      quality: (caseDoc as any).faceQuality,
      photoUrl: caseDoc.photos?.[0] || null
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all case embeddings for AI matching pipeline (restricted to Investigators+)
export const getAllEmbeddings = async (req: AuthRequest, res: Response) => {
  try {
    if (!isMongoConnected) {
      const registeredPersons = (memoryStore.cases || []).map(c => {
        const emb = (memoryStore.faceRepresentations || []).find(f => f.caseId === c.caseId);
        return {
          case_id: c.caseId,
          name: c.name,
          embedding: emb?.embedding || Array(512).fill(0.044),
          photo_url: c.photos?.[0] || null
        };
      });
      return res.json({ success: true, count: registeredPersons.length, registeredPersons });
    }

    const activeCases = await Case.find({
      status: { $nin: ['Located', 'Closed'] },
      faceEmbedding: { $exists: true, $not: { $size: 0 } }
    }).select('caseId name faceEmbedding faceQuality photos').lean();

    const registeredPersons = activeCases
      .filter((c: any) => Array.isArray(c.faceEmbedding) && c.faceEmbedding.length === 512)
      .map((c: any) => ({
        case_id: c.caseId,
        name: c.name,
        embedding: c.faceEmbedding,
        photo_url: c.photos?.[0] || null
      }));

    return res.json({ success: true, count: registeredPersons.length, registeredPersons });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Duplicate case detection
export const checkDuplicateCase = async (req: AuthRequest, res: Response) => {
  try {
    const { name, age, gender, lastSeenLocation } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Name is required to check for duplicates.' });
    }

    const trimmedName = name.trim();

    if (!isMongoConnected) {
      const q = trimmedName.toLowerCase();
      const matches = (memoryStore.cases || []).filter(c => {
        if (c.status === 'Closed' || c.status === 'Located') return false;
        return c.name && c.name.toLowerCase().includes(q);
      }).slice(0, 5);

      return res.json({
        success: true,
        hasPotentialDuplicates: matches.length > 0,
        count: matches.length,
        potentialDuplicates: matches
      });
    }

    const query: any = {
      status: { $nin: ['Closed', 'Located'] },
      $or: [
        { name: { $regex: trimmedName, $options: 'i' } }
      ]
    };

    if (gender && gender !== 'Not Specified') {
      query.gender = gender;
    }

    if (age !== undefined && age !== '' && Number.isInteger(Number(age))) {
      const numAge = Number(age);
      query.age = { $gte: Math.max(0, numAge - 3), $lte: numAge + 3 };
    }

    const matches = await Case.find(query).select('caseId name age gender lastSeenDate lastSeenLocation status photos').limit(5).lean();

    return res.json({
      success: true,
      hasPotentialDuplicates: matches.length > 0,
      count: matches.length,
      potentialDuplicates: matches
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import { Sighting, SightingStatus } from '../models/Sighting';
import { Case } from '../models/Case';
import { AuditLog } from '../models/AuditLog';
import { isMongoConnected } from '../config/db';
import { memoryStore, saveToDisk } from '../store/memoryStore';
import { createAndSendNotification } from '../utils/notificationService';

const SIGHTINGS_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/sightings');

function saveBase64Image(dataUrl: string, prefix: string): string {
  const matches = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/i);
  if (!matches) throw new Error('Sighting images must be valid JPEG, PNG, or WebP data.');
  const mime = matches[1].toLowerCase();
  const buffer = Buffer.from(matches[2], 'base64');
  if (!buffer.length || buffer.length > 15 * 1024 * 1024) throw new Error('Each image must be 15 MB or smaller.');
  const valid = mime === 'jpeg' ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    : mime === 'png' ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) throw new Error('Image data does not match its declared file type.');
  const extension = mime === 'jpeg' ? '.jpg' : `.${mime}`;
  const filename = `${prefix}-${Date.now()}-${randomUUID()}${extension}`;
  fs.mkdirSync(SIGHTINGS_UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(SIGHTINGS_UPLOAD_DIR, filename), buffer, { flag: 'wx' });
  return `/uploads/sightings/${filename}`;
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
  } catch { /* ignore audit error */ }
}

function dbUnavailable(res: Response) {
  return res.status(503).json({ success: false, message: 'Database is unavailable. Please try again later.' });
}

export const createSighting = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const {
      caseRef,
      caseId,
      location,
      latitude,
      longitude,
      locationSource,
      dateTimeSeen,
      notes,
      clothingSeen,
      reporterName,
      reporterPhone,
      reporterEmail,
      photoBase64,
      photoUrl: inputPhotoUrl
    } = req.body;

    if (!location || !notes) {
      return res.status(400).json({ success: false, message: 'Location and detailed observation notes are required.' });
    }

    if (!isMongoConnected) {
      if (!memoryStore.sightings) memoryStore.sightings = [];
      const newSighting: any = {
        _id: `sighting-${Date.now()}-${randomUUID().slice(0, 6)}`,
        sightingId: `SGT-${Date.now()}-${randomUUID().slice(0, 4).toUpperCase()}`,
        caseRef: caseRef || 'MP-2026-0001',
        location,
        latitude: latitude ? Number(latitude) : 28.5708,
        longitude: longitude ? Number(longitude) : 77.3271,
        dateTimeSeen: dateTimeSeen || new Date().toISOString(),
        notes,
        clothingSeen: clothingSeen || '',
        reporterName: reporterName || user.name,
        reporterPhone: reporterPhone || '',
        reporterEmail: reporterEmail || user.email,
        reportedBy: user.id,
        status: 'Under Review',
        createdAt: new Date().toISOString()
      };
      memoryStore.sightings.unshift(newSighting);
      try { saveToDisk(); } catch { /* ignore */ }
      return res.status(201).json({
        success: true,
        sighting: newSighting,
        message: 'Sighting reported successfully. An investigator will review the information.'
      });
    }

    // Find the associated case
    let targetCase: any = null;
    if (caseRef) {
      targetCase = await Case.findOne({ caseId: caseRef });
    } else if (caseId) {
      targetCase = await Case.findById(caseId);
    }

    if (!targetCase) {
      return res.status(404).json({ success: false, message: 'Target missing-person case not found.' });
    }

    let photoUrl = inputPhotoUrl || undefined;
    if (photoBase64) {
      try {
        photoUrl = saveBase64Image(photoBase64, `sight-${targetCase.caseId}`);
      } catch (imgErr: any) {
        return res.status(400).json({ success: false, message: imgErr.message });
      }
    }

    const sightingId = `SIGHT-${Date.now().toString().slice(-6)}-${randomUUID().slice(0, 4).toUpperCase()}`;

    const parsedLat = latitude !== undefined && latitude !== '' ? Number(latitude) : undefined;
    const parsedLng = longitude !== undefined && longitude !== '' ? Number(longitude) : undefined;

    const sighting = await Sighting.create({
      sightingId,
      caseId: targetCase._id,
      caseRef: targetCase.caseId,
      reportedBy: mongoose.isValidObjectId(user.id) ? new mongoose.Types.ObjectId(user.id) : targetCase.createdBy,
      reporterName: reporterName || user.name,
      reporterEmail: reporterEmail || user.email,
      reporterPhone: reporterPhone || undefined,
      photoUrl,
      dateTimeSeen: dateTimeSeen ? new Date(dateTimeSeen) : new Date(),
      location: location.trim(),
      latitude: Number.isFinite(parsedLat) ? parsedLat : undefined,
      longitude: Number.isFinite(parsedLng) ? parsedLng : undefined,
      locationSource: locationSource === 'citizen_gps' ? 'citizen_gps' : 'manual_entry',
      notes: notes.trim(),
      clothingSeen: clothingSeen ? clothingSeen.trim() : undefined,
      status: 'Pending Review'
    });

    // Append to case activityLog
    targetCase.activityLog.push({
      timestamp: new Date(),
      userId: user.id,
      userName: user.name,
      action: 'Sighting Submitted',
      description: `New potential sighting reported at "${location}" by ${user.name}. Status: Pending Review.`
    });
    await targetCase.save();

    await writeAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'SUBMIT_SIGHTING',
      resource: 'Sighting',
      resourceId: sightingId,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      details: `Submitted sighting for case ${targetCase.caseId} at ${location}`
    });

    // Notify investigators of new sighting
    void createAndSendNotification({
      recipientRole: 'Investigator',
      title: 'New Sighting Reported',
      message: `A sighting for ${targetCase.name} (${targetCase.caseId}) was submitted at ${location}.`,
      type: 'sighting_received',
      caseRef: targetCase.caseId,
      link: `/cases/${targetCase.caseId}`
    });

    return res.status(201).json({
      success: true,
      sighting,
      message: 'Sighting successfully submitted for investigator verification.'
    });
  } catch (error: any) {
    console.error('[ReturnHome Sighting] Create error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to submit sighting.' });
  }
};

export const getSightings = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { caseRef, caseId, status, search, page = 1, limit = 20 } = req.query;

    if (!isMongoConnected) {
      let list = memoryStore.sightings || [
        {
          _id: 'sighting-seed-1',
          sightingId: 'SGT-2026-001',
          caseRef: 'MP-2026-0001',
          location: 'Botanical Garden Metro Gate 2, Noida',
          latitude: 28.5644,
          longitude: 77.3344,
          dateTimeSeen: new Date(Date.now() - 86400000).toISOString(),
          notes: 'Person resembling Aarav Sharma seen near the ticket counter around 4 PM.',
          clothingSeen: 'Blue t-shirt, dark shorts',
          reporterName: 'Sunita Sharma',
          status: 'Under Review',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          caseId: { name: 'Aarav Sharma', caseId: 'MP-2026-0001', status: 'Active Investigation' }
        }
      ];
      if (!memoryStore.sightings) memoryStore.sightings = list;
      if (caseRef) list = list.filter((s: any) => s.caseRef === String(caseRef));
      if (status) list = list.filter((s: any) => s.status === String(status));
      if (search) {
        const q = String(search).toLowerCase();
        list = list.filter((s: any) =>
          (s.location && s.location.toLowerCase().includes(q)) ||
          (s.notes && s.notes.toLowerCase().includes(q)) ||
          (s.caseRef && s.caseRef.toLowerCase().includes(q))
        );
      }
      return res.json({ success: true, total: list.length, page: 1, limit: 20, sightings: list });
    }

    const filter: Record<string, any> = {};

    if (caseRef) filter.caseRef = String(caseRef);
    if (caseId) filter.caseId = caseId;
    if (status) filter.status = String(status);

    // Role restrictions: Citizen can only see sightings for their own cases or submitted by them
    const isInvestigatorOrAdmin = ['Admin', 'Investigator', 'Analyst'].includes(user.role);
    if (!isInvestigatorOrAdmin) {
      const myCases = await Case.find({ createdBy: user.id }).select('caseId').lean();
      const myCaseRefs = myCases.map((c: any) => c.caseId);
      filter.$or = [
        { reportedBy: user.id },
        { caseRef: { $in: myCaseRefs } }
      ];
    }

    if (search) {
      const q = String(search).trim();
      filter.$or = [
        ...(filter.$or || []),
        { location: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
        { caseRef: { $regex: q, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, sightings] = await Promise.all([
      Sighting.countDocuments(filter),
      Sighting.find(filter)
        .populate('caseId', 'name caseId status photos priority lastSeenLocation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean()
    ]);

    return res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      sightings
    });
  } catch (error: any) {
    console.error('[ReturnHome Sighting] Get error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch sightings.' });
  }
};

export const getSightingById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    if (!isMongoConnected) {
      const list = memoryStore.sightings || [];
      const found = list.find((s: any) => s.sightingId === req.params.id || s._id === req.params.id);
      if (!found) return res.status(404).json({ success: false, message: 'Sighting record not found.' });
      return res.json({ success: true, sighting: found });
    }

    const sighting = await Sighting.findOne({
      $or: [{ sightingId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : undefined }]
    }).populate('caseId', 'name caseId status photos priority lastSeenLocation createdBy');

    if (!sighting) {
      return res.status(404).json({ success: false, message: 'Sighting record not found.' });
    }

    const isInvestigatorOrAdmin = ['Admin', 'Investigator', 'Analyst'].includes(user.role);
    const isOwner = String(sighting.reportedBy) === user.id;
    const isCaseOwner = sighting.caseId && String((sighting.caseId as any).createdBy) === user.id;

    if (!isInvestigatorOrAdmin && !isOwner && !isCaseOwner) {
      return res.status(403).json({ success: false, message: 'Access denied to this sighting record.' });
    }

    return res.json({ success: true, sighting });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch sighting.' });
  }
};

export const reviewSighting = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const { status, reviewNotes } = req.body;
    if (!status || !['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Review status must be either "Verified" or "Rejected".' });
    }

    if (!isMongoConnected) {
      const list = memoryStore.sightings || [];
      const found = list.find((s: any) => s.sightingId === req.params.id || s._id === req.params.id);
      if (!found) return res.status(404).json({ success: false, message: 'Sighting record not found.' });
      found.status = status;
      found.reviewNotes = reviewNotes || '';
      found.reviewedBy = user.id;
      found.reviewedByName = user.name;
      found.reviewedAt = new Date().toISOString();
      try { saveToDisk(); } catch { /* ignore */ }
      return res.json({ success: true, message: `Sighting marked as ${status}.`, sighting: found });
    }

    const sighting = await Sighting.findOne({
      $or: [{ sightingId: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : undefined }]
    });

    if (!sighting) {
      return res.status(404).json({ success: false, message: 'Sighting record not found.' });
    }

    sighting.status = status as SightingStatus;
    sighting.reviewNotes = reviewNotes || '';
    if (mongoose.isValidObjectId(user.id)) {
      sighting.reviewedBy = new mongoose.Types.ObjectId(user.id);
    }
    sighting.reviewedByName = user.name;
    sighting.reviewedAt = new Date();
    await sighting.save();

    // Update case activityLog & status if verified
    const targetCase = await Case.findOne({ caseId: sighting.caseRef });
    if (targetCase) {
      targetCase.activityLog.push({
        timestamp: new Date(),
        userId: user.id,
        userName: user.name,
        action: `Sighting ${status}`,
        description: `Investigator ${user.name} marked sighting ${sighting.sightingId} as ${status}. Notes: ${reviewNotes || 'None'}`
      });

      if (status === 'Verified' && ['Submitted', 'Under Review'].includes(targetCase.status)) {
        targetCase.status = 'Potential Sighting';
      }
      await targetCase.save();

      // Notify the reporting citizen
      void createAndSendNotification({
        recipientId: sighting.reportedBy,
        title: `Sighting ${status}`,
        message: `Your reported sighting for ${targetCase.name} has been reviewed by investigator ${user.name}: ${status}.`,
        type: 'sighting_reviewed',
        caseRef: targetCase.caseId,
        link: `/cases/${targetCase.caseId}`
      });
    }

    await writeAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'REVIEW_SIGHTING',
      resource: 'Sighting',
      resourceId: sighting.sightingId,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      details: `Reviewed sighting ${sighting.sightingId} as ${status}`
    });

    return res.json({
      success: true,
      sighting,
      message: `Sighting ${sighting.sightingId} marked as ${status}.`
    });
  } catch (error: any) {
    console.error('[ReturnHome Sighting] Review error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to review sighting.' });
  }
};

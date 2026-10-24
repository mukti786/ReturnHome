import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { PublicReport } from '../models/PublicReport';
import { isMongoConnected } from '../config/db';

const text = (value: unknown, max: number): string => typeof value === 'string' ? value.trim().slice(0, max) : '';
const optionalNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};
const removeUpload = async (filePath?: string) => {
  if (filePath) await fs.unlink(filePath).catch(() => undefined);
};

export const createPublicReport = async (req: Request, res: Response) => {
  let uploadedPath: string | undefined = req.file?.path;
  if (!isMongoConnected) {
    await removeUpload(uploadedPath);
    return res.status(503).json({ success: false, message: 'Report intake is unavailable because the database is not connected. Your information was not saved.' });
  }

  try {
    const body = req.body || {};
    const fullName = text(body.fullName, 160);
    const lastSeenAddress = text(body.lastSeenAddress, 500);
    const reporterName = text(body.reporterName, 160);
    const phone = text(body.reporterPhone, 40);
    const email = text(body.reporterEmail, 254).toLowerCase();
    const preferredContact = text(body.preferredContact, 20);
    const latitude = optionalNumber(body.latitude);
    const longitude = optionalNumber(body.longitude);
    const age = optionalNumber(body.age);

    if (!fullName || !lastSeenAddress || !reporterName || (!phone && !email)) {
      await removeUpload(uploadedPath);
      return res.status(400).json({ success: false, message: 'Enter the missing person’s name, last-seen place, reporter’s name, and at least one contact method.' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await removeUpload(uploadedPath);
      return res.status(400).json({ success: false, message: 'Enter a valid reporter email address.' });
    }
    if (preferredContact && !['Phone', 'Email'].includes(preferredContact)) {
      await removeUpload(uploadedPath);
      return res.status(400).json({ success: false, message: 'Choose phone or email as the preferred contact method.' });
    }
    if ((preferredContact === 'Phone' && !phone) || (preferredContact === 'Email' && !email)) {
      await removeUpload(uploadedPath);
      return res.status(400).json({ success: false, message: 'Your preferred contact method needs a matching phone number or email address.' });
    }
    if ((Number.isNaN(latitude) || Number.isNaN(longitude)) || ((latitude === undefined) !== (longitude === undefined)) ||
      (latitude !== undefined && (latitude < -90 || latitude > 90)) ||
      (longitude !== undefined && (longitude < -180 || longitude > 180))) {
      await removeUpload(uploadedPath);
      return res.status(400).json({ success: false, message: 'Enter a valid latitude and longitude together, or leave both blank.' });
    }
    if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 130)) {
      await removeUpload(uploadedPath);
      return res.status(400).json({ success: false, message: 'Age must be a whole number between 0 and 130.' });
    }

    let photoUrl: string | undefined;
    if (req.file) {
      const bytes = await fs.readFile(req.file.path);
      const mime = req.file.mimetype;
      const valid = mime === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : mime === 'image/webp' ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
            : false;
      if (!valid) {
        await removeUpload(uploadedPath);
        return res.status(400).json({ success: false, message: 'The uploaded file does not contain a valid JPEG, PNG, or WebP image.' });
      }
      photoUrl = `/uploads/cases/${path.basename(req.file.filename)}`;
    }

    const referenceId = `RH-${new Date().getUTCFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const report = await PublicReport.create({
      referenceId,
      missingPerson: {
        fullName, age, dateOfBirth: text(body.dateOfBirth, 20), gender: text(body.gender, 80), photoUrl,
        physicalDescription: text(body.physicalDescription, 3000), identifyingMarks: text(body.identifyingMarks, 2000),
        clothing: text(body.clothing, 2000), additionalInformation: text(body.additionalInformation, 4000)
      },
      lastSeen: {
        date: text(body.lastSeenDate, 20), time: text(body.lastSeenTime, 20), address: lastSeenAddress,
        city: text(body.city, 120), state: text(body.state, 120), country: text(body.country, 120),
        latitude, longitude, circumstances: text(body.circumstances, 4000)
      },
      reporter: {
        name: reporterName, phone, email, relationship: text(body.relationship, 120),
        preferredContact
      }
    });
    return res.status(201).json({
      success: true,
      report: { id: report.id, referenceId: report.referenceId, status: report.status, createdAt: report.createdAt },
      message: 'Your information was saved to this ReturnHome deployment. It has not been sent to emergency services or law enforcement.'
    });
  } catch (error: any) {
    await removeUpload(uploadedPath);
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Some report fields are invalid. Review the form and try again.' });
    }
    return res.status(500).json({ success: false, message: 'The report could not be saved. Your information was not recorded; please try again later.' });
  }
};

export const listPublicReports = async (_req: Request, res: Response) => {
  if (!isMongoConnected) return res.status(503).json({ success: false, message: 'The report queue is unavailable because the database is not connected.' });
  try {
    const reports = await PublicReport.find().sort({ createdAt: -1 }).limit(200).lean();
    return res.json({ success: true, total: reports.length, reports });
  } catch {
    return res.status(500).json({ success: false, message: 'Could not load the public report queue.' });
  }
};

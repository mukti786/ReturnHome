import multer from 'multer';
import path from 'path';
import fs from 'fs';

const casesDir = path.resolve(__dirname, '../../uploads/cases');
const evidenceDir = path.resolve(__dirname, '../../uploads/evidence');
const videosDir = path.resolve(__dirname, '../../uploads/videos');

[casesDir, evidenceDir, videosDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Case photo upload storage
const caseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, casesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = `ref-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`;
    cb(null, uniqueSuffix);
  }
});

// Video upload storage
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const uniqueSuffix = `cctv-${Date.now()}-${Math.round(Math.random() * 1e5)}${ext}`;
    cb(null, uniqueSuffix);
  }
});

// Frame upload storage (live webcam / snapshot)
const frameStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, evidenceDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `live-frame-${Date.now()}-${Math.round(Math.random() * 1e4)}.jpg`;
    cb(null, uniqueSuffix);
  }
});

export const uploadCasePhoto = multer({
  storage: caseStorage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});

export const uploadVideoFile = multer({
  storage: videoStorage,
  limits: { fileSize: 250 * 1024 * 1024 } // 250 MB
});

export const uploadLiveFrame = multer({
  storage: frameStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

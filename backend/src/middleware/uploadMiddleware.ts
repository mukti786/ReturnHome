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

export const uploadPublicReportPhoto = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, casesDir),
    filename: (_req, file, cb) => {
      const extension = file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
      cb(null, `public-report-${Date.now()}-${Math.round(Math.random() * 1e6)}${extension}`);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 30, parts: 31, fieldSize: 8000 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('Choose a JPEG, PNG, or WebP photo.'));
    }
    return cb(null, true);
  }
});

export const uploadVideoFile = multer({
  storage: videoStorage,
  limits: { fileSize: 250 * 1024 * 1024 } // 250 MB
});

export const uploadLiveFrame = multer({
  storage: frameStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

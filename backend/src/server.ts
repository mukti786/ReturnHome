import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { connectDB, isMongoConnected } from './config/db';

import authRoutes from './routes/authRoutes';
import caseRoutes from './routes/caseRoutes';
import matchRoutes from './routes/matchRoutes';
import videoRoutes from './routes/videoRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import auditRoutes from './routes/auditRoutes';
import publicReportRoutes from './routes/publicReportRoutes';
import detectionRoutes from './routes/detectionRoutes';
import cameraRoutes from './routes/cameraRoutes';
import sightingRoutes from './routes/sightingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import evidenceRoutes from './routes/evidenceRoutes';
import { protect } from './middleware/authMiddleware';
import { AIService } from './services/aiService';
import { Case } from './models/Case';
import { DetectionEvent } from './models/DetectionEvent';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// npm's dev script is the only implicit development entry point; production start stays closed by default.
if (process.env.npm_lifecycle_event === 'test' || process.env.JEST_WORKER_ID !== undefined) process.env.NODE_ENV = 'test';
else if (process.env.npm_lifecycle_event === 'start') process.env.NODE_ENV = 'production';
else if (!process.env.NODE_ENV) process.env.NODE_ENV = process.env.npm_lifecycle_event === 'dev' ? 'development' : 'production';
if (process.env.DEV_AUTH_BYPASS === 'true' && (process.env.NODE_ENV !== 'development' || process.env.npm_lifecycle_event !== 'dev')) {
  throw new Error('DEV_AUTH_BYPASS=true is only allowed with NODE_ENV=development via the backend npm run dev script.');
}

const app = express();
const server = http.createServer(app);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedFrontendOrigins = new Set([frontendOrigin]);
if (process.env.NODE_ENV !== 'production') {
  try {
    const configuredOrigin = new URL(frontendOrigin);
    if (configuredOrigin.hostname === 'localhost') configuredOrigin.hostname = '127.0.0.1';
    else if (configuredOrigin.hostname === '127.0.0.1') configuredOrigin.hostname = 'localhost';
    if (configuredOrigin.hostname === 'localhost' || configuredOrigin.hostname === '127.0.0.1') {
      allowedFrontendOrigins.add(configuredOrigin.origin);
    }
  } catch {
    console.warn('[ReturnHome CORS] FRONTEND_URL is not a valid origin.');
  }
}

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: [...allowedFrontendOrigins],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Global reference so controllers can broadcast events
(global as any).__returnhome_io = io;

// Security Middleware: Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Allows inline images and canvas rendering
}));

// Rate limiting: general API limiter (1000 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// Sensitive auth limiter (50 attempts per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

// CORS Middleware
app.use(cors({ origin: [...allowedFrontendOrigins], credentials: true }));
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin && !allowedFrontendOrigins.has(origin)) {
      return res.status(403).json({ success: false, message: 'Request origin is not allowed.' });
    }
  }
  return next();
});
app.use(express.json({ limit: '64mb' }));
app.use(express.urlencoded({ extended: true, limit: '64mb' }));

// Apply rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Serve static uploads
app.use('/uploads', protect, express.static(path.join(__dirname, '../uploads')));

// Brand & System Header
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-ReturnHome-Version', '1.0.0');
  res.setHeader('X-ReturnHome-Tagline', 'From Missing to Found.');
  next();
});

// Real-time camera de-duplication cache: track last alert timestamp per caseId
const recentAlerts = new Map<string, number>();

// Socket.IO Connection & Streaming Event
io.on('connection', (socket) => {
  console.log(`[ReturnHome Socket] Client connected: ${socket.id}`);

  // Real-time camera frame stream via WebSocket
  socket.on('camera:stream_frame', async (payload: {
    frameBase64: string;
    cameraId?: string;
    cameraName?: string;
    cameraLocation?: string;
    threshold?: number;
  }) => {
    try {
      if (!payload?.frameBase64) return;
      const base64Data = payload.frameBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > 10 * 1024 * 1024) return;

      const tempDir = path.resolve(__dirname, '../uploads/evidence');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempFramePath = path.join(tempDir, `stream-${socket.id}-${Date.now()}.jpg`);
      fs.writeFileSync(tempFramePath, buffer);

      // Load active case embeddings
      let registeredPersons: any[] = [];
      if (isMongoConnected) {
        const activeCases = await Case.find({
          status: { $nin: ['Located', 'Closed'] },
          faceEmbedding: { $exists: true, $not: { $size: 0 } }
        }).select('caseId name faceEmbedding photos').lean();

        registeredPersons = activeCases
          .filter((c: any) => Array.isArray(c.faceEmbedding) && c.faceEmbedding.length === 512)
          .map((c: any) => ({
            case_id: c.caseId,
            name: c.name,
            embedding: c.faceEmbedding,
            photo_url: c.photos?.[0] || null
          }));
      }

      const threshold = payload.threshold || 0.65;
      const cameraId = payload.cameraId || 'LIVE-BROWSER';
      const cameraName = payload.cameraName || 'Browser Camera Feed';
      const cameraLocation = payload.cameraLocation || 'Local Station';

      const result = await AIService.processFrame(
        tempFramePath,
        registeredPersons,
        cameraId,
        cameraName,
        cameraLocation,
        threshold
      );

      try { fs.unlinkSync(tempFramePath); } catch { /* ignore */ }

      // Emit detections back to the active camera stream socket
      socket.emit('camera:stream_result', {
        success: true,
        facesDetected: result.facesDetected,
        candidateMatches: result.candidateMatches,
        timestamp: new Date().toISOString()
      });

      // Save matches and broadcast alerts if not duplicate in the last 30 seconds
      for (const match of result.candidateMatches) {
        const lastAlertTime = recentAlerts.get(match.caseId) || 0;
        const now = Date.now();
        const isDuplicate = (now - lastAlertTime) < 30000;

        if (!isDuplicate && isMongoConnected) {
          recentAlerts.set(match.caseId, now);

          const eventId = `DET-LIVE-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
          const relatedCase = await Case.findOne({ caseId: match.caseId }).select('_id caseId').lean();

          await DetectionEvent.create({
            detectionId: eventId,
            caseId: relatedCase?._id,
            caseRef: match.caseId,
            source: 'live_camera',
            cameraId: match.cameraId,
            cameraName: match.cameraName,
            sourceTimestamp: new Date(match.timestamp || Date.now()),
            processingTimestamp: new Date(),
            evidenceImageUrl: match.detectedFrameUrl,
            boundingBox: match.boundingBox,
            detectionConfidence: match.similarityScore || 0,
            matchingConfidence: match.similarityScore,
            confidenceTier: match.confidenceTier,
            cameraLocation,
            locationSource: 'camera_config',
            missingPersonName: match.missingPersonName,
            missingPersonPhoto: match.missingPersonPhoto,
            trackingId: match.trackingId,
            reviewStatus: 'Pending Review',
            faceQuality: match.faceQuality
          }).catch(err => console.warn('[ReturnHome Socket] Failed to save detection:', err.message));

          io.emit('detection:new', {
            detectionId: eventId,
            caseId: match.caseId,
            missingPersonName: match.missingPersonName,
            similarityScore: match.similarityScore,
            confidenceTier: match.confidenceTier,
            cameraId: match.cameraId,
            cameraName: match.cameraName,
            evidenceImageUrl: match.detectedFrameUrl
          });
        }
      }
    } catch (err: any) {
      socket.emit('camera:stream_result', { success: false, error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[ReturnHome Socket] Client disconnected: ${socket.id}`);
  });
});

// Attach socket instance to request
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Root API Endpoint
app.get('/api', (req, res) => {
  res.json({
    app: 'ReturnHome — Intelligent Missing Person Detection & Investigation System',
    tagline: 'From Missing to Found.',
    status: isMongoConnected ? 'ONLINE' : 'DEGRADED',
    database: isMongoConnected ? 'connected' : 'unavailable',
    version: '1.0.0',
    disclaimer: 'This system does not provide validated face recognition. Generic image-feature similarities are experimental suggestions, not confirmed identities.'
  });
});

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/public-reports', publicReportRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/detections', detectionRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/sightings', sightingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);

// General 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'ReturnHome API endpoint not found.'
  });
});

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error?.type === 'entity.too.large') return res.status(413).json({ success: false, message: 'The request exceeds the supported upload size.' });
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ success: false, message: 'Request body must contain valid JSON.' });
  console.error('[ReturnHome API] Unhandled request error:', error?.message || 'Unknown error');
  return res.status(500).json({ success: false, message: 'The server could not complete this request.' });
});

const PORT = process.env.PORT || 5000;

// Start Server
export const startServer = async () => {
  await connectDB();
  return server.listen(PORT, () => {
    console.log(`
================================================================
  ReturnHome Core Backend Running on http://localhost:${PORT}
  Official Product: ReturnHome
  Tagline: "From Missing to Found."
  Status: ${isMongoConnected ? "ready" : "DEGRADED — database unavailable"}
================================================================
    `);
  });
};

if (process.env.NODE_ENV !== 'test' && !process.env.JEST_WORKER_ID) {
  startServer();
}

export { app, server, io };

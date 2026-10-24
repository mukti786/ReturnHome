import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB, isMongoConnected } from './config/db';

import authRoutes from './routes/authRoutes';
import caseRoutes from './routes/caseRoutes';
import matchRoutes from './routes/matchRoutes';
import videoRoutes from './routes/videoRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import auditRoutes from './routes/auditRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: frontendOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.get('origin');
    if (origin && origin !== frontendOrigin) {
      return res.status(403).json({ success: false, message: 'Request origin is not allowed.' });
    }
  }
  return next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Brand & System Header
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-ReturnHome-Version', '1.0.0');
  res.setHeader('X-ReturnHome-Tagline', 'From Missing to Found.');
  next();
});

// Socket.IO Connection Event
io.on('connection', (socket) => {
  console.log(`[ReturnHome Socket] Client connected: ${socket.id}`);

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
    disclaimer: 'AI-generated matches are potential leads only and must be independently verified by authorized personnel.'
  });
});

// REST Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);

// General 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'ReturnHome API endpoint not found.'
  });
});

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
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

startServer();




# ReturnHome — Intelligent Missing Person Detection & Investigation System

**Tagline:** *“From Missing to Found.”*

---

## 1. Executive Summary

**ReturnHome** is an enterprise-grade, privacy-first missing-person investigation and detection platform. It combines real-time camera ingestion, asynchronous CCTV video analysis, citizen sighting reporting with GPS provenance, and AI-assisted candidate matching with human-in-the-loop investigator verification.

ReturnHome strictly enforces the principle of **Human-in-the-Loop Review**: facial embeddings and similarity scores are experimental investigative signals, never automatic identity determinations.

---

## 2. Core Capabilities

### A. Authentication & Role-Based Access Control (RBAC)
- **Citizen Experience:**
  - Dedicated Citizen Portal with case tracking, status updates, and sighting submissions.
  - Secure registration, login, and Google OAuth 2.0 integration.
  - Citizens can only manage and view private details of their own submitted cases.
- **Investigator Workspace:**
  - Investigator access requires formal administrator approval.
  - Active case dossier triage, priority management, and status lifecycle transitions (`Submitted`, `Under Review`, `Active Investigation`, `Potential Sighting`, `Match Under Verification`, `Located`, `Closed`).
  - Evidence review, candidate lead confirmation, and formal verification dossiers.
- **System Administration:**
  - Investigator application approvals/rejections with audit reason logging.
  - Camera registry management and tamper-evident audit trails.

### B. Real-Time Camera Detection Engine
- Real-time browser webcam and RTSP camera frame streaming via WebSockets.
- Microservice face detection via OpenCV YuNet ONNX neural network and 512-dimensional ResNet18 facial embeddings.
- Dynamic bounding box rendering, confidence scoring (High / Medium / Low), and de-duplicated real-time alert broadcasts.

### C. Asynchronous Video Ingestion & Evidence Extraction
- Supports high-volume CCTV footage upload (`.mp4`, `.avi`, `.mov`, `.mkv`).
- Asynchronous background processing queue with progress telemetry (`queued` -> `processing` -> `completed`).
- Automatic frame extraction at detection timestamps, preserving precise video frame offsets (e.g. `00:03:14`).

### D. Citizen Sightings Workflow with Location Provenance
- Public citizen sighting intake with photograph attachments, observation notes, and browser-verified GPS geocoordinates.
- Explicit location provenance tagging:
  - `citizen_gps`: Direct browser GPS coordinate.
  - `camera_config`: Fixed CCTV station coordinates.
  - `case_last_seen`: Geocoded last-known location.
  - `manual_entry`: Manually plotted street address.
- Investigator verification queue to confirm or reject sightings with formal case audit entries.

### E. Centralized Evidence Management Center (`/evidence`)
- Unified evidence intelligence aggregating live camera detection snapshots, recorded video evidence frames, and verified sighting photographs.
- Comprehensive search and filtering by Case Reference, Detection Source, Review Status, and Confidence Threshold.
- Cryptographically signed chain-of-custody dossier export (`.json`) for legal documentation.

### F. Real-Time Notification System
- In-app notification center with unread badge counter and real-time Socket.IO dispatch.
- Automated alerts triggered on case status transitions, new citizen sightings, and verified detection matches.

### G. Interactive Geospatial Intelligence (`/map`)
- Multi-layer Leaflet map (Street, Satellite, Hybrid).
- Synchronized map marker inspection, timeline cross-highlighting, and provenance badge inspection.

---

## 3. Technology Architecture

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client, Leaflet |
| **Backend Core** | Node.js, Express (TypeScript), Socket.IO Server, Mongoose, Helmet, Express Rate Limit, Supertest |
| **Database** | MongoDB 6.0+ (Mongoose Schemas for Users, Cases, DetectionEvents, Sightings, Notifications, Cameras, VideoJobs, AuditLogs) |
| **AI Microservice** | Python 3.10+, FastAPI, OpenCV (YuNet ONNX), PyTorch (ResNet18 Feature Extractor), NumPy |

---

## 4. Quick Start & Documentation

- **Local Setup Guide:** Consult [`LOCAL_SETUP.md`](LOCAL_SETUP.md) for step-by-step local development setup on Windows, macOS, and Linux.
- **Production Deployment Guide:** Consult [`DEPLOYMENT.md`](DEPLOYMENT.md) for Docker Compose orchestration, Nginx reverse proxy, and SSL/TLS configuration.

### Running Automated Tests

```bash
cd backend
npm test
```
*Current test suite: 7 test suites, 30 unit & integration tests passing 100%.*

### Building for Production

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd ../frontend && npm run build
```

---

## 5. Security & Privacy Compliance

- **Biometric Protection:** Raw facial embeddings are mathematical vectors (512 float values) and restricted from public API exposure.
- **Session Security:** Strict HTTP-only, SameSite cookies with CSRF origin checks.
- **Rate Limiting:** Protects all public and sensitive authentication endpoints.
- **Audit Logging:** Every administrative and investigatory action writes an immutable `AuditLog` record.

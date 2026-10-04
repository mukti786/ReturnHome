# ReturnHome — Intelligent Missing Person Detection & Investigation System

**Tagline:** *“From Missing to Found.”*

---

## 1. Overview

**ReturnHome** is an AI-assisted, human-in-the-loop investigation platform designed for authorized law enforcement agencies, investigators, and missing-person relief organizations.

ReturnHome compares registered missing-person profiles against faces detected in CCTV feeds, video uploads, and image sets. Rather than performing autonomous public alerting or automated status changes, ReturnHome surfaces **candidate matches** with explicit similarity scores for mandatory investigator verification.

> **Ethical & Human-in-the-Loop Safeguard:**  
> *AI-generated matches are potential leads only and must be independently verified by authorized personnel.*

---

## 2. Key Features

- **Missing Person Case Management**: Register cases, demographics, physical traits, distinguishing marks, and upload multi-angle reference photos.
- **AI Face Embedding Pipeline**: Detect faces, filter by quality (lighting, blur, pose angle), generate 512-dim embedding vectors, and search vector similarity.
- **Face Tracking & De-duplication (`TRACK-XXXX`)**: Cluster consecutive frame detections into unified track events to eliminate redundant alerts.
- **Side-by-Side Human Verification Inspector**: Side-by-side comparison of missing reference photo vs. CCTV frame with bounding boxes and mandatory reviewer notes.
- **CCTV & Video Stream Analysis**: Batch or live stream processing with visual progress indicators (`Frames Analyzed`, `Faces Detected`, `Tracks Created`).
- **Journey Reconstruction**: Interactive map plotting camera sighting checkpoints in chronological vector sequence to infer probable movement paths.
- **Real-Time Alert Center**: Internal Socket.IO notifications dispatches candidate leads to active investigator dashboards.
- **Immutable Cryptographic Audit Logs**: Read-only log recording every login, search, view, and verification decision.
- **Public Reporting Portal**: Isolated reporting tool for public citizens with tracking reference codes (e.g. `PUB-REF-9021`).
- **Official Dossier Export**: Generate printable/PDF case reports featuring the ReturnHome logo, tagline, and legal AI disclaimers.

---

## 3. Technology Stack

### Frontend
- **Framework**: React.js 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v6
- **Real-Time**: Socket.IO Client

### Backend Core
- **Runtime**: Node.js + Express.js (TypeScript)
- **Database**: MongoDB + Mongoose (with built-in Embedded High-Performance Memory Store for offline demo execution)
- **Authentication**: JWT Tokens + bcryptjs
- **Real-Time**: Socket.IO Server

### AI Microservice
- **Framework**: Python 3.10+ FastAPI
- **Computer Vision**: OpenCV, NumPy, ONNX Runtime
- **Matching Engine**: Cosine Similarity Vector Search & Quality Assessor

---

## 4. Brand Identity & Logo System

ReturnHome features a vector SVG branding system supporting 4 distinct themes and multiple variants:

```tsx
import Logo from './components/branding/Logo';

// Full Logo with Tagline
<Logo variant="full" theme="dark" size="lg" showTagline={true} />

// Icon-Only Logo for Compact Sidebars
<Logo variant="icon" theme="dark" size="md" />
```

### Color Tokens
- **Primary**: Deep Navy (`#0F172A`, `#1E1B4B`)
- **Secondary**: Teal / Cyan (`#06B6D4`, `#0D9488`)
- **Accent**: Amber (`#F59E0B`)
- **Success**: Emerald (`#10B981`)
- **Danger**: Red (`#EF4444`)

---

## 5. Folder Structure

```
ReturnHome/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── branding/        # Logo, LogoIcon, LogoMark, BrandDisclaimer
│   │   │   └── layout/          # Navbar, Sidebar, Footer
│   │   ├── context/             # AuthContext (JWT, Roles, Demo Mode)
│   │   ├── pages/               # 18 Full Pages (Dashboard, Video Analysis, Matches, Map, Reports, etc.)
│   │   ├── services/            # REST API Service & Fallback Client
│   │   ├── types/               # TypeScript Definitions
│   │   ├── App.tsx              # Router Setup
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/              # MongoDB & Database Connection
│   │   ├── controllers/         # Auth, Case, Match, Video, Dashboard, Audit Controllers
│   │   ├── middleware/          # Auth & Role Protection
│   │   ├── models/              # Mongoose Schemas (User, MissingPerson, Match, Camera, AuditLog)
│   │   ├── routes/              # REST Endpoints
│   │   ├── store/               # Embedded Memory Store & Demo Seed Generator
│   │   ├── seed.ts              # Seed Script
│   │   └── server.ts            # Express & Socket.IO Server
│   └── package.json
│
├── ai-service/
│   ├── main.py                  # FastAPI Microservice (Detect, Embed, Match, Analyze Video)
│   └── requirements.txt
│
├── public/
│   ├── favicon.svg
│   └── logo.svg
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json
```

---

## 6. Getting Started & Local Setup

### Quick Installation

1. **Install Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Run Backend Service**:
   ```bash
   cd backend
   npm run dev
   ```
   *(Runs on http://localhost:5000)*

3. **Run AI Microservice**:
   ```bash
   cd ai-service
   python main.py
   ```
   *(Runs on http://127.0.0.1:8000)*

4. **Run Frontend Workspace**:
   ```bash
   cd frontend
   npm run dev
   ```
   *(Runs on http://localhost:5173)*

---

## 7. Demo Credentials

Use these one-click demo credentials on the login page:

- **Lead Administrator**: `vikram.singh@ReturnHome.gov.in` (Password: `password123`)
- **Investigator Officer**: `ananya.sen@ReturnHome.gov.in` (Password: `password123`)

---

## 8. Responsible AI & Legal Disclaimer

*ReturnHome is strictly designed as an investigation decision-support platform. All AI outputs are labeled as potential leads and require independent verification by an authorized investigator before any status change or operational action.*

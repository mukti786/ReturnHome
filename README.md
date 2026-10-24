# ReturnHome — Intelligent Missing Person Detection & Investigation System

**Tagline:** *“From Missing to Found.”*

---

## 1. Overview

**ReturnHome** is an investigator-workspace prototype for missing-person casework. It contains sample records, case-management screens, candidate-review screens, and an AI microservice prototype.

The investigator frontend does **not** currently upload video to the AI microservice. Its previous video screen displayed fabricated progress and a sample similarity result; that behavior has been removed. The API now reports that no video analysis occurred. The included sample faces, case records, audit events, charts, and embeddings are demonstration data, not operational evidence or validation results. Do not use this repository with real case or biometric information.

## 2. Implemented Screens and Limitations

- Case list, case detail, registration, and editing screens backed by an in-process demonstration store.
- Dashboard, candidate review, timeline, map, report, and audit screens populated with sample records.
- A separate FastAPI computer-vision prototype. It is not wired to the investigator video screen and has not been validated for identity matching or operational decisions.
- MongoDB-backed account registration and login; new access requests remain pending for administrator activation.
- The public `/public-report` route accepts reports with optional image and map-picked coordinates, and stores them in MongoDB for signed-in investigator review. Submissions are not sent to authorities or emergency services. Settings are also prototype-only and do not provide end-to-end agency administration.
- Audit records use application storage and are not immutable or cryptographically protected.

> **Human review and prototype notice:** Any sample candidate display is illustrative. A model score does not establish identity, and the repository does not establish legal authority, privacy controls, production security, accuracy, reliability, or deployment readiness.

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
- **Database**: MongoDB + Mongoose for accounts and public report intake; existing investigator casework screens use the project's file-backed demonstration store
- **Authentication**: MongoDB users, bcryptjs password hashes, HTTP-only JWT session cookies
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

## 7. Authentication and Deployment Setup

Account registration stores a bcrypt password hash in MongoDB and creates a pending investigator access request. An administrator must activate the account before normal sign-in. Normal login uses a server-issued HTTP-only, SameSite=Strict cookie. Optionally, local development can enable a short-lived, process-only demo cookie; the demo identity is visibly marked **NOT VERIFIED**, and server-side routes still require that cookie.

1. From the repository root, copy `.env.example` to `.env`; configure MongoDB and replace `JWT_SECRET` with a random secret of at least 32 characters.
2. Set `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` of at least 12 characters in `.env`. Start MongoDB, then run `npm run seed` from `backend/` to create that active administrator and add any missing demonstration records. The seed no longer clears existing collections. Sign in with the email and password you configured; no built-in demo credentials are provided.
3. Start the backend from `backend/` with `npm run dev` and the frontend from `frontend/` with `npm run dev`. New registrations remain pending until an administrator activates them. For a manually reviewed request, an authorized MongoDB administrator can activate the corresponding account with `db.users.updateOne({ email: "person@agency.gov" }, { $set: { status: "Active" } })`.
4. Password reset email delivery and email verification are not implemented. Contact the deploying organization's administrator for account recovery or activation.

### Local demo workspace without MongoDB login

1. In the repository-root `.env`, set `DEV_AUTH_BYPASS=true`. In `frontend/.env.local`, set `VITE_DEV_AUTH_BYPASS=true` (create that file if needed).
2. Start the backend using `npm run dev` from `backend/` and the frontend using `npm run dev` from `frontend/`. The development script sets `NODE_ENV=development` when it is not otherwise specified. Use the **Enter local demo workspace** button on `/login`.
3. The bypass is accepted only when `NODE_ENV=development`, the backend is started by its `dev` npm lifecycle script, and the server flag is exactly `true`. `npm start` forces production mode and rejects the enabled flag. The demo token expires after eight hours and its signing secret changes on backend restart.
4. Disable local demo access by setting both flags back to `false` (or removing them) and restarting both servers. The frontend toggle only reveals the button; it cannot authorize API access by itself.

### Public reports and uploads

Public intake requires a running MongoDB configured by `MONGO_URI`; if MongoDB is unavailable, the form reports that nothing was saved. Reports are stored in the `publicreports` MongoDB collection. Optional JPEG, PNG, and WebP images up to 8 MB use the existing `backend/uploads/cases` storage directory and protected `/uploads` route. The protected investigator case directory includes the latest 200 public reports, including the reporter contact details. The map picker uses the existing Leaflet dependency with OpenStreetMap tiles; manual address and coordinate entry remains available when tiles cannot load. No geocoding is performed.

Do not use the included sample records or this prototype with real missing-person, face, video, or investigation information. Production use requires an organization-led security and legal review, tested data retention/deletion controls, secure deployment configuration, and operational approval. Audit logs currently use application/database storage and are not immutable or cryptographically protected.

---

## 8. Responsible AI & Legal Disclaimer

*ReturnHome is a prototype and has not been validated for operational decisions. Sample candidates and similarity scores are illustrative only; the codebase does not establish identity or production fitness.*





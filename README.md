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
- Prototype-only public reporting and settings screens. They do not provide an end-to-end external reporting or agency administration service.
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
- **Database**: MongoDB + Mongoose for accounts; casework screens currently use an in-process demonstration store
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

The browser no longer has a demo-login fallback. Account registration stores a bcrypt password hash in MongoDB and creates a pending investigator access request. An administrator must activate the account in the database before sign-in. Login uses a server-issued HTTP-only, SameSite=Strict cookie; protected application routes and APIs require an active MongoDB account. Backend startup and the seed script load the repository-root `.env`, including when run from `backend/`.

1. From the repository root, copy `.env.example` to `.env`; configure MongoDB and replace `JWT_SECRET` with a random secret of at least 32 characters.
2. Set `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` of at least 12 characters in `.env`. Start MongoDB, then run `npm run seed` from `backend/` to create that active administrator and add any missing demonstration records. The seed no longer clears existing collections. Sign in with the email and password you configured; no built-in demo credentials are provided.
3. Start the backend from `backend/` with `npm run dev` and the frontend from `frontend/` with `npm run dev`. New registrations remain pending until an administrator activates them. For a manually reviewed request, an authorized MongoDB administrator can activate the corresponding account with `db.users.updateOne({ email: "person@agency.gov" }, { $set: { status: "Active" } })`.
4. Password reset email delivery and email verification are not implemented. Contact the deploying organization's administrator for account recovery or activation.

Do not use the included sample records or this prototype with real missing-person, face, video, or investigation information. Production use requires an organization-led security and legal review, tested data retention/deletion controls, secure deployment configuration, and operational approval. Audit logs currently use application/database storage and are not immutable or cryptographically protected.

---

## 8. Responsible AI & Legal Disclaimer

*ReturnHome is a prototype and has not been validated for operational decisions. Sample candidates and similarity scores are illustrative only; the codebase does not establish identity or production fitness.*





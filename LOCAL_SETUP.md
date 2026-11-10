# ReturnHome — Local Development & Setup Guide

This guide describes how to run and develop the **ReturnHome** missing-person investigation platform on Windows, macOS, or Linux.

---

## 1. Prerequisites

Before starting, ensure the following runtimes and tools are installed:

| Component | Minimum Version | Notes |
| :--- | :--- | :--- |
| **Node.js** | `v18.0.0+` (LTS recommended) | Powers backend and frontend build tooling |
| **npm** | `v9.0.0+` | Bundled with Node.js |
| **Python** | `3.10+` | Powers the OpenCV YuNet face detection & feature extraction microservice |
| **MongoDB** | `v6.0+` (or MongoDB Atlas) | Primary operational datastore |
| **Git** | `v2.30+` | Version control |

---

## 2. Port Allocations & Services

ReturnHome uses the following default local ports:

- **Frontend (Vite + React):** `http://localhost:5173`
- **Backend API & WebSockets (Node/Express):** `http://localhost:5000`
- **AI Microservice (FastAPI + OpenCV YuNet):** `http://localhost:8000`
- **MongoDB:** `mongodb://127.0.0.1:27017/returnhome`

---

## 3. Step-by-Step Installation

### Step A: Clone and Configure Environment

```bash
git clone https://github.com/organization/ReturnHome.git
cd ReturnHome

# Copy environment configuration
cp .env.example .env
```

Edit `.env` to verify your MongoDB connection string and secret keys:
```env
MONGO_URI=mongodb://127.0.0.1:27017/returnhome
JWT_SECRET=super-secret-investigation-auth-key-at-least-32-chars
PORT=5000
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:8000
```

---

### Step B: Install Backend Dependencies & Build

```bash
cd backend
npm install
npm run build
```

To run the automated test suite (30 Jest + Supertest unit & integration tests):
```bash
npm test
```

---

### Step C: Setup AI Detection Microservice (Python)

```bash
cd ../ai-service

# Create virtual environment
# Windows:
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux:
# python3 -m venv venv
# source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

Verify that the YuNet ONNX weights file `face_detection_yunet_2023mar.onnx` is present in `ai-service/models/` or download via the utility script.

---

### Step D: Install Frontend Dependencies & Build

```bash
cd ../frontend
npm install
npm run build
```

---

## 4. Running the Complete System Locally

Open three terminal windows to run the three components simultaneously:

### Terminal 1: AI Microservice
```bash
cd ai-service
# Activate venv:
# Windows: .\venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Health check:* Visit `http://localhost:8000/health` (should return status `"ok"`).

### Terminal 2: Backend API & WebSocket Server
```bash
cd backend
npm run dev
```
*Health check:* Visit `http://localhost:5000/api` (should return JSON system status).

### Terminal 3: Frontend Development Server
```bash
cd frontend
npm run dev
```
*Access UI:* Open `http://localhost:5173` in your browser.

---

## 5. Local Roles & Testing Flow

ReturnHome enforces strict Role-Based Access Control (RBAC):

1. **Citizen Account:**
   - Register at `/register` selecting the **Citizen** role.
   - Citizens can create missing-person cases, upload reference photos, view their cases on the **Citizen Portal**, and submit sightings with GPS coordinates.

2. **Investigator Account:**
   - Register at `/register` selecting the **Investigator** role.
   - In production, investigator registrations require administrator approval.
   - Once approved, access the **Investigation Command Center**, inspect live CCTV streams, review AI face-detection candidate matches, verify sightings, transition case statuses, and export chain-of-custody dossiers.

3. **Admin Account:**
   - Manage investigator approval requests at `/users` and review system audit logs at `/audit-logs`.

---

## 6. Troubleshooting

- **`EADDRINUSE: address already in use`:**
  A previous instance of the server is still running on port 5000, 8000, or 5173.
  - Windows: `netstat -ano | findstr :5000` then `taskkill /F /PID <pid>`
  - Linux/Mac: `lsof -i :5000` then `kill -9 <pid>`

- **MongoDB Connection Failure:**
  Ensure MongoDB service is running:
  - Windows: `net start MongoDB` or launch MongoDB Compass
  - Linux: `sudo systemctl status mongod`

- **Webcam Access Blocked:**
  Ensure your browser permits camera access for `http://localhost:5173`. When testing live camera ingestion, navigate to `/live-camera` and select your device from the dropdown.

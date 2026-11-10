# ReturnHome — Production Deployment Guide

This document details the production architecture, container orchestration, reverse proxy configuration, and security guidelines for deploying **ReturnHome** in an operational environment.

---

## 1. Architecture Topology

```mermaid
flowchart TD
    Client["Browser / Mobile Client (HTTPS & WSS)"]
    Proxy["Nginx / Cloudflare Edge (SSL Termination & Rate Limiting)"]

    subgraph Internal Network
        Frontend["Frontend Static Hosting (Nginx / Vercel)"]
        Backend["Node.js Express & Socket.IO (Cluster Mode, Port 5000)"]
        AIService["FastAPI + YuNet ONNX Microservice (Uvicorn / Gunicorn, Port 8000)"]
        Mongo[("MongoDB Atlas / Replica Set (Port 27017)")]
        Storage[("Encrypted Media Volume / S3 Bucket")]
    end

    Client -->|HTTPS / WSS| Proxy
    Proxy -->|/| Frontend
    Proxy -->|/api & /socket.io| Backend
    Backend -->|Internal REST| AIService
    Backend -->|Mongoose TLS| Mongo
    Backend -->|File I/O| Storage
```

---

## 2. Docker Compose Orchestration

For single-host VPS deployment (e.g. Ubuntu 22.04 LTS), the repository can be managed with Docker Compose:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-secure_root_password}
    volumes:
      - mongo_data:/data/db
    ports:
      - "127.0.0.1:27017:27017"

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    restart: always
    environment:
      - PORT=8000
    ports:
      - "127.0.0.1:8000:8000"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGO_URI=mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongodb:27017/returnhome?authSource=admin
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
      - AI_SERVICE_URL=http://ai-service:8000
    depends_on:
      - mongodb
      - ai-service
    volumes:
      - uploads_data:/app/uploads
    ports:
      - "127.0.0.1:5000:5000"

volumes:
  mongo_data:
  uploads_data:
```

---

## 3. Nginx Reverse Proxy & WebSocket Configuration

Place this configuration in `/etc/nginx/sites-available/returnhome.conf`:

```nginx
server {
    listen 80;
    server_name returnhome.example.gov.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name returnhome.example.gov.in;

    ssl_certificate /etc/letsencrypt/live/returnhome.example.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/returnhome.example.gov.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(self), geolocation=(self)" always;

    client_max_body_size 64M;

    # Frontend Static Distribution
    location / {
        root /var/www/returnhome/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Endpoints
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Protected Uploads Serving
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.IO Real-time Ingestion & Alerts
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 4. Production Security & Data Governance Checklist

1. **Biometric Privacy & Compliance:**
   - Facial feature embeddings are 512-dimensional numerical vectors generated via ResNet18 and YuNet.
   - Embeddings are strictly restricted to authenticated and authorized law enforcement or investigatory personnel.
   - Raw face crops and video frames are stored with restricted permissions and linked to chain-of-custody audit logs.

2. **Session Security:**
   - HTTP-only, secure, `SameSite=Lax` cookies (`returnhome_session`) prevent XSS session theft.
   - Automatic rate limiting is applied via `express-rate-limit` (1000 requests / 15 min for general API, 50 requests / 15 min for authentication).

3. **Audit Logging & Tamper Evidence:**
   - Every case update, sighting submission, review action, and evidence dossier export writes an immutable `AuditLog` entry storing operator ID, timestamp, action, and IP address.

// ReturnHome Persistent Database Store & Demo Investigation Generator
import fs from 'fs';
import path from 'path';

export interface FaceRepresentation {
  id: string;
  caseId: string;
  photoUrl: string;
  embedding: number[]; // 512-dimensional L2-normalized vector
  model: string;
  quality?: {
    blur_score: number;
    lighting_score: number;
    pose_angle: number;
    overall_quality: number;
  };
  createdAt: string;
}

export interface SeedData {
  users: any[];
  cases: any[];
  faceRepresentations: FaceRepresentation[];
  cameras: any[];
  matches: any[];
  timeline: any[];
  auditLogs: any[];
  reports: any[];
}

const DB_PATH = path.resolve(__dirname, '../../data/returnhome_db.json');

// Helper to load seed embeddings if available
let seedEmbeddings: { aarav: number[]; priya: number[]; rohan: number[] } = {
  aarav: Array(512).fill(0).map((_, i) => Math.sin(i * 0.1) / Math.sqrt(512)),
  priya: Array(512).fill(0).map((_, i) => Math.cos(i * 0.1) / Math.sqrt(512)),
  rohan: Array(512).fill(0).map((_, i) => Math.sin(i * 0.2 + 0.5) / Math.sqrt(512))
};

try {
  const seedEmbPath = path.resolve(__dirname, '../../data/seed_embeddings.json');
  if (fs.existsSync(seedEmbPath)) {
    const raw = fs.readFileSync(seedEmbPath, 'utf-8');
    seedEmbeddings = JSON.parse(raw);
  }
} catch (e) {
  // Use fallback generated unit vectors
}

export const initialMemoryStore: SeedData = {
  users: [
    {
      id: 'usr-admin-1',
      name: 'Inspector Vikram Singh',
      email: 'vikram.singh@ReturnHome.gov.in',
      role: 'Admin',
      organization: 'Special Missing Persons Unit, Delhi Police',
      status: 'Active',
      createdAt: '2026-01-15T09:00:00.000Z'
    },
    {
      id: 'usr-investigator-1',
      name: 'Officer Ananya Sen',
      email: 'ananya.sen@ReturnHome.gov.in',
      role: 'Investigator',
      organization: 'Crime Branch Investigation Division',
      status: 'Active',
      createdAt: '2026-02-01T10:30:00.000Z'
    },
    {
      id: 'usr-analyst-1',
      name: 'Dr. Rajesh Rao',
      email: 'rajesh.rao@ReturnHome.gov.in',
      role: 'Analyst',
      organization: 'Forensic Video & AI Analysis Lab',
      status: 'Active',
      createdAt: '2026-03-10T14:15:00.000Z'
    },
    {
      id: 'usr-viewer-1',
      name: 'Sunita Sharma (NGO Liaison)',
      email: 'sunita.sharma@childrescue.org',
      role: 'Viewer',
      organization: 'Child Rescue Alliance NGO',
      status: 'Active',
      createdAt: '2026-04-05T11:00:00.000Z'
    }
  ],
  cases: [
    {
      caseId: 'MP-2026-0001',
      name: 'Aarav Sharma',
      age: 12,
      gender: 'Male',
      height: '4 ft 7 in',
      weight: '38 kg',
      hairColor: 'Black short hair',
      eyeColor: 'Dark Brown',
      distinguishingFeatures: 'Small scar above left eyebrow, wearing silver bracelet',
      lastSeenDate: '2026-09-05',
      lastSeenTime: '14:30',
      lastSeenLocation: 'New Delhi Railway Station - Platform 4',
      latitude: 28.6431,
      longitude: 77.2197,
      description: 'Aarav went missing while waiting at the station concourse. He was traveling with his family.',
      clothingDescription: 'Red hooded jacket, dark blue denim jeans, white canvas shoes',
      status: 'Potential Match',
      priority: 'Critical',
      photos: [
        'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=600&q=80'
      ],
      contactAuthority: 'New Delhi Railway Police Station',
      contactNumber: '+91-11-23340001',
      createdBy: 'Officer Ananya Sen',
      createdAt: '2026-09-05T15:45:00.000Z',
      updatedAt: '2026-09-07T14:35:00.000Z'
    },
    {
      caseId: 'MP-2026-0002',
      name: 'Priya Verma',
      age: 24,
      gender: 'Female',
      height: '5 ft 4 in',
      weight: '52 kg',
      hairColor: 'Long dark brown hair',
      eyeColor: 'Brown',
      distinguishingFeatures: 'Black framed spectacles, tattoo of a leaf on right wrist',
      lastSeenDate: '2026-09-06',
      lastSeenTime: '19:15',
      lastSeenLocation: 'Kashmere Gate ISBT Bus Terminal',
      latitude: 28.6675,
      longitude: 77.2291,
      description: 'Priya boarded an inter-state bus from Terminal 2. Phone switched off shortly after.',
      clothingDescription: 'Yellow ethnic kurta, black leggings, beige shoulder handbag',
      status: 'Under Investigation',
      priority: 'High',
      photos: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
      ],
      contactAuthority: 'Kashmere Gate Police Headquarters',
      contactNumber: '+91-11-23860002',
      createdBy: 'Inspector Vikram Singh',
      createdAt: '2026-09-06T20:10:00.000Z',
      updatedAt: '2026-09-07T10:20:00.000Z'
    },
    {
      caseId: 'MP-2026-0003',
      name: 'Rohan Gupta',
      age: 72,
      gender: 'Male',
      height: '5 ft 6 in',
      weight: '60 kg',
      hairColor: 'Grey thin hair',
      eyeColor: 'Hazel',
      distinguishingFeatures: 'Suffers from mild dementia, walks with a slight limp',
      lastSeenDate: '2026-09-04',
      lastSeenTime: '08:00',
      lastSeenLocation: 'Lajpat Nagar Central Market',
      latitude: 28.5694,
      longitude: 77.2429,
      description: 'Mr. Gupta left home for his morning walk and did not return.',
      clothingDescription: 'White cotton shirt, grey trousers, black leather sandals',
      status: 'Active',
      priority: 'Medium',
      photos: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
      ],
      contactAuthority: 'Lajpat Nagar Police Station',
      contactNumber: '+91-11-29830003',
      createdBy: 'Officer Ananya Sen',
      createdAt: '2026-09-04T10:00:00.000Z',
      updatedAt: '2026-09-04T10:00:00.000Z'
    }
  ],
  faceRepresentations: [
    {
      id: 'emb-aarav-1',
      caseId: 'MP-2026-0001',
      photoUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
      embedding: seedEmbeddings.aarav,
      model: 'PyTorch-ResNet18-512d',
      quality: { blur_score: 91.2, lighting_score: 87.5, pose_angle: 4.0, overall_quality: 0.92 },
      createdAt: '2026-09-05T15:50:00.000Z'
    },
    {
      id: 'emb-priya-1',
      caseId: 'MP-2026-0002',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      embedding: seedEmbeddings.priya,
      model: 'PyTorch-ResNet18-512d',
      quality: { blur_score: 88.0, lighting_score: 84.0, pose_angle: 6.5, overall_quality: 0.88 },
      createdAt: '2026-09-06T20:15:00.000Z'
    },
    {
      id: 'emb-rohan-1',
      caseId: 'MP-2026-0003',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      embedding: seedEmbeddings.rohan,
      model: 'PyTorch-ResNet18-512d',
      quality: { blur_score: 85.5, lighting_score: 82.0, pose_angle: 7.0, overall_quality: 0.84 },
      createdAt: '2026-09-04T10:05:00.000Z'
    }
  ],
  cameras: [
    {
      cameraId: 'CAM-01',
      name: 'Railway Station Gate 3 Feed',
      location: 'New Delhi Railway Station - Main Entrance Concourse',
      latitude: 28.6431,
      longitude: 77.2197,
      status: 'Online',
      resolution: '4K Ultra HD',
      fps: 30,
      type: 'Fixed Optical'
    },
    {
      cameraId: 'CAM-02',
      name: 'ISBT Concourse North',
      location: 'Kashmere Gate Interstate Terminal 2',
      latitude: 28.6675,
      longitude: 77.2291,
      status: 'Online',
      resolution: '1080p Full HD',
      fps: 30,
      type: 'PTZ Dome'
    },
    {
      cameraId: 'CAM-03',
      name: 'Connaught Place Outer Ring',
      location: 'CP Block B Roundabout Commercial Zone',
      latitude: 28.6328,
      longitude: 77.2195,
      status: 'Online',
      resolution: '1080p Full HD',
      fps: 25,
      type: 'Traffic Surveillance'
    },
    {
      cameraId: 'CAM-04',
      name: 'Live Investigator Station (Webcam Feed)',
      location: 'Command Control Center - Inspection Station',
      latitude: 28.6139,
      longitude: 77.2090,
      status: 'Online',
      resolution: '1080p Full HD',
      fps: 30,
      type: 'Live Browser Ingestion'
    }
  ],
  matches: [
    {
      matchId: 'MATCH-2026-001',
      caseId: 'MP-2026-0001',
      missingPersonName: 'Aarav Sharma',
      missingPersonPhoto: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
      detectedFrameUrl: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=600&q=80',
      cameraId: 'CAM-01',
      cameraName: 'Railway Station Gate 3 Feed',
      location: 'New Delhi Railway Station - Gate 3 Concourse',
      latitude: 28.6431,
      longitude: 77.2197,
      timestamp: '2026-09-07T14:32:10',
      similarityScore: 0.91,
      confidenceTier: 'HIGH',
      trackingId: 'TRACK-00021',
      status: 'Pending Review',
      notes: 'High face similarity detected in camera frame cluster TRACK-00021.',
      createdAt: '2026-09-07T14:32:10.000Z'
    },
    {
      matchId: 'MATCH-2026-002',
      caseId: 'MP-2026-0002',
      missingPersonName: 'Priya Verma',
      missingPersonPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      detectedFrameUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
      cameraId: 'CAM-02',
      cameraName: 'ISBT Concourse North',
      location: 'Kashmere Gate Terminal 2',
      latitude: 28.6675,
      longitude: 77.2291,
      timestamp: '2026-09-07T15:10:45',
      similarityScore: 0.84,
      confidenceTier: 'MEDIUM',
      trackingId: 'TRACK-00045',
      status: 'Pending Review',
      notes: 'Subject spotted near ticketing queue.',
      createdAt: '2026-09-07T15:10:45.000Z'
    },
    {
      matchId: 'MATCH-2026-003',
      caseId: 'MP-2026-0001',
      missingPersonName: 'Aarav Sharma',
      missingPersonPhoto: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
      detectedFrameUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=600&q=80',
      cameraId: 'CAM-03',
      cameraName: 'Connaught Place Outer Ring',
      location: 'CP Block B Roundabout',
      latitude: 28.6328,
      longitude: 77.2195,
      timestamp: '2026-09-07T16:05:00',
      similarityScore: 0.87,
      confidenceTier: 'HIGH',
      trackingId: 'TRACK-00088',
      status: 'Accepted Lead',
      reviewedBy: 'Inspector Vikram Singh',
      reviewedAt: '2026-09-07T16:20:00',
      notes: 'Investigator confirmed profile matches clothing description.',
      createdAt: '2026-09-07T16:05:00.000Z'
    }
  ],
  timeline: [
    {
      id: 'evt-1',
      caseId: 'MP-2026-0001',
      timestamp: '2026-09-05T15:45:00.000Z',
      user: 'Officer Ananya Sen',
      action: 'Case Registered',
      description: 'Missing person case MP-2026-0001 created for Aarav Sharma.'
    },
    {
      id: 'evt-2',
      caseId: 'MP-2026-0001',
      timestamp: '2026-09-05T16:00:00.000Z',
      user: 'Officer Ananya Sen',
      action: 'Reference Photos Uploaded',
      description: 'Uploaded reference face photos and extracted 512-dim PyTorch embedding vectors.'
    },
    {
      id: 'evt-3',
      caseId: 'MP-2026-0001',
      timestamp: '2026-09-07T14:00:00.000Z',
      user: 'Dr. Rajesh Rao',
      action: 'CCTV Evidence Uploaded',
      description: 'Ingested CCTV video footage from CAM-01 (Railway Station).'
    },
    {
      id: 'evt-4',
      caseId: 'MP-2026-0001',
      timestamp: '2026-09-07T14:32:00.000Z',
      user: 'ReturnHome AI Service',
      action: 'AI Analysis Completed',
      description: 'Extracted frames and detected faces via YuNet. Generated candidate matches.'
    },
    {
      id: 'evt-5',
      caseId: 'MP-2026-0001',
      timestamp: '2026-09-07T14:32:10.000Z',
      user: 'ReturnHome AI Engine',
      action: 'Potential Match Detected',
      description: 'Candidate Match MATCH-2026-001 flagged with 91% similarity score on CAM-01.'
    },
    {
      id: 'evt-6',
      caseId: 'MP-2026-0001',
      timestamp: '2026-09-07T16:20:00.000Z',
      user: 'Inspector Vikram Singh',
      action: 'Investigator Reviewed Match',
      description: 'Human verification complete. Match MATCH-2026-003 marked as Accepted Lead.'
    }
  ],
  auditLogs: [
    {
      id: 'log-1',
      userId: 'usr-admin-1',
      userName: 'Inspector Vikram Singh',
      userRole: 'Admin',
      action: 'USER_LOGIN',
      resource: 'Auth',
      ipAddress: '192.168.1.45',
      details: 'User logged in successfully via JWT.',
      timestamp: '2026-09-07T14:00:00.000Z'
    },
    {
      id: 'log-2',
      userId: 'usr-investigator-1',
      userName: 'Officer Ananya Sen',
      userRole: 'Investigator',
      action: 'CASE_CREATE',
      resource: 'Cases',
      resourceId: 'MP-2026-0001',
      ipAddress: '192.168.1.50',
      details: 'Registered missing person case MP-2026-0001 (Aarav Sharma).',
      timestamp: '2026-09-05T15:45:00.000Z'
    },
    {
      id: 'log-3',
      userId: 'usr-admin-1',
      userName: 'Inspector Vikram Singh',
      userRole: 'Admin',
      action: 'MATCH_VERIFY',
      resource: 'Matches',
      resourceId: 'MATCH-2026-003',
      ipAddress: '192.168.1.45',
      details: 'Human reviewer confirmed candidate match MATCH-2026-003 (Similarity: 87%). Rationale recorded.',
      timestamp: '2026-09-07T16:20:00.000Z'
    }
  ],
  reports: []
};

// -------------------------------------------------------------
// Database Persistence Layer
// -------------------------------------------------------------

function loadDatabase(): SeedData {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      console.log(`[ReturnHome DB] Loaded persisted database from ${DB_PATH} (${parsed.cases?.length || 0} cases, ${parsed.matches?.length || 0} matches).`);
      
      // Ensure all collections exist
      return {
        users: parsed.users || initialMemoryStore.users,
        cases: parsed.cases || initialMemoryStore.cases,
        faceRepresentations: parsed.faceRepresentations || initialMemoryStore.faceRepresentations,
        cameras: parsed.cameras || initialMemoryStore.cameras,
        matches: parsed.matches || initialMemoryStore.matches,
        timeline: parsed.timeline || initialMemoryStore.timeline,
        auditLogs: parsed.auditLogs || initialMemoryStore.auditLogs,
        reports: parsed.reports || initialMemoryStore.reports,
      };
    }
  } catch (err: any) {
    console.warn(`[ReturnHome DB] Could not read disk database: ${err.message}. Initializing seed store.`);
  }

  // Initialize and persist seed store
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(initialMemoryStore, null, 2), 'utf-8');
    console.log(`[ReturnHome DB] Seed database successfully written to ${DB_PATH}`);
  } catch (err: any) {
    console.warn(`[ReturnHome DB] Failed to write initial seed DB: ${err.message}`);
  }

  return JSON.parse(JSON.stringify(initialMemoryStore));
}

export const memoryStore: SeedData = loadDatabase();

export const saveToDisk = (): void => {
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const tempPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(memoryStore, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_PATH);
  } catch (err: any) {
    console.error(`[ReturnHome DB] Persistence error saving to disk:`, err.message);
  }
};

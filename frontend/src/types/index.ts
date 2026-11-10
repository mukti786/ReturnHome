export type UserRole = 'Admin' | 'Investigator' | 'Analyst' | 'Viewer' | 'Citizen' | 'Public';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  phone?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  avatarUrl?: string;
  bio?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface PublicReportItem {
  _id: string;
  referenceId: string;
  status: 'Pending Review' | 'Reviewed';
  createdAt: string;
  missingPerson: {
    fullName: string;
    age?: number;
    dateOfBirth?: string;
    gender?: string;
    photoUrl?: string;
    physicalDescription?: string;
    identifyingMarks?: string;
    clothing?: string;
    additionalInformation?: string;
  };
  lastSeen: {
    date?: string;
    time?: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    circumstances?: string;
  };
  reporter: {
    name: string;
    phone?: string;
    email?: string;
    relationship?: string;
    preferredContact?: string;
  };
}

export type CaseStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Active Investigation'
  | 'Potential Sighting'
  | 'Match Under Verification'
  | 'Located'
  | 'Closed'
  | 'Active'
  | 'Under Investigation'
  | 'Potential Match'
  | 'Found';

export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface MissingPersonCase {
  _id?: string;
  caseId: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Not Specified';
  height: string;
  weight: string;
  hairColor: string;
  eyeColor: string;
  distinguishingFeatures: string;
  lastSeenDate: string;
  lastSeenTime: string;
  lastSeenLocation: string;
  latitude?: number;
  longitude?: number;
  description: string;
  clothingDescription: string;
  status: CaseStatus;
  priority: CasePriority;
  photos: string[];
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAuthority: string;
  contactNumber: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export type MatchStatus = 'Pending Review' | 'Accepted Lead' | 'Rejected' | 'Escalated' | 'Verified';
export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CandidateMatch {
  matchId: string;
  caseId: string;
  missingPersonName: string;
  missingPersonPhoto: string;
  detectedFrameUrl: string;
  cameraId: string;
  cameraName: string;
  location: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  similarityScore: number;
  confidenceTier: ConfidenceTier;
  trackingId: string;
  status: MatchStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface VideoJob {
  _id: string;
  jobId: string;
  caseRef?: string;
  cameraId?: string;
  cameraName?: string;
  cameraLocation?: string;
  originalFilename: string;
  fileSizeBytes: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  framesAnalyzed: number;
  facesDetected: number;
  candidateMatchesFound: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface DetectionEvent {
  _id: string;
  detectionId: string;
  caseRef?: string;
  source: 'live_camera' | 'video_upload' | 'manual_upload';
  cameraId?: string;
  cameraName?: string;
  sourceTimestamp: string;
  processingTimestamp: string;
  frameTimestamp?: string;
  frameOffset?: number;
  evidenceImageUrl?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  detectionConfidence: number;
  matchingConfidence?: number;
  confidenceTier?: ConfidenceTier;
  cameraLocation?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
  missingPersonName?: string;
  missingPersonPhoto?: string;
  trackingId?: string;
  reviewStatus: MatchStatus;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface CameraFeed {
  cameraId: string;
  name: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'Online' | 'Offline' | 'Maintenance';
  cameraType?: string;
  resolution: string;
  fps: number;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  timestamp: string;
  user: string;
  action: string;
  description: string;
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  [key: string]: number;
}

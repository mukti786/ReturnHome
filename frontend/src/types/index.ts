export type UserRole = 'Admin' | 'Investigator' | 'Analyst' | 'Viewer' | 'Public';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  phone?: string;
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt: string;
}

export type CaseStatus = 'Active' | 'Under Investigation' | 'Potential Match' | 'Found' | 'Closed';
export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export interface MissingPersonCase {
  caseId: string; name: string; age: number; gender: 'Male' | 'Female' | 'Other';
  height: string; weight: string; hairColor: string; eyeColor: string; distinguishingFeatures: string;
  lastSeenDate: string; lastSeenTime: string; lastSeenLocation: string; latitude?: number; longitude?: number;
  description: string; clothingDescription: string; status: CaseStatus; priority: CasePriority;
  photos: string[]; contactAuthority: string; contactNumber: string; createdBy: string; createdAt: string; updatedAt: string;
}
export type MatchStatus = 'Pending Review' | 'Accepted Lead' | 'Rejected' | 'Escalated' | 'Verified';
export type ConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';
export interface CandidateMatch {
  matchId: string; caseId: string; missingPersonName: string; missingPersonPhoto: string; detectedFrameUrl: string;
  cameraId: string; cameraName: string; location: string; latitude: number; longitude: number; timestamp: string;
  similarityScore: number; confidenceTier: ConfidenceTier; trackingId: string; status: MatchStatus;
  reviewedBy?: string; reviewedAt?: string; notes?: string; createdAt: string;
}
export interface CameraFeed { cameraId: string; name: string; location: string; latitude: number; longitude: number; status: 'Online' | 'Offline' | 'Maintenance'; resolution: string; fps: number; }
export interface TimelineEvent { id: string; caseId: string; timestamp: string; user: string; action: string; description: string; }
export interface AuditLogItem { id: string; userId: string; userName: string; userRole: string; action: string; resource: string; resourceId?: string; ipAddress: string; details: string; timestamp: string; }
export interface DashboardStats { [key: string]: number; }


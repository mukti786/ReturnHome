import {
  User, MissingPersonCase, CandidateMatch, TimelineEvent,
  AuditLogItem, DashboardStats, PublicReportItem, VideoJob,
  DetectionEvent, CameraFeed, SightingItem, NotificationItem,
  UnifiedEvidenceItem
} from '../types';

const API_BASE_URL = '/api';
const API_TIMEOUT_MS = 25000;

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  const token = typeof window !== 'undefined' ? localStorage.getItem('returnhome_token') : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData) && !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
      credentials: 'include',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The ReturnHome API took too long to respond. Check backend server and network.');
    }
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the ReturnHome API. Ensure backend is running.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  let data: any = null;
  if (contentType.includes('application/json')) {
    try { data = JSON.parse(responseText); } catch { /* Report error below */ }
  }
  if (!response.ok) {
    if (typeof data?.message === 'string' && data.message.trim()) throw new Error(data.message);
    const proxyFailure = response.status === 502 || response.status === 504 || /proxy error|econnrefused|connect etimedout/i.test(responseText);
    if (proxyFailure) {
      throw new Error(`The ReturnHome API could not be reached for ${endpoint} (HTTP ${response.status}).`);
    }
    if (!data && response.status >= 500) throw new Error(`The ReturnHome API returned a non-JSON server error (HTTP ${response.status}) for ${endpoint}.`);
    throw new Error(`The ReturnHome API returned HTTP ${response.status} for ${endpoint}.`);
  }
  if (!data || typeof data !== 'object') {
    throw new Error(`The ReturnHome API returned an unreadable response for ${endpoint}.`);
  }
  return data as T;
}

export const apiService = {
  // Authentication
  async login(email: string, password: string) {
    const res = await fetchAPI<{ success: boolean; user: User; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem('returnhome_token', res.token);
    }
    return res;
  },

  async devLogin(role: string = 'Investigator') {
    const res = await fetchAPI<{ success: boolean; user: User; token?: string }>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (res.token) {
      localStorage.setItem('returnhome_token', res.token);
    }
    return res;
  },

  async googleAuth(credential: string, role: string = 'Citizen', organization?: string) {
    const res = await fetchAPI<{ success: boolean; user: User; token?: string; message?: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, role, organization }),
    });
    if (res.token) {
      localStorage.setItem('returnhome_token', res.token);
    }
    return res;
  },

  async register(userData: { name: string; email: string; password: string; organization?: string; phone?: string }) {
    return fetchAPI<{ success: boolean; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async registerCitizen(userData: { name: string; email: string; password: string; phone?: string }) {
    const res = await fetchAPI<{ success: boolean; user: User; token?: string; message: string }>('/auth/register-citizen', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.token) {
      localStorage.setItem('returnhome_token', res.token);
    }
    return res;
  },

  async getMe() {
    return fetchAPI<{ success: boolean; user: User }>('/auth/me');
  },

  async logout() {
    try {
      return await fetchAPI<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('returnhome_token');
    }
  },

  async requestPasswordReset(email: string) {
    return fetchAPI<{ success: boolean; message: string }>('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // User Management (Admin)
  async getUsers(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; page: number; limit: number; users: User[] }>(`/auth/users?${query}`);
  },

  async approveUser(userId: string, role?: string) {
    return fetchAPI<{ success: boolean; user: User; message: string }>(`/auth/users/${userId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },

  async rejectUser(userId: string, reason?: string) {
    return fetchAPI<{ success: boolean; message: string }>(`/auth/users/${userId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  async deactivateUser(userId: string) {
    return fetchAPI<{ success: boolean; message: string }>(`/auth/users/${userId}/deactivate`, {
      method: 'PUT'
    });
  },

  // Public Report Intake
  async createPublicReport(formData: FormData) {
    return fetchAPI<{ success: boolean; report: { referenceId: string; status: string }; message: string }>('/public-reports', {
      method: 'POST',
      body: formData
    });
  },

  async getPublicReports() {
    return fetchAPI<{ success: boolean; total: number; reports: PublicReportItem[] }>('/public-reports');
  },

  // Case Management
  async getCases(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; cases: MissingPersonCase[] }>(`/cases?${query}`);
  },

  async getMyCases(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; cases: MissingPersonCase[] }>(`/cases/my?${query}`);
  },

  async getCaseById(id: string) {
    return fetchAPI<{ success: boolean; case: MissingPersonCase; matches?: CandidateMatch[]; detections?: DetectionEvent[]; timeline?: TimelineEvent[]; activityLog?: any[] }>(`/cases/${id}`);
  },

  async createCase(caseData: Partial<MissingPersonCase>) {
    return fetchAPI<{ success: boolean; case: MissingPersonCase; message: string }>('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData)
    });
  },

  async updateCase(id: string, updates: Partial<MissingPersonCase>) {
    return fetchAPI<{ success: boolean; case: MissingPersonCase; message: string }>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async checkDuplicateCase(data: { name: string; age?: number; gender?: string; lastSeenLocation?: string }) {
    return fetchAPI<{ success: boolean; hasPotentialDuplicates: boolean; count: number; potentialDuplicates: Partial<MissingPersonCase>[] }>('/cases/check-duplicate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async uploadCasePhoto(formData: FormData) {
    return fetchAPI<{ success: boolean; photoUrl: string; quality?: any; confidence?: number; message: string }>('/cases/upload-photo', {
      method: 'POST',
      body: formData
    });
  },

  // Video Investigation & Processing
  async uploadVideo(formData: FormData) {
    return fetchAPI<{ success: boolean; jobId: string; status: string; message: string }>('/videos/upload', {
      method: 'POST',
      body: formData
    });
  },

  async getVideoJobs(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; jobs: VideoJob[] }>(`/videos?${query}`);
  },

  async getVideoJobById(id: string) {
    return fetchAPI<{ success: boolean; job: VideoJob; detections: DetectionEvent[] }>(`/videos/${id}`);
  },

  // Live Camera Detection & Ingestion
  async processLiveFrame(formData: FormData) {
    return fetchAPI<{
      success: boolean;
      facesDetected: number;
      matchesFound: number;
      candidateMatches: any[];
      disclaimer: string;
    }>('/detections/live-frame', {
      method: 'POST',
      body: formData
    });
  },

  // Camera Management
  async getCameras() {
    return fetchAPI<{ success: boolean; total: number; cameras: CameraFeed[] }>('/cameras');
  },

  async createCamera(cameraData: Partial<CameraFeed>) {
    return fetchAPI<{ success: boolean; camera: CameraFeed }>('/cameras', {
      method: 'POST',
      body: JSON.stringify(cameraData)
    });
  },

  async updateCamera(id: string, cameraData: Partial<CameraFeed>) {
    return fetchAPI<{ success: boolean; camera: CameraFeed }>(`/cameras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cameraData)
    });
  },

  // Candidate Matches & Detections Review
  async getMatches(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; matches: CandidateMatch[] }>(`/matches?${query}`);
  },

  async reviewMatch(matchId: string, status: string, notes: string) {
    return fetchAPI<{ success: boolean; match: CandidateMatch; message: string }>(`/matches/${matchId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  },

  async getDetections(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; detections: DetectionEvent[] }>(`/detections?${query}`);
  },

  async reviewDetection(detectionId: string, reviewStatus: string, notes: string) {
    return fetchAPI<{ success: boolean; detection: DetectionEvent; message: string }>(`/detections/${detectionId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ reviewStatus, notes })
    });
  },

  // Dashboard & Audit
  async getDashboardStats() {
    return fetchAPI<{
      success: boolean;
      stats: DashboardStats;
      recentCases: MissingPersonCase[];
      recentMatches: CandidateMatch[];
      recentTimeline: TimelineEvent[];
      charts: any;
    }>('/dashboard/stats');
  },

  async getAuditLogs(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; logs: AuditLogItem[] }>(`/audit?${query}`);
  },

  // Sightings Workflow
  async getSightings(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; page: number; limit: number; sightings: SightingItem[] }>(`/sightings?${query}`);
  },

  async getSightingById(id: string) {
    return fetchAPI<{ success: boolean; sighting: SightingItem }>(`/sightings/${id}`);
  },

  async createSighting(data: Partial<SightingItem> & { photoBase64?: string }) {
    return fetchAPI<{ success: boolean; sighting: SightingItem; message: string }>('/sightings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async reviewSighting(id: string, status: 'Verified' | 'Rejected', reviewNotes: string) {
    return fetchAPI<{ success: boolean; sighting: SightingItem; message: string }>(`/sightings/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, reviewNotes })
    });
  },

  // Notifications System
  async getNotifications(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; unreadCount: number; page: number; limit: number; notifications: NotificationItem[] }>(`/notifications?${query}`);
  },

  async getUnreadNotificationCount() {
    return fetchAPI<{ success: boolean; count: number }>('/notifications/unread-count');
  },

  async markNotificationRead(id: string) {
    return fetchAPI<{ success: boolean; notification: NotificationItem }>(`/notifications/${id}/read`, {
      method: 'PUT'
    });
  },

  async markAllNotificationsRead() {
    return fetchAPI<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT'
    });
  },

  // Centralized Evidence Center
  async getEvidence(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; page: number; limit: number; evidence: UnifiedEvidenceItem[] }>(`/evidence?${query}`);
  },

  async getEvidenceById(id: string) {
    return fetchAPI<{ success: boolean; evidence: any }>(`/evidence/${id}`);
  },

  async exportEvidenceDossier(id: string) {
    return fetchAPI<{ success: boolean; dossier: any }>(`/evidence/${id}/export`, {
      method: 'POST'
    });
  }
};

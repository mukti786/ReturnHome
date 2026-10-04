import { User, MissingPersonCase, CandidateMatch, CameraFeed, TimelineEvent, AuditLogItem, DashboardStats } from '../types';

const API_BASE_URL = '/api';

// Helper for HTTP requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('khojsetu_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

export const apiService = {
  // Auth
  async login(email: string, password: string) {
    try {
      return await fetchAPI<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch {
      // Demo fallback login
      const demoUser: User = {
        id: 'usr-admin-1',
        name: email.split('@')[0] || 'Investigator Officer',
        email,
        role: email.includes('admin') ? 'Admin' : 'Investigator',
        organization: 'Special Missing Unit',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      return { success: true, token: 'demo-jwt-token-2026', user: demoUser };
    }
  },

  async register(userData: any) {
    try {
      return await fetchAPI<{ success: boolean; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch {
      const demoUser: User = {
        id: `usr-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'Investigator',
        organization: userData.organization || 'ReturnHome Investigation Unit',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      return { success: true, token: 'demo-jwt-token-2026', user: demoUser };
    }
  },

  // Cases
  async getCases(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return await fetchAPI<{ success: boolean; total: number; cases: MissingPersonCase[] }>(`/cases?${query}`);
  },

  async getCaseById(id: string) {
    return await fetchAPI<{ success: boolean; case: MissingPersonCase; matches: CandidateMatch[]; timeline: TimelineEvent[] }>(`/cases/${id}`);
  },

  async createCase(caseData: Partial<MissingPersonCase>) {
    return await fetchAPI<{ success: boolean; case: MissingPersonCase; message: string }>('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  },

  async updateCase(id: string, updates: Partial<MissingPersonCase>) {
    return await fetchAPI<{ success: boolean; case: MissingPersonCase; message: string }>(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Matches
  async getMatches(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return await fetchAPI<{ success: boolean; total: number; matches: CandidateMatch[] }>(`/matches?${query}`);
  },

  async reviewMatch(matchId: string, status: string, notes: string) {
    return await fetchAPI<{ success: boolean; match: CandidateMatch; message: string }>(`/matches/${matchId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Video Analysis
  async analyzeVideo(caseId: string, cameraId: string, videoName: string) {
    return await fetchAPI<{
      success: boolean;
      framesAnalyzed: number;
      facesDetected: number;
      tracksCreated: number;
      potentialMatches: CandidateMatch[];
    }>('/videos/analyze', {
      method: 'POST',
      body: JSON.stringify({ caseId, cameraId, videoName }),
    });
  },

  // Dashboard Stats
  async getDashboardStats() {
    return await fetchAPI<{
      success: boolean;
      stats: DashboardStats;
      recentCases: MissingPersonCase[];
      recentMatches: CandidateMatch[];
      recentTimeline: TimelineEvent[];
      charts: any;
    }>('/dashboard/stats');
  },

  // Audit Logs
  async getAuditLogs(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return await fetchAPI<{ success: boolean; total: number; logs: AuditLogItem[] }>(`/audit?${query}`);
  }
};

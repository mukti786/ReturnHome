import { User, MissingPersonCase, CandidateMatch, TimelineEvent, AuditLogItem, DashboardStats } from '../types';

const API_BASE_URL = '/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'API request failed.');
  }
  return data;
}

export const apiService = {
  async login(email: string, password: string) {
    return fetchAPI<{ success: boolean; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(userData: { name: string; email: string; password: string; organization: string }) {
    return fetchAPI<{ success: boolean; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getMe() {
    return fetchAPI<{ success: boolean; user: User }>('/auth/me');
  },

  async logout() {
    return fetchAPI<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' });
  },

  async requestPasswordReset(email: string) {
    return fetchAPI<{ success: boolean; message: string }>('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async getCases(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; cases: MissingPersonCase[] }>(`/cases?${query}`);
  },
  async getCaseById(id: string) {
    return fetchAPI<{ success: boolean; case: MissingPersonCase; matches: CandidateMatch[]; timeline: TimelineEvent[] }>(`/cases/${id}`);
  },
  async createCase(caseData: Partial<MissingPersonCase>) {
    return fetchAPI<{ success: boolean; case: MissingPersonCase; message: string }>('/cases', { method: 'POST', body: JSON.stringify(caseData) });
  },
  async updateCase(id: string, updates: Partial<MissingPersonCase>) {
    return fetchAPI<{ success: boolean; case: MissingPersonCase; message: string }>(`/cases/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },
  async getMatches(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; matches: CandidateMatch[] }>(`/matches?${query}`);
  },
  async reviewMatch(matchId: string, status: string, notes: string) {
    return fetchAPI<{ success: boolean; match: CandidateMatch; message: string }>(`/matches/${matchId}/review`, { method: 'PUT', body: JSON.stringify({ status, notes }) });
  },
  async analyzeVideo(caseId: string, cameraId: string, videoName: string) {
    return fetchAPI<{ success: boolean; framesAnalyzed: number; facesDetected: number; tracksCreated: number; potentialMatches: CandidateMatch[] }>('/videos/analyze', {
      method: 'POST',
      body: JSON.stringify({ caseId, cameraId, videoName }),
    });
  },
  async getDashboardStats() {
    return fetchAPI<{ success: boolean; stats: DashboardStats; recentCases: MissingPersonCase[]; recentMatches: CandidateMatch[]; recentTimeline: TimelineEvent[]; charts: any }>('/dashboard/stats');
  },
  async getAuditLogs(params: Record<string, string> = {}) {
    const query = new URLSearchParams(params).toString();
    return fetchAPI<{ success: boolean; total: number; logs: AuditLogItem[] }>(`/audit?${query}`);
  }
};


import { User, MissingPersonCase, CandidateMatch, TimelineEvent, AuditLogItem, DashboardStats, PublicReportItem } from '../types';

const API_BASE_URL = '/api';
const API_TIMEOUT_MS = 8000;

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
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
      throw new Error('The ReturnHome API took too long to respond. Check the backend and database, or start the local sample workspace with “npm run dev:demo”.');
    }
    if (error instanceof TypeError) {
      throw new Error('Cannot reach the ReturnHome API. Start the backend with “npm --prefix backend run dev”, or use “npm run dev:demo” to start the local demonstration.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  const contentType = response.headers.get('content-type') || '';
  const responseText = await response.text();
  let data: any = null;
  if (contentType.includes('application/json')) {
    try { data = JSON.parse(responseText); } catch { /* Report a useful protocol error below. */ }
  }
  if (!response.ok) {
    if (typeof data?.message === 'string' && data.message.trim()) throw new Error(data.message);
    const proxyFailure = response.status === 502 || response.status === 504 || /proxy error|econnrefused|connect etimedout/i.test(responseText);
    if (proxyFailure) {
      throw new Error(`The ReturnHome API could not be reached for ${endpoint} (HTTP ${response.status}). Start the backend with “npm --prefix backend run dev”, or use “npm run dev:demo” to start the local demonstration.`);
    }
    if (!data && response.status >= 500) throw new Error(`The ReturnHome API returned a non-JSON server error (HTTP ${response.status}) for ${endpoint}. Check the backend terminal output and confirm it is running with the expected environment.`);
    throw new Error(`The ReturnHome API returned HTTP ${response.status} for ${endpoint} without a JSON error message. Check that the backend route is available.`);
  }
  if (!data || typeof data !== 'object') {
    throw new Error(`The ReturnHome API returned an unreadable response for ${endpoint}. Check that the backend is running and returning JSON.`);
  }
  return data as T;
}

export const apiService = {
  async login(email: string, password: string) {
    return fetchAPI<{ success: boolean; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async devLogin() {
    return fetchAPI<{ success: boolean; user: User }>('/auth/dev-login', { method: 'POST' });
  },

  async createPublicReport(formData: FormData) {
    return fetchAPI<{ success: boolean; report: { referenceId: string; status: string }; message: string }>('/public-reports', {
      method: 'POST', body: formData
    });
  },

  async getPublicReports() {
    return fetchAPI<{ success: boolean; total: number; reports: PublicReportItem[] }>('/public-reports');
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


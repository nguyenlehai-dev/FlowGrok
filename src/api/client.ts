import axios from 'axios';
import type {
  CreateProfilePayload,
  ProfileAntidetectSettings,
  ProfileCookieImport,
  ProfileItem,
  ProfileLoginTestResult,
  ProfileRuntimeSettings,
  UpdateProfilePayload,
} from '../modules/profiles/models/profile';
import type { ApiKeyItem } from '../modules/api-keys/models/apiKey';
import type { CreateProxyPayload, ProxyItem } from '../modules/proxies/models/proxy';
import type { CreateJobPayload, JobArtifact, JobItem, WorkerRunOnceResult } from '../modules/jobs/models/job';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

type AuthUser = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
};

type AuthTokenResponse = {
  access_token: string;
};

// Tự động gắn Bearer token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthTokenResponse>('/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  getMe: () => api.get<AuthUser>('/auth/me'),
  createApiKey: () => api.post<ApiKeyItem>('/auth/api-keys'),
  listApiKeys: () => api.get<ApiKeyItem[]>('/auth/api-keys'),
  revokeApiKey: (id: string) => api.delete<ApiKeyItem>(`/auth/api-keys/${id}`),
};

// Profiles
export const profileApi = {
  list: () => api.get<ProfileItem[]>('/profiles/'),
  create: (data: CreateProfilePayload) => api.post<ProfileItem>('/profiles/', data),
  getById: (id: string) => api.get<ProfileItem>(`/profiles/${id}`),
  update: (id: string, data: UpdateProfilePayload) => api.patch<ProfileItem>(`/profiles/${id}`, data),
  getRuntimeSettings: (id: string) => api.get<ProfileRuntimeSettings>(`/profiles/${id}/runtime-settings`),
  saveRuntimeSettings: (id: string, data: Partial<ProfileRuntimeSettings>) => api.put<ProfileRuntimeSettings>(`/profiles/${id}/runtime-settings`, data),
  getAntidetectSettings: (id: string) => api.get<ProfileAntidetectSettings>(`/profiles/${id}/antidetect-settings`),
  saveAntidetectSettings: (id: string, data: Partial<ProfileAntidetectSettings>) => api.put<ProfileAntidetectSettings>(`/profiles/${id}/antidetect-settings`, data),
  testLogin: (id: string) => api.post<ProfileLoginTestResult>(`/profiles/${id}/test-login`),
  listCookieImports: (id: string) => api.get<ProfileCookieImport[]>(`/profiles/${id}/cookie-imports`),
  importCookies: (id: string, file: File, sourceType: 'txt' | 'json' | 'storage_state_json') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);
    return api.post<ProfileCookieImport>(`/profiles/${id}/cookies/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (id: string) => api.delete<ProfileItem>(`/profiles/${id}`),
};

// Proxies
export const proxyApi = {
  list: () => api.get<ProxyItem[]>('/proxies/'),
  create: (data: CreateProxyPayload) => api.post<ProxyItem>('/proxies/', data),
  remove: (id: string) => api.delete<ProxyItem>(`/proxies/${id}`),
};

export const jobsApi = {
  list: (params?: Record<string, string | number | undefined>) => api.get<JobItem[]>('/jobs/', { params }),
  create: (data: CreateJobPayload) => api.post<JobItem>('/jobs/', data),
  getById: (id: string) => api.get<JobItem>(`/jobs/${id}`),
  cancel: (id: string) => api.post<JobItem>(`/jobs/${id}/cancel`),
  listArtifacts: (id: string) => api.get<JobArtifact[]>(`/jobs/${id}/artifacts`),
  runWorkerOnce: (workerId = 'staging-worker-01') => api.post<WorkerRunOnceResult>('/internal/jobs/run-once', { worker_id: workerId }),
};

export default api;

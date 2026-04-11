import axios from 'axios';
import type { AxiosError } from 'axios';
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

const healthApi = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
});

const rawApi = axios.create({
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

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  },
);

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
  create: (data: CreateJobPayload) => {
    if (data.source_image) {
      const formData = new FormData();
      formData.append('profile_id', data.profile_id);
      formData.append('job_type', data.job_type);
      formData.append('prompt', data.prompt ?? '');
      formData.append('priority', String(data.priority ?? 100));
      formData.append('request_payload', JSON.stringify(data.request_payload ?? {}));
      formData.append('source_image', data.source_image);
      return api.post<JobItem>('/jobs/with-source-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    const jsonPayload: Omit<CreateJobPayload, 'source_image'> = {
      profile_id: data.profile_id,
      job_type: data.job_type,
      prompt: data.prompt ?? '',
      request_payload: data.request_payload,
      priority: data.priority,
    };
    return api.post<JobItem>('/jobs/', jsonPayload);
  },
  getById: (id: string) => api.get<JobItem>(`/jobs/${id}`),
  cancel: (id: string) => api.post<JobItem>(`/jobs/${id}/cancel`),
  listArtifacts: (id: string) => api.get<JobArtifact[]>(`/jobs/${id}/artifacts`),
  getArtifactContent: (jobId: string, artifactId: string, responseType: 'blob' | 'text' = 'blob') =>
    api.get<Blob | string>(`/jobs/${jobId}/artifacts/${artifactId}/content`, { responseType }),
  runWorkerOnce: (workerId = 'staging-worker-01') => api.post<WorkerRunOnceResult>('/jobs/run-worker-once', { worker_id: workerId }),
};

export const systemApi = {
  health: () => healthApi.get<{ status: string; service: string; database: { dialect: string; url: string } }>('/health'),
  verifyClientKey: async (apiBaseUrl: string, apiKey: string) => {
    const normalizedBase = apiBaseUrl.startsWith('http')
      ? apiBaseUrl
      : `${window.location.origin}${apiBaseUrl.startsWith('/') ? apiBaseUrl : `/${apiBaseUrl}`}`;
    const response = await rawApi.get<ProfileItem[]>(`${normalizedBase}/client/profiles/`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.data;
  },
};

export default api;

import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  window.location.origin;

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

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
    api.post('/auth/login', { email, password }),
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),
  getMe: () => api.get('/auth/me'),
  createApiKey: () => api.post('/auth/api-keys'),
  listApiKeys: () => api.get('/auth/api-keys'),
  revokeApiKey: (id: string) => api.delete(`/auth/api-keys/${id}`),
};

// Profiles
export const profileApi = {
  list: () => api.get('/profiles/'),
  create: (data: any) => api.post('/profiles/', data),
  remove: (id: string) => api.delete(`/profiles/${id}`),
};

// Proxies
export const proxyApi = {
  list: () => api.get('/proxies/'),
  create: (data: any) => api.post('/proxies/', data),
  remove: (id: string) => api.delete(`/proxies/${id}`),
};

export default api;

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  me: () => api.get('/auth/me'),
};

export const fileApi = {
  upload: (formData) => api.post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: (params) => api.get('/files', { params }),
  get: (fileId) => api.get(`/files/${fileId}`),
  progress: (fileId) => api.get(`/files/${fileId}/progress`),
  remove: (fileId) => api.delete(`/files/${fileId}`),
};



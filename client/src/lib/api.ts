import axios from 'axios';
import { notifyUnauthorized } from './authSession';
import { clearAuthToken, getAuthToken } from './tokenStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) {
      clearAuthToken();
      notifyUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default api;

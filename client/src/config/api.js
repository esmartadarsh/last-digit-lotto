import axios from 'axios';
import { getToken } from './tokenStore';

/**
 * Pre-configured axios instance.
 * - baseURL is set from the env variable once here.
 * - A request interceptor automatically attaches the Bearer token
 *   from localStorage (admin_token) or from tokenStore (Firebase user token).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach auth token on every request
api.interceptors.request.use((config) => {
  // Prefer admin JWT stored in localStorage (set on admin login)
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
    return config;
  }

  // Firebase user token — read from the shared tokenStore (no circular dep)
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;


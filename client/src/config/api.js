import axios from 'axios';

/**
 * Pre-configured axios instance.
 * - baseURL is set from the env variable once here.
 * - A request interceptor automatically attaches the Bearer token
 *   from localStorage (admin_token) or from the Zustand store,
 *   so no file needs to pass Authorization headers manually.
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

  // Fall back to Zustand store token (Firebase user token)
  // We import the store lazily to avoid circular-dependency issues
  try {
    const { default: useAuthStore } = require('../store/useAuthStore');
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // store not yet initialized — proceed without token
  }

  return config;
});

export default api;

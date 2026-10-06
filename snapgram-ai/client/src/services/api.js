import axios from 'axios';

// Base URL is read exclusively from the VITE_API_URL environment variable so
// it works correctly in every deployment environment (dev, staging, production).
const getBaseUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5001';


const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
});

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
};

// Add interceptor to inject auth token and CSRF token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const csrfToken = getCookie('csrf-token');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add interceptor to handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only redirect to login if user is currently inside protected routes (/app) and not already on auth pages
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

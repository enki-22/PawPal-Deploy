import axios from 'axios';

//const API_BASE_URL = 'http://localhost:8000';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Use Bearer format for JWT tokens (backend supports both Bearer and Token formats)
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: (credentials) => api.post('/api/users/login/', credentials),
  register: (userData) => api.post('/api/users/register/', userData),
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/api/users/logout/');
  },
  getProfile: () => api.get('/api/users/profile/'),
  // New OTP-based auth endpoints (spec)
  registerWithOtp: (userData) => api.post('/api/auth/register', userData),
  sendOtp: (payload) => api.post('/api/auth/send-otp', payload),
  verifyOtp: (payload) => api.post('/api/auth/verify-otp', payload),
  requestPasswordReset: (payload) => api.post('/api/auth/request-password-reset', payload),
  resetPassword: (payload) => api.post('/api/auth/reset-password', payload),
};

// Chat services
export const chatService = {
  sendMessage: (message) => api.post('/api/chatbot/chat/', { message }),
};

// Diagnosis SOAP endpoints
export const diagnosisService = {
  generate: (payload) => api.post('/api/chatbot/diagnosis/generate', payload),
  getReport: (caseId) => api.get(`/api/chatbot/diagnosis/soap/${caseId}`),
  getByPet: (petId) => api.get(`/api/chatbot/diagnosis/${petId}`),
  getFlaggedByPet: (petId) => api.get(`/api/chatbot/diagnosis/flagged/${petId}`),
};

// Admin auth services
export const adminAuthService = {
  login: (credentials) => api.post('/api/admin/login', credentials),
  logout: () => api.post('/api/admin/logout'),
  verifyToken: (token) => api.post('/api/admin/verify-token', { token }),
  changePassword: (payload) => api.post('/api/admin/change-password', payload),
  requestPasswordReset: (payload) => api.post('/api/admin/request-password-reset', payload),
  verifyOtp: (payload) => api.post('/api/admin/verify-reset-otp', payload),
  resetPassword: (payload) => api.post('/api/admin/reset-password-confirm', payload),
};

export default api;
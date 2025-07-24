import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

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
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  login: (credentials) => api.post('/users/login/', credentials),
  register: (userData) => api.post('/users/register/', userData),
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/users/logout/');
  },
  getProfile: () => api.get('/users/profile/'),
};

// Chat services
export const chatService = {
  sendMessage: (message) => api.post('/chatbot/chat/', { message }),
};

export default api;
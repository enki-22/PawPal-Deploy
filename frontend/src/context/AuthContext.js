import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Configure axios defaults
axios.defaults.timeout = 10000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  // Debugging logs
  console.log('=== AUTH CONTEXT DEBUG ===');
  console.log('Current token state:', token);
  console.log('Current user state:', user);
  console.log('localStorage token:', localStorage.getItem('token'));
  console.log('Is authenticated:', !!token);

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE_URL}/users/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setUser(response.data);
        })
        .catch((error) => {
          console.log('Backend connection error or invalid token:', error.message);
          console.log('Error response:', error.response?.data);
          // Don't clear token on 401 - might be a temporary issue
          // Only clear if it's a network error or 403 (forbidden)
          if (error.response?.status === 403 || error.code === 'ERR_NETWORK') {
            localStorage.removeItem('token');
            setToken(null);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials) => {
  try {
    // Backend expects email and password at /api/auth/login
    const loginData = {
      email: credentials.email || credentials.username, // Accept both email and username
      password: credentials.password
    };
    
    console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
    console.log('Login credentials:', loginData); // Debug log
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, loginData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Login response:', response.data); // Debug log
    
    // Handle different response structures
    const token = response.data.token;
    const userData = response.data.user || response.data;
    
    if (token) {
      localStorage.setItem('token', token);
      setToken(token);
      setUser(userData);
      // Force a storage event to notify other tabs/components
      window.dispatchEvent(new Event('storage'));
      // Optionally, force a re-render by updating a dummy state (not needed if setUser works)
      return { success: true };
    } else {
      console.error('No token in response:', response.data);
      return { 
        success: false, 
        error: 'Invalid response from server - no token received' 
      };
    }
  } catch (error) {
    console.log('Login error:', error);
    console.log('Error response:', error.response?.data);
    console.log('Error response full:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error status:', error.response?.status);
    
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return { 
        success: false, 
        error: 'Cannot connect to server. Please check:\n1. Django backend is running (python manage.py runserver)\n2. CORS is properly configured\n3. Backend is accessible on port 8000' 
      };
    }
    
    if (error.code === 'ECONNREFUSED') {
      return { 
        success: false, 
        error: 'Connection refused. Make sure Django backend is running on port 8000.' 
      };
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const errorData = error.response?.data || {};
      const errorCode = errorData.code || 'UNKNOWN';
      let errorMsg = errorData.error || 'Invalid email or password';
      
      // Handle different error formats
      if (typeof errorMsg === 'object') {
        errorMsg = JSON.stringify(errorMsg);
      }
      
      console.log(`[LOGIN] 401 Error - Code: ${errorCode}, Message: ${errorMsg}`);
      
      return { 
        success: false, 
        error: errorMsg,
        code: errorCode
      };
    }
    
    // Handle 403 Forbidden (account inactive)
    if (error.response?.status === 403) {
      const errorData = error.response?.data || {};
      const errorMsg = errorData.error || 'Account is not active. Please verify your email.';
      console.log(`[LOGIN] 403 Error - Account inactive: ${errorMsg}`);
      
      return { 
        success: false, 
        error: typeof errorMsg === 'string' ? errorMsg : 'Account is not active. Please verify your email.',
        code: 'ACCOUNT_INACTIVE'
      };
    }
    
    // Handle 400 Bad Request (validation errors)
    if (error.response?.status === 400) {
      const errorData = error.response?.data || {};
      const errorMsg = errorData.error || 'Invalid request data';
      console.log(`[LOGIN] 400 Error - Validation: ${JSON.stringify(errorMsg)}`);
      
      return { 
        success: false, 
        error: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)
      };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.error || error.response?.data?.detail || 'Login failed' 
    };
  }
};

  const register = async (userData) => {
    try {
      console.log('Attempting registration to:', `${API_BASE_URL}/users/register/`);
      console.log('Registration data being sent:', userData);
      
      const response = await axios.post(`${API_BASE_URL}/users/register/`, userData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      
      console.log('Registration successful:', response.data);
      
      // Return success with message for redirection
      return { 
        success: true, 
        data: response.data,
        message: 'Registration successful! Please log in with your new account.'
      };
    } catch (error) {
      console.log('Registration error:', error);
      console.log('Error response:', error.response?.data);
      console.log('Error status:', error.response?.status);
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return { 
          success: false, 
          error: 'Cannot connect to server. Please check:\n1. Django backend is running\n2. CORS is properly configured' 
        };
      }
      
      // Handle validation errors from Django
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        let errorMessage = 'Registration failed. Please check the following:\n';
        
        if (typeof errorData === 'object') {
          Object.keys(errorData).forEach(field => {
            const fieldErrors = Array.isArray(errorData[field]) ? errorData[field] : [errorData[field]];
            errorMessage += `${field}: ${fieldErrors.join(', ')}\n`;
          });
        } else {
          errorMessage += errorData;
        }
        
        return { 
          success: false, 
          error: errorMessage 
        };
      }
      
      // Handle 500 errors (database issues) with more specific message
      if (error.response?.status === 500) {
        return { 
          success: false, 
          error: 'Database error occurred. This indicates missing database columns.\n\nPlease run these Django commands:\n1. python manage.py makemigrations users\n2. python manage.py migrate\n\nIf the issue persists, contact the administrator.' 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
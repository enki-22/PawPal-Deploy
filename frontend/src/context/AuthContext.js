import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = 'http://localhost:8000';

// Configure axios defaults
axios.defaults.timeout = 10000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.get(`${API_BASE_URL}/users/profile/`, {
        headers: { Authorization: `Token ${token}` }
      })
        .then(response => {
          setUser(response.data);
        })
        .catch((error) => {
          console.log('Backend connection error or invalid token:', error.message);
          localStorage.removeItem('token');
          setToken(null);
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
      console.log('Attempting login to:', `${API_BASE_URL}/users/login/`);
      const response = await axios.post(`${API_BASE_URL}/users/login/`, credentials, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const { token: newToken, ...userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.log('Login error:', error);
      
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
        }
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
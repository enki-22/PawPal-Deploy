import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  // Check token validity on app start
  useEffect(() => {
    if (token) {
      axios.post(`${API_BASE_URL}/admin/verify-token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          setAdmin(response.data.data);
        })
        .catch((error) => {
          console.log('Admin token invalid:', error.message);
          localStorage.removeItem('admin_token');
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  const adminLogin = async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, credentials);
      
      if (response.data.success && response.data.data.token) {
        const { token, admin_info } = response.data.data;
        
        localStorage.setItem('admin_token', token);
        setToken(token);
        setAdmin(admin_info);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.data.error || 'Invalid response from server' 
        };
      }
    } catch (error) {
      console.error('Admin login error:', error);
      
      if (error.response?.status === 401) {
        return { 
          success: false, 
          error: 'Invalid email or password' 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      };
    }
  };

  const adminLogout = async () => {
    try {
      if (token) {
        await axios.post(`${API_BASE_URL}/admin/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_token');
      setToken(null);
      setAdmin(null);
    }
  };

  const value = {
    admin,
    token,
    adminLogin,
    adminLogout,
    loading,
    isAdminAuthenticated: !!token,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
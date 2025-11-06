
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Create a single axios instance for admin API
const adminAxios = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include token from localStorage
adminAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token expiration
adminAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Prevent infinite logout loop: do NOT auto-logout if the request was to /admin/logout
    const isLogoutRequest =
      error.config &&
      error.config.url &&
      error.config.url.includes('/admin/logout');
    const isVerifyTokenRequest =
      error.config &&
      error.config.url &&
      error.config.url.includes('/admin/verify-token');

    if (error.response?.status === 401 && isVerifyTokenRequest) {
      console.log('Admin token expired or invalid (verify-token), logging out...');
      localStorage.removeItem('admin_token');
      // No direct call to adminLogout here to avoid context issues
    }
    // For /admin/logout 401, just ignore and let the promise reject
    // For other endpoints, just reject and let the component handle the error
    return Promise.reject(error);
  }
);

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

  // adminAxios is now stable and imported from top-level

  // Check token validity on app start
  useEffect(() => {
    if (token) {
      console.log('🔎 Verifying admin token:', token);
      adminAxios.post('/admin/verify-token')
        .then(response => {
          console.log('✅ Token verification response:', response);
          console.log('✅ Token verification response data:', response.data);
          // Accept both {success, data} and {success, valid, admin_info}
          if (response.data.success && (response.data.data || response.data.admin_info)) {
            const adminData = response.data.data || response.data.admin_info;
            setAdmin(adminData);
          } else {
            console.warn('⚠️ Invalid token verification response:', response.data);
            throw new Error('Invalid token response');
          }
        })
        .catch((error) => {
          console.error('❌ Admin token verification error:', error);
          if (error.response) {
            console.error('❌ Error response data:', error.response.data);
            console.error('❌ Error response status:', error.response.status);
          }
          localStorage.removeItem('admin_token');
          setToken(null);
          setAdmin(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token, adminAxios]);

  const adminLogin = async (credentials) => {
    try {
      console.log('🔄 Admin login attempt:', credentials);
      const response = await axios.post(`${API_BASE_URL}/admin/login`, credentials);
      console.log('✅ Admin login raw response:', response);
      console.log('✅ Admin login response data:', response.data);
      if (response.data.success && response.data.data.token) {
        const { token, admin_info } = response.data.data;
        console.log('📝 Storing token in localStorage:', token);
        localStorage.setItem('admin_token', token);
        setToken(token);
        setAdmin(admin_info);
        console.log('✅ Admin login successful, role:', admin_info.role, 'admin_info:', admin_info);
        return { success: true };
      } else {
        console.warn('⚠️ Login failed, response:', response.data);
        return { 
          success: false, 
          error: response.data.error || 'Invalid response from server' 
        };
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      if (error.response) {
        console.error('❌ Error response data:', error.response.data);
        console.error('❌ Error response status:', error.response.status);
      }
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
        await adminAxios.post('/admin/logout');
      }
    } catch (error) {
      // Only log errors that are NOT 401 Unauthorized
      if (error.response?.status !== 401) {
        console.error('Logout error:', error);
      }
      // If 401, just ignore (token is already invalid/expired)
    } finally {
      localStorage.removeItem('admin_token');
      setToken(null);
      setAdmin(null);
    }
  };

  // FIXED: Provide the adminAxios instance to components
  const value = {
    admin,
    token,
    adminLogin,
    adminLogout,
    loading,
    isAdminAuthenticated: !!token && !!admin,
    adminAxios, // ADDED: Provide configured axios instance
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
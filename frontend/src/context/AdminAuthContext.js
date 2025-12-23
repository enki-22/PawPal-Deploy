
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const API_BASE_URL = `${API_ROOT}/api`;
  
// Create a single axios instance for admin API
const adminAxios = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include token from localStorage
adminAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    console.log('🔐 Admin API Request:', config.url);
    console.log('🔐 Admin token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.warn('⚠️ No admin token found in localStorage for request to:', config.url);
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
    // const isLogoutRequest =
    //   error.config &&
    //   error.config.url &&
    //   error.config.url.includes('/admin/logout');
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

  // Debug admin auth state
  console.log('=== ADMIN AUTH CONTEXT DEBUG ===');
  console.log('Admin token state:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  console.log('Admin state:', admin);
  console.log('localStorage admin_token:', localStorage.getItem('admin_token') ? `${localStorage.getItem('admin_token').substring(0, 20)}...` : 'NO TOKEN');
  console.log('Is admin authenticated:', !!token && !!admin);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const adminLogin = async (credentials) => {
    try {
      console.log('🔄 Admin login attempt:', credentials.email);
      // Clear any existing user token to avoid conflicts
      localStorage.removeItem('token');
      console.log('🧹 Cleared user token from localStorage');
      
      const response = await axios.post(`${API_BASE_URL}/admin/login`, credentials);
      console.log('✅ Admin login raw response:', response);
      console.log('✅ Admin login response data:', response.data);
      if (response.data.success && response.data.data.token) {
        const { token, admin_info } = response.data.data;
        console.log('📝 Storing admin token in localStorage:', token ? `${token.substring(0, 30)}...` : 'NO TOKEN');
        localStorage.setItem('admin_token', token);
        setToken(token);
        setAdmin(admin_info);
        console.log('✅ Admin login successful, role:', admin_info.role);
        console.log('✅ Admin info:', admin_info);
        console.log('✅ Verified admin_token in localStorage:', localStorage.getItem('admin_token') ? 'PRESENT' : 'MISSING');
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

    // Helper to update admin state directly (e.g., after profile update)
    const updateAdmin = (newAdminData) => {
      setAdmin(prev => ({ ...prev, ...newAdminData }));
    };

    // Provide the adminAxios instance and update helper to components
    const value = {
      admin,
      token,
      adminLogin,
      adminLogout,
      updateAdmin, // Exposed helper to update admin state
        loading,
        isAdminAuthenticated: !!token && !!admin,
        // Derived role helpers (make role checks robust across different API shapes/casing)
        isMaster: (() => {
          try {
            if (!admin) return false;
            // Check multiple possible fields that backends might return
            const roleCandidates = [admin.role, admin.role_display, admin.role_name, admin.roleTitle, admin.roles];
            for (const r of roleCandidates) {
              if (!r) continue;
              if (Array.isArray(r)) {
                if (r.map(x => String(x).toUpperCase()).includes('MASTER')) return true;
              } else {
                const s = String(r).toUpperCase();
                if (s.includes('MASTER') || s.includes('MASTER ADMIN') || s.includes('SUPERADMIN')) return true;
              }
            }
            return false;
          } catch (e) {
            return false;
          }
        })(),
        isFrontDesk: (() => {
          try {
            if (!admin) return false;
            const roleCandidates = [admin.role, admin.role_display, admin.role_name, admin.roleTitle, admin.roles];
            for (const r of roleCandidates) {
              if (!r) continue;
              const s = String(r).toUpperCase();
              // Check for "FRONT DESK" or "FRONTDESK"
              if (s.includes('FRONT DESK') || s.includes('FRONTDESK')) return true;
            }
            return false;
          } catch (e) {
            return false;
          }
        })(),
      adminAxios,
    };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
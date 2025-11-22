import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, token } = useAuth();

  // Add debugging logs
  console.log('ProtectedRoute Debug:', {
    isAuthenticated,
    loading,
    user,
    token: token ? `${token.substring(0, 10)}...` : 'null'
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#D8CAED]">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3] mx-auto mb-4"></div>
          <div className="text-lg font-medium" style={{ fontFamily: 'Raleway' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/petowner/login" replace />;
  }

  console.log('Authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;
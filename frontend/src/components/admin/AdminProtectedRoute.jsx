import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminProtectedRoute = ({ children, requiredRole }) => {
  const { isAdminAuthenticated, loading, admin } = useAdminAuth();

    if (loading) {
      return null;
    }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check role-based access (e.g., only MASTER can access /admin/roles)
  if (requiredRole && admin?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: {requiredRole} | Your role: {admin?.role}
          </p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminProtectedRoute;
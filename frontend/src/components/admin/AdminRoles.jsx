import React from 'react';
import AdminLayout from './AdminLayout';

const AdminRoles = () => {
  return (
    <AdminLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Admin Role Management</h2>
        <p className="text-gray-600 mb-4">Manage admin users and their roles (Master Admin only).</p>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 font-medium">🔒 Restricted Access</p>
          <p className="text-red-600 text-sm">Only Master Admin can access this page</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Coming Soon</h3>
          <p className="text-yellow-700">
            This page will include:
          </p>
          <ul className="list-disc list-inside text-yellow-700 mt-2">
            <li>Create new admin accounts</li>
            <li>Assign roles (Master, Veterinarian, Front Desk)</li>
            <li>Manage admin permissions</li>
            <li>View admin activity logs</li>
            <li>Reset admin passwords</li>
            <li>Deactivate admin accounts</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;
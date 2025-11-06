import React from 'react';
import AdminLayout from './AdminLayout';

const AdminProfile = () => {
  return (
    <AdminLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
        <p className="text-gray-600 mb-4">Manage your admin account settings and preferences.</p>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-700">
            This page will include:
          </p>
          <ul className="list-disc list-inside text-gray-700 mt-2">
            <li>Update personal information</li>
            <li>Change password</li>
            <li>Notification preferences</li>
            <li>Two-factor authentication</li>
            <li>Session management</li>
            <li>Account activity log</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
import React from 'react';
import AdminLayout from './AdminLayout';

const AdminAnnouncements = () => {
  return (
    <AdminLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Announcement Management</h2>
        <p className="text-gray-600 mb-4">Create and manage announcements for pet owners.</p>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-indigo-900 mb-2">Coming Soon</h3>
          <p className="text-indigo-700">
            This page will include:
          </p>
          <ul className="list-disc list-inside text-indigo-700 mt-2">
            <li>Create new announcements</li>
            <li>Set announcement priority levels</li>
            <li>Schedule announcement publication</li>
            <li>Target specific user groups</li>
            <li>View announcement analytics</li>
            <li>Manage active/inactive announcements</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
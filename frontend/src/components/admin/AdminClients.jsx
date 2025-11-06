import React from 'react';
import AdminLayout from './AdminLayout';

const AdminClients = () => {
  return (
    <AdminLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Client Management</h2>
        <p className="text-gray-600 mb-4">Manage all registered pet owners and their information.</p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-900 mb-2">Coming Soon</h3>
          <p className="text-green-700">
            This page will include:
          </p>
          <ul className="list-disc list-inside text-green-700 mt-2">
            <li>View all registered clients</li>
            <li>Search and filter clients</li>
            <li>Client profile management</li>
            <li>Account status control (active/inactive)</li>
            <li>Client communication history</li>
            <li>Export client data</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminClients;
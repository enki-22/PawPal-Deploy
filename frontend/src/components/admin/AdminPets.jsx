import React from 'react';
import AdminLayout from './AdminLayout';

const AdminPets = () => {
  return (
    <AdminLayout>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Pet Management</h2>
        <p className="text-gray-600 mb-4">Manage all registered pets and their health records.</p>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-purple-900 mb-2">Coming Soon</h3>
          <p className="text-purple-700">
            This page will include:
          </p>
          <ul className="list-disc list-inside text-purple-700 mt-2">
            <li>View all registered pets</li>
            <li>Pet profile management</li>
            <li>Health records and vaccination tracking</li>
            <li>Pet image management</li>
            <li>Link pets to veterinary visits</li>
            <li>Pet statistics and analytics</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPets;
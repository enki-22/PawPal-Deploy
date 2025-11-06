import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from './AdminLayout';
import axios from 'axios';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const { token } = useAdminAuth();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      // Parallel requests for better performance
      const [stats, recentPets, flaggedCases, charts, faqs, announcements] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/dashboard/stats`, { headers }).catch(() => ({ data: { data: {} } })),
        axios.get(`${API_BASE_URL}/admin/dashboard/recent-pets`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/admin/dashboard/flagged-cases`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/admin/dashboard/charts`, { headers }).catch(() => ({ data: { data: {} } })),
        axios.get(`${API_BASE_URL}/admin/dashboard/faqs`, { headers }).catch(() => ({ data: { data: [] } })),
        axios.get(`${API_BASE_URL}/admin/dashboard/announcements`, { headers }).catch(() => ({ data: { data: [] } }))
      ]);
      
      setDashboardData({
        stats: stats.data.data || {},
        recentPets: recentPets.data.data || [],
        flaggedCases: flaggedCases.data.data || [],
        charts: charts.data.data || {},
        faqs: faqs.data.data || [],
        announcements: announcements.data.data || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set default empty data structure
      setDashboardData({
        stats: { total_users: 0, total_pets: 0, total_reports: 0, total_conversations: 0 },
        recentPets: [],
        flaggedCases: [],
        charts: {},
        faqs: [],
        announcements: []
      });
    } finally {
      setLoading(false);
    }
  }, [token, API_BASE_URL]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-64 rounded-lg"></div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.stats?.total_users || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">🐾</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Pets
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.stats?.total_pets || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Reports
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.stats?.total_reports || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg">💬</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Conversations
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.stats?.total_conversations || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Pets and Flagged Cases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Pets */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Recently Registered Pets
              </h3>
              <div className="space-y-3">
                {dashboardData.recentPets?.length > 0 ? (
                  dashboardData.recentPets.slice(0, 5).map((pet, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        {pet.image ? (
                          <img src={pet.image} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-lg">🐾</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pet.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {pet.animal_type} • {pet.owner_name}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(pet.date_created).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No recent pets found</p>
                )}
              </div>
            </div>
          </div>

          {/* Flagged Cases */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Flagged Cases
              </h3>
              <div className="space-y-3">
                {dashboardData.flaggedCases?.length > 0 ? (
                  dashboardData.flaggedCases.slice(0, 5).map((case_item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                        case_item.flag_level === 'Emergency' ? 'bg-red-100 text-red-800' :
                        case_item.flag_level === 'Urgent' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {case_item.flag_level}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {case_item.pet_name} ({case_item.species})
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          Owner: {case_item.owner_name}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(case_item.date_created).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No flagged cases found</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Announcements */}
        {dashboardData.announcements?.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Active Announcements
              </h3>
              <div className="space-y-4">
                {dashboardData.announcements.map((announcement, index) => (
                  <div key={index} className="border-l-4 border-blue-400 bg-blue-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-800">
                          {announcement.title}
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          {announcement.description}
                        </p>
                        {announcement.valid_until && (
                          <p className="mt-1 text-xs text-blue-600">
                            Valid until: {new Date(announcement.valid_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Welcome Message if no data */}
        {Object.keys(dashboardData.stats || {}).length === 0 && (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to PawPal Admin Dashboard!
            </h3>
            <p className="text-gray-600">
              Dashboard data will appear here once the backend APIs are connected and working.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
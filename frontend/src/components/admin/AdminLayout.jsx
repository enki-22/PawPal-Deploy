import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Reports', href: '/admin/reports', icon: '📋' },
    { name: 'Clients', href: '/admin/clients', icon: '👥' },
    { name: 'Pets', href: '/admin/pets', icon: '🐾' },
    { name: 'Announcements', href: '/admin/announcements', icon: '📢' },
  ];

  // Only show Admin Roles for MASTER admin
  if (admin?.role === 'MASTER') {
    navigation.push({ name: 'Admin Roles', href: '/admin/roles', icon: '👨‍⚕️' });
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await adminLogout();
      navigate('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-purple-600">
          <h1 className="text-xl font-bold text-white">PawPal Admin</h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === item.href
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
        </nav>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {admin?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {admin?.role_display}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-600"
              >
                <span className="text-2xl">☰</span>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                PawPal Admin
              </h1>
              <div></div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-8">
          <div className="bg-white shadow-sm">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigation.find(nav => nav.href === location.pathname)?.name || 'Admin Panel'}
                </h1>
              </div>
            </div>
          </div>
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
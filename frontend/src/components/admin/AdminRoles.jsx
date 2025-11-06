import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import AdminTopNav from './AdminTopNav';
import { ChevronDown, Search, ArrowUpDown, X } from 'lucide-react';

// Create New Admin Modal Component
const CreateAdminModal = ({ isOpen, onClose, onSuccess, adminAxios }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'VET'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await adminAxios.post('/admin/roles', {
        name: formData.name,
        email: formData.email,
        role: formData.role
      });

      if (response.data.success) {
        // Reset form
        setFormData({ name: '', email: '', role: 'VET' });
        onSuccess();
        onClose();
      } else {
        setError(response.data.error || 'Failed to create admin');
      }
    } catch (err) {
      console.error('Error creating admin:', err);
      setError(err.response?.data?.error || 'Failed to create admin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-[600px] max-w-[90vw] shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Raleway, sans-serif'}}>
            Create New Admin
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{fontFamily: 'Inter, sans-serif'}}>
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815fb3] focus:border-transparent"
              style={{fontFamily: 'Inter, sans-serif'}}
            />
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{fontFamily: 'Inter, sans-serif'}}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815fb3] focus:border-transparent"
              style={{fontFamily: 'Inter, sans-serif'}}
            />
          </div>

          {/* Role Field */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2" style={{fontFamily: 'Inter, sans-serif'}}>
              Role
            </label>
            <div className="relative">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815fb3] focus:border-transparent appearance-none bg-white"
                style={{fontFamily: 'Inter, sans-serif'}}
              >
                <option value="VET">Veterinarian</option>
                <option value="DESK">Front Desk</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
              style={{fontFamily: 'Inter, sans-serif'}}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#815fb3] text-white rounded-lg hover:bg-[#6d4d99] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{fontFamily: 'Inter, sans-serif'}}
            >
              {loading ? 'Creating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminRoles() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { adminAxios, admin } = useAdminAuth();

  // Check if current admin is Master Admin
  const isMasterAdmin = admin?.role === 'MASTER' || admin?.role === 'Master Admin';

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: searchTerm,
        role: roleFilter,
        status: statusFilter
      };
      const response = await adminAxios.get('/admin/roles', { params });
      if (response.data.success) {
        setAdmins(response.data.results || []);
      } else {
        setError('Failed to load admin accounts');
      }
    } catch (err) {
      console.error('❌ AdminRoles fetch error:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error response data:', err.response?.data);
      console.error('❌ Error response status:', err.response?.status);
      
      if (err.response?.status === 403) {
        setError('Access denied. Only Master Admin can access this page.');
      } else if (err.response?.status === 401) {
        const errorData = err.response?.data || {};
        const errorMsg = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        const errorCode = errorData.code || 'UNKNOWN';
        console.error(`❌ 401 Error: ${errorMsg} (code: ${errorCode})`);
        console.error('❌ Full error response data:', JSON.stringify(errorData, null, 2));
        if (errorData.debug_info) {
          console.error('❌ Debug info:', errorData.debug_info);
        }
        setError(`Authentication failed: ${errorMsg}. Please login again.`);
      } else {
        setError('Failed to load admin accounts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [adminAxios, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAdmins(admins.map(admin => admin.admin_id || admin.id));
    } else {
      setSelectedAdmins([]);
    }
  };

  const handleSelectAdmin = (adminId, checked) => {
    if (checked) {
      setSelectedAdmins([...selectedAdmins, adminId]);
    } else {
      setSelectedAdmins(selectedAdmins.filter(id => id !== adminId));
    }
  };

  const handleAdminCreated = () => {
    // Refresh the admin list after successful creation
    fetchAdmins();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-xl">Loading admin roles...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] relative">
        <AdminTopNav activePage="Admin Roles" />
        <div className="pt-[100px] flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchAdmins}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] relative">
      <AdminTopNav activePage="Admin Roles" />
      
      {/* Main Content */}
      <div className="pt-[80px]">
        {/* Page Title and Controls */}
        <div className="px-[129px] pt-[28px] pb-0 bg-transparent">
          <div className="flex items-center justify-between w-full mb-2">
            <h1 className="font-['Raleway:Bold',sans-serif] font-bold text-[20px] text-black tracking-[1px]">Admin Roles</h1>
            
            <div className="flex items-center gap-4">
              {/* Add Admin Button - Only visible to Master Admin */}
              {isMasterAdmin && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[rgba(187,159,228,0.8)] h-[31px] px-4 rounded-[5px] font-['Inter:Regular',sans-serif] text-[12px] text-black hover:bg-[rgba(187,159,228,1)] transition-colors"
                >
                  + Add Admin
                </button>
              )}
              
              {/* Search Bar */}
              <div className="relative">
                <div className="w-[465px] h-[31px] border border-[#888888] rounded-[5px] flex items-center px-3">
                  <Search className="w-[18px] h-[18px] text-[#888888] mr-2" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 text-[12px] text-[#888888] bg-transparent outline-none font-['Inter:Regular',sans-serif]"
                  />
                </div>
              </div>
              
              {/* Role Filter */}
              <div className="relative">
                <div className="bg-[#f0e4b3] h-[31px] w-[121px] rounded-[5px] flex items-center justify-between px-3 cursor-pointer hover:bg-[#e5d4a0] transition-colors">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">Role</span>
                  <ChevronDown className="w-[12px] h-[12px] text-black" />
                </div>
              </div>
              
              {/* Status Filter */}
              <div className="relative">
                <div className="bg-[#f0e4b3] h-[31px] w-[122px] rounded-[5px] flex items-center justify-between px-3 cursor-pointer hover:bg-[#e5d4a0] transition-colors">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">Status</span>
                  <ChevronDown className="w-[12px] h-[12px] text-black" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="mx-[100px] bg-[#fffff2] rounded-t-[10px] overflow-hidden mt-[18px]">
          {/* Table Header */}
          <div className="bg-[#fffff2] h-[40px] border-b border-[#888888] flex items-center px-[31px]">
            <div className="flex items-center gap-4 flex-1">
              <input
                type="checkbox"
                checked={selectedAdmins.length === admins.length && admins.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-[12px] h-[12px] border border-[#888888] rounded-[1px]"
              />
              <div className="flex items-center gap-1">
                <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Registered User</span>
                <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
              </div>
            </div>
            <div className="w-[250px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Email</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[200px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Role</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[150px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Account Status</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[200px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Date Account Created</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
          </div>

          {/* Table Rows */}
          {admins.length === 0 ? (
            <div className="bg-[#fffff2] h-[50px] flex items-center justify-center border-b border-[#888888]">
              <span className="text-gray-500 font-['Inter:Regular',sans-serif] text-[12px]">No admin accounts found</span>
            </div>
          ) : (
            admins.map((adminItem) => (
              <div 
                key={adminItem.admin_id || adminItem.id} 
                className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[31px] hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedAdmins.includes(adminItem.admin_id || adminItem.id)}
                    onChange={(e) => handleSelectAdmin(adminItem.admin_id || adminItem.id, e.target.checked)}
                    className="w-[12px] h-[12px] border border-[#888888] rounded-[1px]"
                  />
                  <span className="font-['Inter:Bold',sans-serif] font-bold text-[12px] text-black">
                    {adminItem.name}
                  </span>
                </div>
                <div className="w-[250px]">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{adminItem.email}</span>
                </div>
                <div className="w-[200px]">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                    {adminItem.role_display || adminItem.role}
                  </span>
                </div>
                <div className="w-[150px]">
                  <div className={`inline-flex items-center px-2 py-1 rounded-[5px] ${
                    adminItem.status === 'Active' || adminItem.is_active 
                      ? 'bg-[#c2f0b3]' 
                      : 'bg-[#ffb2a8]'
                  }`}>
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                      {adminItem.status || (adminItem.is_active ? 'Active' : 'Inactive')}
                    </span>
                  </div>
                </div>
                <div className="w-[200px]">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                    {new Date(adminItem.date_created || adminItem.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-12 pb-2">
          <button className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black">
            <ChevronDown className="w-[11px] h-[21px] rotate-90" />
          </button>
          <div className="bg-[#815fb3] w-[27px] h-[27px] rounded-[5px] flex items-center justify-center">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-white">1</span>
          </div>
          <button className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black">
            <ChevronDown className="w-[11px] h-[21px] -rotate-90" />
          </button>
        </div>
      </div>

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAdminCreated}
        adminAxios={adminAxios}
      />
    </div>
  );
}

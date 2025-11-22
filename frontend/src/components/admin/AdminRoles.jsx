import React, { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import AdminTopNav from './AdminTopNav';
import { ChevronDown, Search, X } from 'lucide-react';

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

// Manage Admin Modal
const ManageAdminModal = ({ isOpen, onClose, adminItem, onEdit, onDeactivate, onReactivate }) => {
  if (!isOpen || !adminItem) return null;
  const isActive = (adminItem.status || (adminItem.is_active ? 'Active' : 'Inactive')).toLowerCase() === 'active';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-[400px] max-w-[90vw] shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Raleway, sans-serif'}}>Manage Admin Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6">
          <p className="mb-6 text-gray-700">Please select how you want to manage this account.</p>
          <div className="flex gap-4 justify-end">
            <button onClick={onEdit} className="px-6 py-2 bg-[#815fb3] text-white rounded-lg hover:bg-[#6d4d99] font-semibold">Edit</button>
            {isActive ? (
              <button onClick={onDeactivate} className="px-6 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold">Deactivate</button>
            ) : (
              <button onClick={onReactivate} className="px-6 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 font-semibold">Reactivate</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Admin Modal
const EditAdminModal = ({ isOpen, onClose, adminItem, onSave, loading }) => {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'VET' });
  useEffect(() => {
    if (adminItem) {
      setFormData({
        name: adminItem.name || '',
        email: adminItem.email || '',
        role: adminItem.role || 'VET',
      });
    }
  }, [adminItem, isOpen]);
  if (!isOpen || !adminItem) return null;
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = e => {
    e.preventDefault();
    onSave(formData);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-[400px] max-w-[90vw] shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Raleway, sans-serif'}}>Edit Admin</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <select name="role" value={formData.role} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="VET">Veterinarian</option>
              <option value="DESK">Front Desk</option>
              <option value="MASTER">Master Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-[#815fb3] text-white rounded-lg hover:bg-[#6d4d99] font-semibold">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Confirm Modal (Deactivate/Reactivate)
const ConfirmModal = ({ isOpen, onClose, onConfirm, type }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg w-[350px] max-w-[90vw] shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{type === 'deactivate' ? 'Deactivate Account' : 'Reactivate Account'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6">
          <p className="mb-6 text-gray-700">Are you sure you want to {type === 'deactivate' ? 'deactivate' : 'reactivate'} this account?</p>
          <div className="flex gap-4 justify-end">
            <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
            <button onClick={onConfirm} className={`px-6 py-2 rounded-lg font-semibold ${type === 'deactivate' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>Yes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminRoles() {

  // Sorting state with neutral 'none' direction
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'none') return { key, direction: 'asc' };
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'none' };
      }
      return { key, direction: 'asc' };
    });
  };

  // State to hold the master list of admins
  const [allAdmins, setAllAdmins] = useState([]);
  // State to hold the displayed (filtered/sorted) admins
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { adminAxios, admin } = useAdminAuth();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  // Modal states for manage/edit/deactivate/reactivate
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmType, setConfirmType] = useState('deactivate');

  // Check if current admin is Master Admin
  const isMasterAdmin = admin?.role === 'MASTER' || admin?.role === 'Master Admin';

  // FetchAdmins now ONLY fetches data and saves it to the master list
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAxios.get('/admin/roles');
      if (response.data.success) {
        const results = response.data.results || [];
        setAllAdmins(results);
        setFilteredAdmins(results);
      } else {
        setError('Failed to load admin accounts');
      }
    } catch (err) {
      console.error('❌ AdminRoles fetch error:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Only Master Admin can access this page.');
      } else if (err.response?.status === 401) {
        const errorData = err.response?.data || {};
        const errorMsg = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        setError(`Authentication failed: ${errorMsg}. Please login again.`);
      } else {
        setError('Failed to load admin accounts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [adminAxios]);

  // This useEffect runs ONCE to fetch data
  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // NEW useEffect to handle all filtering and sorting locally
  useEffect(() => {
    let processedAdmins = [...allAdmins];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      processedAdmins = processedAdmins.filter(
        adminItem =>
          adminItem.name?.toLowerCase().includes(term) ||
          adminItem.email?.toLowerCase().includes(term)
      );
    }
    if (roleFilter !== 'all') {
      processedAdmins = processedAdmins.filter(adminItem => adminItem.role?.toLowerCase() === roleFilter.toLowerCase());
    }
    if (statusFilter !== 'all') {
      processedAdmins = processedAdmins.filter(adminItem => {
        const status = (adminItem.status || (adminItem.is_active ? 'active' : 'inactive')).toLowerCase();
        return status === statusFilter.toLowerCase();
      });
    }
    if (sortConfig.key && sortConfig.direction !== 'none') {
      processedAdmins.sort((a, b) => {
        let aVal, bVal;
        if (sortConfig.key === 'status') {
          aVal = (a.status || (a.is_active ? 'active' : 'inactive')).toLowerCase();
          bVal = (b.status || (b.is_active ? 'active' : 'inactive')).toLowerCase();
        } else if (sortConfig.key === 'date_created') {
          aVal = a.date_created || a.created_at;
          bVal = b.date_created || b.created_at;
        } else {
          aVal = a[sortConfig.key] || '';
          bVal = b[sortConfig.key] || '';
        }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
  setFilteredAdmins(processedAdmins);
  setCurrentPage(1); // Reset to first page on filter/sort change
  }, [allAdmins, searchTerm, roleFilter, statusFilter, sortConfig.key, sortConfig.direction]);

  const handleAdminCreated = () => {
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
              {/* Role Filter - functional dropdown */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="bg-[#f0e4b3] h-[31px] w-[121px] rounded-[5px] px-3 text-[12px] text-black font-['Inter:Regular',sans-serif] focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="all">All Roles</option>
                  <option value="MASTER">Master Admin</option>
                  <option value="VET">Veterinarian</option>
                  <option value="DESK">Front Desk</option>
                </select>
              </div>
              {/* Status Filter - functional dropdown */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-[#f0e4b3] h-[31px] w-[122px] rounded-[5px] px-3 text-[12px] text-black font-['Inter:Regular',sans-serif] focus:outline-none"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Data Table */}
        <div className="mx-[100px] bg-[#fffff2] rounded-t-[10px] overflow-hidden mt-[18px]">
          {/* Table Header */}
          <div className="bg-[#fffff2] h-[40px] border-b border-[#888888] flex items-center px-[31px]">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleSort('name')}>
                <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Registered User</span>
                <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                  filter: sortConfig.key === 'name' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                  transform:
                    sortConfig.key !== 'name' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                    sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
                }} />
              </div>
            </div>
            <div className="w-[250px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('email')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Email</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'email' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'email' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[200px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('role')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Role</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'role' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'role' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[150px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('status')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Account Status</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'status' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'status' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[200px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('date_created')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Date Account Created</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'date_created' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'date_created' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
          </div>
          {/* Table Rows - paginated */}
          {filteredAdmins.length === 0 ? (
            <div className="h-[80px] flex items-center justify-center text-[#888888] text-[16px] font-['Inter:Regular',sans-serif]">
              No admin accounts found
            </div>
          ) : (
            filteredAdmins
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((adminItem) => (
                <div 
                  key={adminItem.admin_id || adminItem.id} 
                  className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[31px] hover:bg-gray-50 relative"
                >
                  <div className="flex items-center gap-4 flex-1">
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
                      (adminItem.status || (adminItem.is_active ? 'Active' : 'Inactive')).toLowerCase() === 'active' 
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
                  {/* Manage Button */}
                  {isMasterAdmin && (
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#815fb3] text-white rounded font-semibold text-xs hover:bg-[#6d4d99]"
                      onClick={() => { setSelectedAdmin(adminItem); setManageModalOpen(true); }}
                    >Manage</button>
                  )}
                </div>
              ))
          )}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-12 pb-2">
          <button
            className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronDown className="w-[11px] h-[21px] rotate-90" />
          </button>
          <div className="bg-[#815fb3] w-[27px] h-[27px] rounded-[5px] flex items-center justify-center">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-white">{currentPage}</span>
          </div>
          <span className="text-[#888888] text-[12px]">/ {Math.max(1, Math.ceil(filteredAdmins.length / rowsPerPage))}</span>
          <button
            className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black"
            onClick={() => setCurrentPage((prev) => (prev < Math.ceil(filteredAdmins.length / rowsPerPage) ? prev + 1 : prev))}
            disabled={currentPage >= Math.ceil(filteredAdmins.length / rowsPerPage)}
          >
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
      {/* Manage Modal */}
      <ManageAdminModal
        isOpen={manageModalOpen}
        onClose={() => { setManageModalOpen(false); setSelectedAdmin(null); }}
        adminItem={selectedAdmin}
        onEdit={() => { setManageModalOpen(false); setEditModalOpen(true); }}
        onDeactivate={() => { setManageModalOpen(false); setConfirmType('deactivate'); setConfirmModalOpen(true); }}
        onReactivate={() => { setManageModalOpen(false); setConfirmType('reactivate'); setConfirmModalOpen(true); }}
      />
      {/* Edit Modal */}
      <EditAdminModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setSelectedAdmin(null); }}
        adminItem={selectedAdmin}
        loading={editLoading}
        onSave={async (formData) => {
          setEditLoading(true);
          try {
            await adminAxios.put(`/admin/roles/${selectedAdmin.admin_id || selectedAdmin.id}`, formData);
            setEditModalOpen(false);
            setSelectedAdmin(null);
            fetchAdmins();
          } catch (err) {
            alert('Failed to update admin.');
          } finally {
            setEditLoading(false);
          }
        }}
      />
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setSelectedAdmin(null); }}
        type={confirmType}
        onConfirm={async () => {
          try {
            if (confirmType === 'deactivate') {
              await adminAxios.put(`/admin/roles/${selectedAdmin.admin_id || selectedAdmin.id}/deactivate`);
            } else {
              await adminAxios.put(`/admin/roles/${selectedAdmin.admin_id || selectedAdmin.id}/reactivate`);
            }
            setConfirmModalOpen(false);
            setSelectedAdmin(null);
            fetchAdmins();
          } catch (err) {
            alert('Failed to update account status.');
          }
        }}
      />
    </div>
  );
}

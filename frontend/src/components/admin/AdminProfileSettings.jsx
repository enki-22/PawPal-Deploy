import React, { useState, useEffect, useRef } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminTopNav from './AdminTopNav';
import { Eye, EyeOff, Camera, Edit2, X, Check, Lock, Mail, MapPin, Phone } from 'lucide-react';

// --- Reusable Modal Component ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="bg-[#57166b] px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg font-raleway tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
            <Check className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2 bg-[#815fb3] text-white font-bold rounded-lg hover:bg-[#6f4ea0] transition-colors shadow-sm"
            >
              {loading ? 'Processing...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminProfileSettings() {
  const { adminAxios, adminLogout } = useAdminAuth();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Modal States
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [recoveryEmailOpen, setRecoveryEmailOpen] = useState(false);
  
  // Confirmation States
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    clinic_info: '',
    contact_number: ''
  });
  
  const [passData, setPassData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPass, setShowPass] = useState(false);

  const [recoveryData, setRecoveryData] = useState({
    recovery_email: '',
    confirm_recovery_email: ''
  });

  useEffect(() => {
    fetchAdminProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await adminAxios.get('/admin/profile');
      if (response.data.success) {
        setAdminData(response.data.admin);
        // Initialize form data
        setFormData({
          name: response.data.admin.name || '',
          clinic_info: response.data.admin.clinic_info || '',
          contact_number: response.data.admin.contact_number || ''
        });
        setRecoveryData(prev => ({ ...prev, recovery_email: response.data.admin.recovery_email || '' }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Trigger confirmation
    setConfirmModal({
      isOpen: true,
      title: 'Update Profile Picture',
      message: 'Are you sure you want to update your profile picture?',
      action: () => executePhotoUpload(file)
    });
    // Reset input so same file can be selected again if cancelled/failed
    e.target.value = '';
  };

  const executePhotoUpload = async (file) => {
    setActionLoading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await adminAxios.put('/admin/profile/photo', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        await fetchAdminProfile(); // Refresh data
        setConfirmModal({ ...confirmModal, isOpen: false });
        alert('Profile picture updated successfully!');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.error || 'Failed to upload image.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setEditProfileOpen(false);
    setConfirmModal({
      isOpen: true,
      title: 'Save Profile Changes',
      message: 'Are you sure you want to update your profile information?',
      action: executeProfileUpdate
    });
  };

  const executeProfileUpdate = async () => {
    setActionLoading(true);
    try {
      const response = await adminAxios.put('/admin/profile', formData);
      if (response.data.success) {
        await fetchAdminProfile();
        setConfirmModal({ ...confirmModal, isOpen: false });
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Update failed:', err);
      alert(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.confirm_password) {
      alert("New passwords do not match!");
      return;
    }
    setChangePasswordOpen(false);
    setConfirmModal({
      isOpen: true,
      title: 'Change Password',
      message: 'Are you sure you want to change your password? You will need to login again.',
      action: executePasswordChange
    });
  };

  const executePasswordChange = async () => {
    setActionLoading(true);
    try {
      const response = await adminAxios.post('/admin/change-password', {
        current_password: passData.current_password,
        new_password: passData.new_password
      });
      
      if (response.data.success) {
        setConfirmModal({ ...confirmModal, isOpen: false });
        alert('Password changed successfully. Please login again.');
        await adminLogout();
        window.location.href = '/admin/login';
      }
    } catch (err) {
      console.error('Password change failed:', err);
      alert(err.response?.data?.error || 'Failed to change password.');
      setChangePasswordOpen(true); // Re-open modal on error
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    if (recoveryData.recovery_email !== recoveryData.confirm_recovery_email) {
      alert("Emails do not match!");
      return;
    }
    setRecoveryEmailOpen(false);
    setConfirmModal({
      isOpen: true,
      title: 'Set Recovery Email',
      message: `A verification email will be sent to ${recoveryData.recovery_email}. Continue?`,
      action: executeRecoveryUpdate
    });
  };

  const executeRecoveryUpdate = async () => {
    setActionLoading(true);
    try {
      const response = await adminAxios.post('/admin/recovery-email', {
        recovery_email: recoveryData.recovery_email,
        confirm_recovery_email: recoveryData.confirm_recovery_email
      });
      
      if (response.data.success) {
        setConfirmModal({ ...confirmModal, isOpen: false });
        await fetchAdminProfile();
        alert(response.data.message || 'Verification email sent!');
      }
    } catch (err) {
      console.error('Recovery update failed:', err);
      alert(err.response?.data?.error || 'Failed to set recovery email.');
      setRecoveryEmailOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <AdminTopNav activePage="Profile" />
        <div className="pt-[120px] px-8 max-w-3xl mx-auto flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#57166b]"></div>
        </div>
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <AdminTopNav activePage="Profile" />
        <div className="pt-[120px] px-8 max-w-3xl mx-auto text-center text-red-500">
          {error || 'Profile not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-sans pb-20">
      <AdminTopNav activePage="Profile" />
      
      <div className="pt-[120px] px-4 md:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-[#1a1a1a] font-raleway border-b pb-4 border-gray-200">
          Admin Profile Settings
        </h2>
        
        <div className="flex flex-col gap-6">
          
          {/* PROFILE CARD */}
          <div className="bg-[#FFFFF0] rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative">
            
            {/* Edit Button */}
            <button 
              onClick={() => setEditProfileOpen(true)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-[#815fb3] hover:bg-purple-50 rounded-full transition-all"
              title="Edit Profile Details"
            >
              <Edit2 size={24} />
            </button>

            {/* Avatar Section */}
            <div className="relative shrink-0 group">
              <div className="w-40 h-40 rounded-full bg-[#815fb3] flex items-center justify-center overflow-hidden shadow-inner border-[6px] border-white relative z-10">
                {adminData.profile_image ? (
                  <img src={adminData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-[#815fb3]">
                     <span className="text-white text-4xl font-bold">{adminData.name?.charAt(0) || 'A'}</span>
                  </div>
                )}
              </div>
              
              {/* Camera Button */}
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-2 right-0 bg-[#3C2A4D] hover:bg-[#2a1d36] rounded-full p-2.5 border-2 border-white shadow-lg transition-transform active:scale-95 flex items-center justify-center z-20 cursor-pointer group-hover:scale-110"
                title="Update Profile Picture"
              >
                 <Camera size={18} color="white" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* Details Section */}
            <div className="flex-1 flex flex-col gap-2 text-center md:text-left pt-2 w-full">
              <h3 className="text-2xl font-bold text-[#1a1a1a] uppercase tracking-wide mb-1 font-raleway">
                {adminData.name || 'Admin User'}
              </h3>
              <p className="text-gray-500 text-lg font-medium mb-6 bg-gray-100 inline-block px-3 py-1 rounded-full self-center md:self-start">
                {adminData.role || 'Administrator'}
              </p>

              <div className="flex flex-col gap-4 w-full max-w-lg">
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-[#815fb3]" />
                  <span className="text-base font-medium">{adminData.email}</span>
                </div>

                <div className="flex items-start justify-center md:justify-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-[#815fb3] mt-0.5" />
                  <span className="text-base font-medium leading-tight text-left">
                    {adminData.clinic_info || 'No clinic information set'}
                  </span>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-[#815fb3]" />
                  <span className="text-base font-medium">
                    {adminData.contact_number || 'No contact number set'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECURITY INFO CARD */}
          <div className="bg-[#FFFFF0] rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-black mb-2 uppercase font-raleway flex items-center gap-2">
              <Lock size={20} className="mb-1" /> Security Info
            </h3>
            <p className="text-gray-500 mb-8 font-medium text-sm md:text-base ml-1">
              Manage your login and recovery details to keep your clinic data safe.
            </p>

            <div className="flex flex-col gap-5">
              {/* Password Row */}
              <div className="bg-[#FFFFF2] border border-gray-200 rounded-xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center w-full md:w-auto gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#815fb3]">
                    <Lock size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-lg block">Password</span>
                    <span className="text-xs text-gray-500">
                       Last updated: {adminData.password_updated_at ? new Date(adminData.password_updated_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => setChangePasswordOpen(true)}
                  className="bg-[#815fb3] hover:bg-[#6f4ea0] text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm w-full md:w-auto text-sm"
                >
                  Change Password
                </button>
              </div>

              {/* Recovery Email Row */}
              <div className="bg-[#FFFFF2] border border-gray-200 rounded-xl px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center w-full md:w-auto gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[#815fb3]">
                    <Mail size={20} />
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-lg block">Recovery Email</span>
                    <span className="text-xs text-gray-500 block">For account recovery purposes</span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto justify-end">
                   {adminData.recovery_email ? (
                      <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm font-medium border border-green-100">
                         <Check size={14} />
                         {adminData.recovery_email}
                         {adminData.recovery_email_verified && <span className="text-xs bg-green-200 px-1 rounded text-green-800 ml-1">Verified</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-sm font-medium border border-amber-100">
                         Not Configured
                      </div>
                    )}

                  <button 
                    onClick={() => setRecoveryEmailOpen(true)}
                    className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 px-6 py-2 rounded-lg font-bold transition-colors shadow-sm w-full md:w-auto text-sm"
                  >
                    {adminData.recovery_email ? 'Update' : 'Configure'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Edit Profile Modal */}
      <Modal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} title="Edit Profile Details">
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#815fb3] focus:border-transparent outline-none"
              required
            />
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Clinic Info</label>
             <input 
              type="text"
              value={formData.clinic_info}
              onChange={(e) => setFormData({...formData, clinic_info: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#815fb3] focus:border-transparent outline-none"
            />
          </div>
          <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number</label>
             <input 
              type="text"
              value={formData.contact_number}
              onChange={(e) => setFormData({...formData, contact_number: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#815fb3] focus:border-transparent outline-none"
              placeholder="09XX-XXX-XXXX"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-[#815fb3] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#6f4ea0] transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Change Password Modal */}
      <Modal isOpen={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} title="Change Password">
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"}
                value={passData.current_password}
                onChange={(e) => setPassData({...passData, current_password: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-[#815fb3] outline-none"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400">
                {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
            <input 
              type={showPass ? "text" : "password"}
              value={passData.new_password}
              onChange={(e) => setPassData({...passData, new_password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#815fb3] outline-none"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirm New Password</label>
            <input 
              type={showPass ? "text" : "password"}
              value={passData.confirm_password}
              onChange={(e) => setPassData({...passData, confirm_password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#815fb3] outline-none"
              required
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-[#815fb3] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#6f4ea0] transition-colors">
              Update Password
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Recovery Email Modal */}
      <Modal isOpen={recoveryEmailOpen} onClose={() => setRecoveryEmailOpen(false)} title="Configure Recovery Email">
        <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
          <p className="text-sm text-gray-600 mb-2">
            Enter an email address to use for account recovery. We will send a verification link to this address.
          </p>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Recovery Email</label>
            <input 
              type="email" 
              value={recoveryData.recovery_email}
              onChange={(e) => setRecoveryData({...recoveryData, recovery_email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#815fb3] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Email</label>
            <input 
              type="email" 
              value={recoveryData.confirm_recovery_email}
              onChange={(e) => setRecoveryData({...recoveryData, confirm_recovery_email: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#815fb3] outline-none"
              required
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-[#815fb3] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#6f4ea0] transition-colors">
              Send Verification
            </button>
          </div>
        </form>
      </Modal>

      {/* Global Confirmation Modal */}
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        loading={actionLoading}
      />

    </div>
  );
}

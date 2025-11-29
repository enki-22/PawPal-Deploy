import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import LogoutModal from './LogoutModal';
import useConversations from '../hooks/useConversations';
import phLocations from '../data/ph_locations.json';
import CustomDropdown from './CustomDropdown';

// --- Internal Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Raleway' }}>
            {title}
          </h3>
          <p className="text-gray-600 mb-6 font-medium">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-6 py-2 bg-[#815FB3] text-white font-bold rounded-md hover:bg-[#6D4C9A] transition-colors shadow-sm"
            >
              {loading ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileSettings = () => {
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    phone: '',
    city: '',
    province: '',
    facebook: '',
    date_of_birth: '',
    clinic_name: '',
    license_number: '',
    specialization: '',
    is_verified: false,
    profile_picture: null // URL string from backend
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Edit Modes
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [contactErrors, setContactErrors] = useState({});
  
  // Loading & Modals
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'profile' or 'contact'

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  // Password change state
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordErrors, setPasswordErrors] = useState({});

  const { user, token, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const {
    conversations,
    loadingConversations,
    handleLoadConversation,
    handleCreateNewConversation,
    handlePinConversation,
    handleRenameConversation,
    handleArchiveConversation,
    handleDeleteConversation
  } = useConversations();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  // Shared input class for typing fields to match requested underline style
  // Use smaller vertical padding and base text size so the input doesn't enlarge the row
  const inputClass = "w-full bg-transparent border-0 border-b-2 border-[#815FB3] py-1.5 px-0 text-base placeholder-gray-400 focus:outline-none";
  // Compact input for change-password layout (shorter fields)
  const changePassInputClass = `${inputClass} max-w-xs`;
  // Facebook URL validation (allow common facebook hosts and any path)
  const fbRegex = /^https?:\/\/(?:www\.)?(?:facebook\.com|m\.facebook\.com|fb\.me|fb\.com)(\/.*)?$/i;
  const provinces = phLocations && typeof phLocations === 'object' ? Object.keys(phLocations) : [];
  const selectedProvince = profileData.province;
  const cities = selectedProvince && phLocations && Array.isArray(phLocations[selectedProvince]) ? phLocations[selectedProvince] : [];

  const fetchProfileData = useCallback(async () => {
    try {
      setFetchingData(true);
      const response = await axios.get(`${API_BASE_URL}/users/profile/`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });

      if (response.data) {
        const data = response.data;
        // Map backend response to state
        setProfileData({
          email: data.email || '',
          username: data.username || '',
          
          // Profile specific fields
          phone: data.profile?.phone_number || '',
          city: data.profile?.city || '',
          province: data.profile?.province || '',
          facebook: data.profile?.facebook || '',
          date_of_birth: data.profile?.date_of_birth || '',
          is_verified: data.profile?.is_verified || false,
          
          // Image
          profile_picture: data.profile?.profile_picture || null
        });

        if (data.profile?.profile_picture) {
          // Ensure we have a full URL if backend sends relative path
          const imgUrl = data.profile.profile_picture.startsWith('http') 
            ? data.profile.profile_picture 
            : `${API_BASE_URL.replace('/api', '')}${data.profile.profile_picture}`;
          setPreviewImage(imgUrl);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setFetchingData(false);
    }
  }, [API_BASE_URL, token]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Listen for admin verification events and update UI if current user's profile is verified elsewhere
  useEffect(() => {
    const handleProfileVerified = (e) => {
      try {
        const detail = e.detail || {};
        const verifiedUserId = detail.user_id;
        // user object shape may vary; try common id properties
        const currentUserId = user?.id || user?.user_id || user?.pk || null;
        if (verifiedUserId && currentUserId && Number(verifiedUserId) === Number(currentUserId)) {
          // Update verified flag and refresh profile data
          setProfileData(prev => ({ ...prev, is_verified: true }));
          // Also re-fetch full profile data to be safe
          try { fetchProfileData(); } catch (err) { /* ignore */ }
          // Also refresh AuthContext user object if available
          try { if (refreshUser) refreshUser(); } catch (err) { /* ignore */ }
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('profileVerified', handleProfileVerified);
    return () => window.removeEventListener('profileVerified', handleProfileVerified);
  }, [user, fetchProfileData, refreshUser]);

  // Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setSelectedFile(file);
      setPreviewImage(blobUrl);
      // Dispatch live-update so ProfileButton shows the preview immediately
      try {
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { profile_picture: blobUrl } }));
      } catch (err) {
        // ignore
      }
    }
  };

  const triggerFileInput = () => {
    if (editingProfile) {
        fileInputRef.current.click();
    } else {
        // Optional: Prompt user they need to click "Edit Profile" first
        alert("Please click 'Edit Profile' to change your picture.");
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    // Clear any contact-level field error when the user edits that field
    if (contactErrors && contactErrors[field]) {
      setContactErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-prefix facebook links missing protocol on blur (e.g. "facebook.com/you" -> "https://facebook.com/you")
  const handleFacebookBlur = () => {
    const raw = (profileData.facebook || '').trim();
    if (!raw) return;
    if (!/^https?:\/\//i.test(raw)) {
      const prefixed = `https://${raw}`;
      setProfileData(prev => ({ ...prev, facebook: prefixed }));
      if (contactErrors && contactErrors.facebook) {
        setContactErrors(prev => ({ ...prev, facebook: '' }));
      }
    }
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^\d]/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    // keep leading 09 format if user types
    if (val && !val.startsWith('09')) {
      // If they typed leading country code or similar, try to normalize
      if (val.length > 2) {
        val = '09' + val.substring(2);
      } else {
        val = '09';
      }
    }
    setProfileData(prev => ({ ...prev, phone: val }));
    if (contactErrors.phone_number) {
      setContactErrors(prev => ({ ...prev, phone_number: '' }));
    }
  };

  // --- Confirmation & Save Logic ---

  const initiateSave = (type) => {
    // Validate contact phone before opening confirmation modal
    if (type === 'contact') {
      const phone = (profileData.phone || '').trim();
      const phRegex = /^09\d{9}$/;
      if (!phone) {
        setContactErrors({ phone_number: 'Phone number is required' });
        return;
      } else if (!phRegex.test(phone)) {
        setContactErrors({ phone_number: 'Enter a valid Philippine phone number (09XXXXXXXXX)' });
        return;
      }
      // Validate province/city
      if (!profileData.province) {
        setContactErrors(prev => ({ ...prev, province: 'Province is required' }));
        return;
      }
      if (!profileData.city) {
        setContactErrors(prev => ({ ...prev, city: 'City is required' }));
        return;
      }
      // Validate facebook link if present
      const fbVal = (profileData.facebook || '').trim();
      if (fbVal) {
        if (!fbRegex.test(fbVal)) {
          setContactErrors(prev => ({ ...prev, facebook: 'Enter a valid Facebook URL (e.g. https://facebook.com/yourpage)' }));
          return;
        }
      }
    }

    setPendingAction(type);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (pendingAction === 'profile') {
        await executeProfileUpdate();
    } else if (pendingAction === 'contact') {
        await executeContactUpdate();
    }
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const executeProfileUpdate = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', profileData.username);
      formData.append('email', profileData.email);
      // formData.append('username', profileData.name); // Usually we don't let users change username easily

      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
      }

      const response = await axios.patch(`${API_BASE_URL}/users/profile/`, formData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'multipart/form-data', // Crucial for image upload
        }
      });

      if (response.data) {
        setEditingProfile(false);
        setSelectedFile(null);
        await fetchProfileData(); // Refresh to get proper URL from backend
        // Refresh AuthContext so other pages update immediately
        try {
          if (refreshUser) await refreshUser();
        } catch (err) {
          /* ignore */
        }
        // Notify other components (ProfileButton) that profile was updated
        try {
          const picPath = response.data.profile?.profile_picture || null;
          const returnedUsername = response.data.username || profileData.username || null;
          const detail = {};
          if (picPath) {
            detail.profile_picture = picPath.startsWith('http') ? picPath : `${API_BASE_URL.replace('/api', '')}${picPath}`;
          }
          if (returnedUsername) {
            detail.username = returnedUsername;
          }
          if (Object.keys(detail).length > 0) {
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail }));
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const executeContactUpdate = async () => {
    setLoading(true);
    try {
      // clear existing contact errors before sending
      setContactErrors({});
      // We can use JSON here, but the backend now supports Multipart too. 
      // JSON is cleaner for text-only updates.
      const updateData = {
        phone_number: profileData.phone,
        city: profileData.city,
        province: profileData.province,
        facebook: profileData.facebook
      };

      const response = await axios.patch(`${API_BASE_URL}/users/profile/`, updateData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      if (response.data) {
        setEditingContact(false);
        setContactErrors({});
        await fetchProfileData();
        try {
          if (refreshUser) await refreshUser();
        } catch (err) {
          /* ignore */
        }
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      // If the API returns field-level errors, map them into contactErrors for inline display
      const apiData = error?.response?.data;
      if (apiData && typeof apiData === 'object') {
        const fieldErrors = {};
        // API might return { field: ["error"] } or { error: "msg" }
        for (const [key, val] of Object.entries(apiData)) {
          if (Array.isArray(val)) fieldErrors[key] = val.join(', ');
          else if (typeof val === 'string') fieldErrors[key] = val;
        }
        if (Object.keys(fieldErrors).length > 0) {
          setContactErrors(prev => ({ ...prev, ...fieldErrors }));
        } else {
          alert('Failed to update contact info.');
        }
      } else {
        alert('Failed to update contact info.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Change Password ---
  const handlePasswordInput = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) setPasswordErrors(prev => ({ ...prev, [field]: '' }));
  };

  const submitPasswordChange = async () => {
    setLoading(true);
    setPasswordErrors({});
    try {
      const payload = {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      };
      const response = await axios.post(`${API_BASE_URL}/users/change-password/`, payload, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (response.status === 200) {
        setChangingPassword(false);
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        alert('Password changed successfully. Please log in again.');
        // Force logout so user re-authenticates with new password
        await logout();
        navigate('/petowner/login');
      }
    } catch (err) {
      const apiData = err?.response?.data;
      if (apiData && typeof apiData === 'object') {
        const fieldErrors = {};
        for (const [k, v] of Object.entries(apiData)) {
          fieldErrors[k] = Array.isArray(v) ? v.join(', ') : v;
        }
        setPasswordErrors(fieldErrors);
      } else {
        alert('Failed to change password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelEditProfile = () => {
    setEditingProfile(false);
    setSelectedFile(null);
    // Revert changes by re-fetching data from server
    try {
      fetchProfileData();
    } catch (err) {
      // ignore
    }

    // Reset preview to original
    if (profileData.profile_picture) {
        const imgUrl = profileData.profile_picture.startsWith('http') 
          ? profileData.profile_picture 
          : `${API_BASE_URL.replace('/api', '')}${profileData.profile_picture}`;
        setPreviewImage(imgUrl);
    } else {
        setPreviewImage(null);
    }
    // Notify profile button to revert to original image
    try {
      const original = profileData.profile_picture
        ? (profileData.profile_picture.startsWith('http') ? profileData.profile_picture : `${API_BASE_URL.replace('/api', '')}${profileData.profile_picture}`)
        : null;
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { profile_picture: original } }));
    } catch (err) {
      // ignore
    }
  };

  // NEW cancel function for Contact Info
  const cancelEditContact = () => {
    setEditingContact(false);
    setContactErrors({});
    // Revert changes by re-fetching data from server
    try {
      fetchProfileData();
    } catch (err) {
      // ignore
    }
  };

  // --- Render ---

  return (
  <div className="min-h-screen bg-[#F0F0F0] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar (Desktop) */}
      <div className="hidden md:block fixed top-0 left-0 h-screen w-80 z-30">
        <Sidebar
          sidebarVisible={sidebarVisible}
          currentPage="profile-settings"
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          showSearch={false}
          conversations={conversations}
          loadingConversations={loadingConversations}
          onLoadConversation={handleLoadConversation}
          onCreateNewConversation={handleCreateNewConversation}
          onPinConversation={handlePinConversation}
          onRenameConversation={handleRenameConversation}
          onArchiveConversation={handleArchiveConversation}
          onDeleteConversation={handleDeleteConversation}
          user={user}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className={`md:hidden fixed inset-0 z-50 flex transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
         {/* ... (Mobile Sidebar Code same as original) ... */}
         <div className={`w-80 h-full bg-[#DCCEF1] transition-transform duration-300 transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar 
            currentPage="profile-settings"
            onToggleSidebar={() => setIsMobileSidebarOpen(false)}
            isMobileOverlay={true}
            conversations={conversations}
            loadingConversations={loadingConversations}
            onLoadConversation={handleLoadConversation}
            onCreateNewConversation={handleCreateNewConversation}
            onPinConversation={handlePinConversation}
            onRenameConversation={handleRenameConversation}
            onArchiveConversation={handleArchiveConversation}
            onDeleteConversation={handleDeleteConversation}
            user={user}
          />
         </div>
         <div className="flex-1 bg-black bg-opacity-50" onClick={() => setIsMobileSidebarOpen(false)}></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ background: '#F0F0F0', ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? { marginLeft: sidebarVisible ? '320px' : '80px', marginTop: '72px', transition: 'margin-left 0.3s' } : { marginLeft: '0px' }) }}>

        {/* Header */}
        <div className="border-b p-2 md:p-4 flex flex-row items-center" style={{
          position: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'fixed' : 'static',
          top: typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : undefined,
          right: typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : undefined,
          left: typeof window !== 'undefined' && window.innerWidth >= 768 ? (sidebarVisible ? 320 : 80) : 0,
          height: typeof window !== 'undefined' && window.innerWidth >= 768 ? '72px' : undefined,
          width: typeof window !== 'undefined' && window.innerWidth >= 768 ? (sidebarVisible ? 'calc(100% - 320px)' : 'calc(100% - 80px)') : '100%',
          zIndex: 40,
          background: typeof window !== 'undefined' && window.innerWidth >= 768 ? '#f0f1f1' : '#DCCEF1',
          transition: 'left 0.3s, width 0.3s',
        }}>
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-2">
               <span className="font-bold text-lg text-[#815FB3]">PAWPAL</span>
               <button onClick={() => setIsMobileSidebarOpen(true)}>
                  <img src="/sidebar-expand-icon.png" className="w-6 h-6" alt="Menu"/>
               </button>
            </div>
            <ProfileButton onLogoutClick={() => setShowLogoutModal(true)} />
          </div>
          <div className="hidden md:flex items-center justify-between w-full">
            <h2 className="text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>Profile Settings</h2>
            <ProfileButton onLogoutClick={() => setShowLogoutModal(true)} />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-2 md:p-6" style={{ paddingTop: '80px' }}>
          
          {fetchingData ? (
            <div className="text-center mt-10">Loading profile...</div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* PROFILE INFORMATION CARD */}
              <div className="rounded-xl shadow-sm p-6 relative bg-[#FEFDF5]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 hidden md:block" style={{ fontFamily: 'Raleway' }}>Profile Information</h3>
                  <div className={`px-4 py-2 rounded-md text-sm font-medium ${profileData.is_verified ? 'bg-[#B0F2B4] text-green-800' : 'bg-orange-100 text-orange-700'}`}>
                    {profileData.is_verified ? 'Verified Client' : 'For Verification'}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center md:pl-8">
                  {/* Image */}
                  <div className="relative group flex-shrink-0">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-sm bg-gray-200">
                      {previewImage ? (
                        <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    {editingProfile && (
                        <button 
                        onClick={triggerFileInput}
                        className="absolute bottom-1 right-1 bg-transparent p-1 rounded-full hover:opacity-90"
                        aria-label="Change profile picture"
                        >
                          <img src="/Button.png" alt="Change" className="w-8 h-8 object-contain" />
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </div>

                    {/* Inputs */}
                    <div className="flex-1 w-full max-w-lg grid grid-cols-[100px_1fr] gap-4 items-center">
                    <span className="font-bold text-gray-500">Username</span>
                    {editingProfile ? (
                      <input type="text" value={profileData.username} onChange={(e) => handleInputChange('username', e.target.value)} className={inputClass} style={{ fontFamily: 'Raleway' }} />
                    ) : (
                      <span className="font-medium text-gray-900">{profileData.username}</span>
                    )}

                    <span className="font-bold text-gray-500">Email</span>
                    {editingProfile ? (
                      <input type="email" value={profileData.email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass} />
                    ) : (
                      <span className="font-medium text-gray-900 truncate">{profileData.email}</span>
                    )}
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                   {editingProfile ? (
                    <div className="flex gap-3">
                      <button onClick={cancelEditProfile} className="px-6 py-2 rounded-full text-gray-600 font-bold hover:bg-gray-200 shadow-sm transition-transform">Cancel</button>
                      <button onClick={() => initiateSave('profile')} className="bg-[#815FB3] text-white font-bold py-2 px-8 rounded-2xl shadow-lg hover:bg-[#6D4C9A] transform hover:-translate-y-0.5 transition-all">Save Changes</button>
                    </div>
                   ) : (
                    <button onClick={() => setEditingProfile(true)} className="bg-[#815FB3] text-white font-bold py-2 px-8 rounded-2xl shadow-md hover:bg-[#6D4C9A] transform hover:-translate-y-0.5 transition-all">Edit Profile</button>
                   )}
                </div>
              </div>

              {/* CONTACT INFORMATION CARD */}
              <div className="rounded-xl shadow-sm p-6 bg-[#FEFDF5]">
                 <h3 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Raleway' }}>Contact Information</h3>
                 <div className="md:pl-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <label className="block text-gray-600 font-bold text-sm mb-1">Phone Number</label>
                         {editingContact ? (
                           <>
                               <input type="tel" value={profileData.phone} onChange={handlePhoneChange} className={inputClass} placeholder="09XXXXXXXXX" />
                             {contactErrors.phone_number && <p className="text-red-500 text-xs mt-1">{contactErrors.phone_number}</p>}
                           </>
                         ) : <p className="text-gray-800">{profileData.phone || 'N/A'}</p>}
                     </div>
                     <div>
                         <label className="block text-gray-600 font-bold text-sm mb-1">Facebook Link</label>
                         {editingContact ? (
                           <>
                             <input type="url" value={profileData.facebook} onChange={(e) => handleInputChange('facebook', e.target.value)} onBlur={handleFacebookBlur} className={inputClass} />
                             {contactErrors.facebook && <p className="text-red-500 text-xs mt-1">{contactErrors.facebook}</p>}
                           </>
                         ) : <p className="text-gray-800 break-all">{profileData.facebook || 'N/A'}</p>}
                          {editingContact && (
                            <p className="text-xs text-gray-500 mt-1">Examples: https://facebook.com/yourpage or https://www.facebook.com/username</p>
                          )}
                          {editingContact && (
                            <p className="text-xs text-gray-500 mt-1">Examples: https://facebook.com/yourpage or https://www.facebook.com/username</p>
                          )}
                     </div>
                     {/* Address field removed by request - now using city/province only */}
                     <div>
                         <label className="block text-gray-600 font-bold text-sm mb-1">City</label>
                         {editingContact ? (
                           <>
                             <CustomDropdown
                               name="city"
                               value={profileData.city}
                               onChange={(e) => handleInputChange('city', e.target.value)}
                               options={cities}
                               disabled={!profileData.province}
                               placeholder="City"
                             />
                             {contactErrors.city && <p className="text-red-500 text-xs mt-1">{contactErrors.city}</p>}
                           </>
                         ) : <p className="text-gray-800">{profileData.city || 'N/A'}</p>}
                     </div>
                     <div>
                         <label className="block text-gray-600 font-bold text-sm mb-1">Province</label>
                         {editingContact ? (
                           <>
                             <CustomDropdown
                               name="province"
                               value={profileData.province}
                               onChange={(e) => { handleInputChange('province', e.target.value); handleInputChange('city', ''); }}
                               options={provinces}
                               placeholder="Province"
                             />
                             {contactErrors.province && <p className="text-red-500 text-xs mt-1">{contactErrors.province}</p>}
                           </>
                         ) : <p className="text-gray-800">{profileData.province || 'N/A'}</p>}
                     </div>
                 </div>
                 <div className="flex justify-end mt-8">
                    {editingContact ? (
                      <div className="flex gap-3">
                          <button onClick={cancelEditContact} className="px-6 py-2 rounded-full text-gray-600 font-bold hover:bg-gray-200 shadow-sm transition-transform">Cancel</button>
                          <button onClick={() => initiateSave('contact')} className="bg-[#815FB3] text-white font-bold py-2 px-8 rounded-2xl shadow-lg hover:bg-[#6D4C9A] transform hover:-translate-y-0.5 transition-all">Save Changes</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingContact(true)} className="bg-[#815FB3] text-white font-bold py-2 px-8 rounded-2xl shadow-md hover:bg-[#6D4C9A] transform hover:-translate-y-0.5 transition-all">Update Contact Info</button>
                    )}
                 </div>
              </div>
              
              {/* ACCOUNT SETTINGS */}
              <div className="rounded-xl shadow-sm p-6 bg-[#FEFDF5]">
                <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Raleway' }}>Account Settings</h3>

                <div className="mt-2">
                  <button
                    onClick={() => setChangingPassword(true)}
                    className="w-full flex items-center gap-4 p-4 bg-[#FEFDF5] rounded-lg border border-transparent hover:bg-[#F7F3FB] transition-colors"
                    aria-expanded={changingPassword}
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-transparent">
                      <img src="/Updatepass.png" alt="Change password" className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">Change Password</div>
                      <div className="text-xs text-gray-600">Secure your account by updating your password</div>
                    </div>
                    <div className="ml-auto">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </button>

                  {changingPassword && (
                    <div className="mt-4 pl-6 md:pl-20">
                      <div className="grid grid-cols-2 gap-3 items-start">
                        {/* Current password at top-left */}
                        <div className="col-span-1">
                          <input
                            type="password"
                            placeholder="Current password"
                            value={passwordData.current_password}
                            onChange={(e) => handlePasswordInput('current_password', e.target.value)}
                            className={changePassInputClass}
                          />
                          {passwordErrors.current_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.current_password}</p>}
                        </div>
                        {/* empty spacer to keep top-right blank */}
                        <div className="col-span-1" />

                        {/* New password (left) */}
                        <div className="col-span-1">
                          <input
                            type="password"
                            placeholder="New password"
                            value={passwordData.new_password}
                            onChange={(e) => handlePasswordInput('new_password', e.target.value)}
                            className={changePassInputClass}
                          />
                          {passwordErrors.new_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.new_password}</p>}
                        </div>

                        {/* Confirm password (right) */}
                        <div className="col-span-1">
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordData.confirm_password}
                            onChange={(e) => handlePasswordInput('confirm_password', e.target.value)}
                            className={changePassInputClass}
                          />
                          {passwordErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{passwordErrors.confirm_password}</p>}
                        </div>

                        {/* Update button placed under confirm password (right column) */}
                        <div className="col-start-2 mt-2">
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => { setChangingPassword(false); setPasswordErrors({}); setPasswordData({ current_password: '', new_password: '', confirm_password: '' }); }} className="px-6 py-2 rounded-full text-gray-600 font-bold hover:bg-gray-200 shadow-sm transition-transform">Cancel</button>
                            <button onClick={submitPasswordChange} className="bg-[#815FB3] text-white font-bold py-2 px-8 rounded-2xl shadow-lg hover:bg-[#6D4C9A] transform hover:-translate-y-0.5 transition-all">Update Password</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          )}
        </div>
      </div>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={async () => { await logout(); navigate('/petowner/login'); }} />
      
      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        loading={loading}
        title={pendingAction === 'profile' ? "Save Profile Changes?" : "Save Contact Information?"}
        message="Are you sure you want to save these changes? This will update your public profile."
      />
    </div>
  );
};

export default ProfileSettings;
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import LogoutModal from './LogoutModal';
import useConversations from '../hooks/useConversations';

const ProfileSettings = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    facebook: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    clinic_name: '',
    license_number: '',
    specialization: '',
    is_verified: false, // Added field for verification status
    profile_picture: null // Added field for image
  });

  // State for image uploading
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Responsive mobile sidebar overlay
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  // Use conversations hook
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

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  // Memoize fetchProfileData to avoid useEffect dependency warning
  const fetchProfileData = useCallback(async () => {
    try {
      setFetchingData(true);
      const response = await axios.get(`${API_BASE_URL}/users/profile/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (response.data) {
        const userData = response.data;
        setProfileData({
          name: userData.username || '',
          email: userData.email || '',
          phone: userData.profile?.phone || '',
          address: userData.profile?.address || '',
          city: userData.profile?.city || '',
          province: userData.profile?.province || '',
          facebook: userData.profile?.facebook || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          date_of_birth: userData.profile?.date_of_birth || '',
          clinic_name: userData.profile?.clinic_name || '',
          license_number: userData.profile?.license_number || '',
          specialization: userData.profile?.specialization || '',
          is_verified: userData.profile?.is_verified || false,
          profile_picture: userData.profile?.profile_picture || null
        });
        // Set initial preview if existing image
        if (userData.profile?.profile_picture) {
          setPreviewImage(userData.profile.profile_picture);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setProfileData(prev => ({
        ...prev,
        name: user?.username || '',
        email: user?.email || ''
      }));
    } finally {
      setFetchingData(false);
    }
  }, [API_BASE_URL, token, user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create local preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // If creating a FormData object for image upload + data
      const formData = new FormData();
      formData.append('username', profileData.name);
      formData.append('email', profileData.email);
      formData.append('first_name', profileData.first_name);
      formData.append('last_name', profileData.last_name);
      // Add other fields as needed by your backend structure...
      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
      }

      // NOTE: You might need to adjust this depending on if your backend 
      // accepts JSON or Multipart/Form-data for the patch. 
      // If JSON only, you might need a separate endpoint for the image.
      // Below is assuming standard JSON patch for data:
      const updateData = {
        username: profileData.name,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        // ... add other profile nested fields
      };

      const response = await axios.patch(`${API_BASE_URL}/users/profile/`, updateData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });
      // If you have a separate image upload logic, handle 'selectedFile' upload here using formData

      if (response.data) {
        console.log('Profile updated successfully');
        setEditingProfile(false);
        await fetchProfileData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactUpdate = async () => {
    setLoading(true);
    try {
      const updateData = {
        profile: {
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          province: profileData.province,
          facebook: profileData.facebook
        }
      };

      const response = await axios.patch(`${API_BASE_URL}/users/profile/`, updateData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      if (response.data) {
        console.log('Contact info updated successfully');
        setEditingContact(false);
        // Optionally refresh the data
        await fetchProfileData();
      }
    } catch (error) {
      console.error('Error updating contact info:', error);
      alert('Failed to update contact information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Logout modal handlers
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setLoading(true);
      await logout();
      navigate('/petowner/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
  <div className="min-h-screen bg-[#F0F0F0] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar - Stationary and fixed on desktop */}
      <div className="hidden md:block fixed top-0 left-0 h-screen w-80 z-30">
        <Sidebar
          sidebarVisible={sidebarVisible}
          currentPage="profile-settings"
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          showSearch={false}
          showPinnedChats={true}
          showRecentChats={true}
          conversations={conversations}
          loadingConversations={loadingConversations}
          onLoadConversation={handleLoadConversation}
          onCreateNewConversation={handleCreateNewConversation}
          onPinConversation={handlePinConversation}
          onRenameConversation={handleRenameConversation}
          onArchiveConversation={handleArchiveConversation}
          onDeleteConversation={handleDeleteConversation}
          isMobileOverlay={false}
        />
      </div>

      {/* Mobile Sidebar Overlay with Transitions */}
      <div
        className={`
          md:hidden fixed inset-0 z-50 flex
          transition-opacity duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        role="dialog"
        aria-modal="true"
      >
        {/* Sidebar Component (The sliding part) */}
        <div
          className={`
            w-80 h-full
            transition-transform duration-300 ease-in-out transform
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            bg-[#DCCEF1]
          `}
        >
          <Sidebar
            sidebarVisible={true}
            currentPage="profile-settings"
            onToggleSidebar={() => setIsMobileSidebarOpen(false)}
            showSearch={false}
            showPinnedChats={true}
            showRecentChats={true}
            conversations={conversations}
            loadingConversations={loadingConversations}
            onLoadConversation={(id) => {
              handleLoadConversation(id);
              setIsMobileSidebarOpen(false);
            }}
            onCreateNewConversation={() => {
              handleCreateNewConversation();
              setIsMobileSidebarOpen(false);
            }}
            onPinConversation={handlePinConversation}
            onRenameConversation={handleRenameConversation}
            onArchiveConversation={handleArchiveConversation}
            onDeleteConversation={handleDeleteConversation}
            isMobileOverlay={true}
          />
        </div>
        {/* Overlay Background (The fading part) */}
        <div 
          className="flex-1 bg-black bg-opacity-50" 
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        ></div>
      </div>

      {/* Main Content Area - left margin slides with sidebar state, no centering, smooth transition */}
      <div
        className={`flex-1 flex flex-col min-w-0 bg-[#F0F0F0] w-full transition-all duration-300 md:ml-80 ${!sidebarVisible ? 'md:ml-20' : ''}`}
      >
        {/* Stationary Header */}
        <div
          className={`
            fixed top-0 right-0 z-40
            h-[64px] md:h-[72px] 
            border-b p-2 md:p-4 
            flex flex-row items-center 
            bg-[#DCCEF1] md:bg-[#f0f1f1] 
            transition-all duration-300
            left-0 ${sidebarVisible ? 'md:left-80' : 'md:left-20'}
          `}
        >
          {/* Mobile Header Content: Logo + Name + Sidebar Toggle + Profile */}
          <div className="flex md:hidden items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <img src="/pat-removebg-preview 2.png" alt="PawPal Logo" className="w-8 h-8" />
              <span className="font-bold text-lg text-[#815FB3]" style={{ fontFamily: 'Raleway' }}>PAWPAL</span>
              <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 ml-2" aria-label="Open sidebar">
                <img src="/sidebar-expand-icon.png" alt="Sidebar Toggle" className="w-6 h-6" style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>

          {/* Desktop Header Content: Title + Profile */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-2 md:gap-4">
              <h2 className="text-lg md:text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                Profile Settings
              </h2>
            </div>
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
        </div>

        {/* Main Content Body - add top padding to avoid header overlap, no centering, smooth transition */}
        <div className="flex-1 overflow-y-auto p-2 md:p-6" style={{ paddingTop: '80px' }}>
          
          {/* Mobile Page Title - Visible only on mobile, top of content */}
          <div className="md:hidden mb-4 px-2">
             <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
               Profile Settings
             </h2>
          </div>

          {fetchingData ? (
            <div className="text-center mt-10">Loading profile...</div>
          ) : (
            <div className="max-w-2xl md:max-w-4xl mx-auto space-y-4 md:space-y-6">
              
              {/* --- MODIFIED PROFILE INFORMATION CARD --- */}
              <div className="rounded-xl shadow-sm p-6 relative" style={{ backgroundColor: '#FEFDF5' }}>
                
                {/* Header & Status Badge Area */}
                <div className="flex flex-row justify-end md:justify-between items-center mb-2 md:mb-8">
                  {/* Desktop Title - Hidden on Mobile */}
                  <h3 className="hidden md:block text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                    Profile Information
                  </h3>
                  
                  {/* Badge */}
                  <div className={`
                    px-4 py-2 rounded-md text-sm font-medium
                    ${profileData.is_verified 
                      ? 'bg-[#B0F2B4] text-green-800' 
                      : 'bg-orange-100 text-orange-700 border border-orange-200'}
                  `}>
                    {profileData.is_verified 
                      ? 'Verified Southvalley Client' 
                      : 'For Verification Southvalley Client'}
                  </div>
                </div>

                {/* Main Content Row: Image + Data */}
                <div className="flex flex-col md:flex-row gap-8 items-center md:pl-8">
                  
                  {/* Profile Image Section */}
                  <div className="relative group flex-shrink-0 mx-auto md:mx-0">
                    <div className="w-28 h-28 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-sm bg-gray-200">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={triggerFileInput}
                      className="absolute bottom-1 right-1 bg-[#3D2C54] text-white p-2 rounded-full hover:bg-[#2a1e3a] transition-colors shadow-md flex items-center justify-center"
                      title="Change Profile Picture"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Mobile Title: Profile Information - Visible only on Mobile, Below Image */}
                  <h3 className="md:hidden text-2xl font-bold text-gray-900 -mt-2 mb-2 text-center" style={{ fontFamily: 'Raleway' }}>
                    Profile Information
                  </h3>

                  {/* Details Section */}
                  <div className="flex-1 w-full flex justify-center md:justify-start">
                    {/* Grid container */}
                    <div className="grid grid-cols-[100px_1fr] md:grid-cols-[120px_1fr] gap-x-4 md:gap-x-8 gap-y-4 md:gap-y-6 items-center text-gray-700 text-base md:text-lg w-full max-w-sm md:max-w-lg">
                      {/* Name Row */}
                      <span className="font-bold text-gray-500" style={{ fontFamily: 'Raleway' }}>Name</span>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#815FB3]"
                        />
                      ) : (
                        <span className="font-medium text-gray-900" style={{ fontFamily: 'Raleway' }}>
                          {profileData.first_name && profileData.last_name 
                            ? `${profileData.first_name} ${profileData.last_name}`
                            : profileData.name}
                        </span>
                      )}

                      {/* Email Row */}
                      <span className="font-bold text-gray-500" style={{ fontFamily: 'Raleway' }}>Email</span>
                      <span className="font-medium text-gray-900 truncate" style={{ fontFamily: 'Raleway' }}>
                        {profileData.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="flex justify-center md:justify-end mt-8 w-full">
                   {editingProfile ? (
                    <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end">
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="flex-1 md:flex-none px-6 py-2 rounded-md text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                        style={{ fontFamily: 'Raleway' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="flex-1 md:flex-none bg-[#815FB3] hover:bg-[#6D4C9A] text-white font-bold py-2 px-8 rounded-md shadow-sm transition-colors"
                        style={{ fontFamily: 'Raleway' }}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                   ) : (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="w-full md:w-auto bg-[#815FB3] hover:bg-[#6D4C9A] text-white font-bold py-3 md:py-2 px-8 rounded-md shadow-sm transition-colors"
                      style={{ fontFamily: 'Raleway' }}
                    >
                      Edit Profile
                    </button>
                   )}
                </div>
              </div>
              {/* --- END OF MODIFIED CARD --- */}

              {/* --- MODIFIED CONTACT INFORMATION CARD --- */}
              <div className="rounded-xl shadow-sm p-6 relative" style={{ backgroundColor: '#FEFDF5' }}>
                 <h3 className="text-xl font-bold text-gray-900 mb-6 text-center md:text-left" style={{ fontFamily: 'Raleway' }}>
                   Contact Information
                 </h3>

                 {/* Responsive Grid: 2 Columns on both Mobile (small gap) and Desktop (large gap) */}
                 <div className="md:pl-10">
                   <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:gap-x-16">
                     {/* Phone Number */}
                     <div className="flex flex-col">
                         <label className="block text-gray-600 font-bold text-sm md:text-lg mb-1" style={{ fontFamily: 'Raleway' }}>Phone Number</label>
                         {editingContact ? (
                           <input 
                             type="tel" 
                             value={profileData.phone} 
                             onChange={(e) => handleInputChange('phone', e.target.value)} 
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#815FB3] text-sm md:text-base" 
                           />
                         ) : (
                           <p className="text-gray-800 text-sm md:text-base break-words" style={{ fontFamily: 'Raleway' }}>
                             {profileData.phone}
                           </p>
                         )}
                     </div>

                     {/* Complete Address */}
                     <div className="flex flex-col">
                         <label className="block text-gray-600 font-bold text-sm md:text-lg mb-1" style={{ fontFamily: 'Raleway' }}>Complete Address</label>
                         {editingContact ? (
                           <input 
                             type="text" 
                             value={profileData.address} 
                             onChange={(e) => handleInputChange('address', e.target.value)} 
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#815FB3] text-sm md:text-base" 
                           />
                         ) : (
                           <p className="text-gray-800 text-sm md:text-base break-words" style={{ fontFamily: 'Raleway' }}>
                             {profileData.address}
                           </p>
                         )}
                     </div>

                     {/* Facebook Link */}
                     <div className="flex flex-col">
                         <label className="block text-gray-600 font-bold text-sm md:text-lg mb-1" style={{ fontFamily: 'Raleway' }}>Facebook Link</label>
                         {editingContact ? (
                           <input 
                             type="url" 
                             value={profileData.facebook} 
                             onChange={(e) => handleInputChange('facebook', e.target.value)} 
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#815FB3] text-sm md:text-base" 
                           />
                         ) : (
                           <p className="text-gray-800 text-sm md:text-base break-words break-all" style={{ fontFamily: 'Raleway' }}>
                             {profileData.facebook}
                           </p>
                         )}
                     </div>

                     {/* City/Province */}
                     <div className="flex flex-col">
                         <label className="block text-gray-600 font-bold text-sm md:text-lg mb-1" style={{ fontFamily: 'Raleway' }}>City/Province</label>
                         {editingContact ? (
                           <div className="space-y-2">
                             <input 
                               type="text" 
                               placeholder="City" 
                               value={profileData.city} 
                               onChange={(e) => handleInputChange('city', e.target.value)} 
                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#815FB3] text-sm md:text-base" 
                             />
                             <input 
                               type="text" 
                               placeholder="Province" 
                               value={profileData.province} 
                               onChange={(e) => handleInputChange('province', e.target.value)} 
                               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#815FB3] text-sm md:text-base" 
                             />
                           </div>
                         ) : (
                           <p className="text-gray-800 text-sm md:text-base break-words" style={{ fontFamily: 'Raleway' }}>
                             {profileData.city || profileData.province ? `${profileData.city}, ${profileData.province}` : ''}
                           </p>
                         )}
                     </div>
                   </div>
                 </div>

                 {/* Bottom Right Button */}
                 <div className="flex justify-end mt-8">
                    {editingContact ? (
                      <div className="flex gap-3">
                          <button 
                            onClick={() => setEditingContact(false)} 
                            className="px-6 py-2 rounded-md text-gray-600 font-bold hover:bg-gray-200 transition-colors" 
                            style={{ fontFamily: 'Raleway' }}
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleContactUpdate} 
                            className="bg-[#815FB3] hover:bg-[#6D4C9A] text-white font-bold py-2 px-8 rounded-md shadow-sm transition-colors" 
                            style={{ fontFamily: 'Raleway' }}
                          >
                            Save Changes
                          </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setEditingContact(true)} 
                        className="bg-[#815FB3] hover:bg-[#6D4C9A] text-white font-bold py-2 px-8 rounded-md shadow-sm transition-colors" 
                        style={{ fontFamily: 'Raleway' }}
                      >
                        Update Contact Info
                      </button>
                    )}
                 </div>
              </div>
              {/* --- END OF MODIFIED CONTACT INFORMATION CARD --- */}

                {/* --- MODIFIED ACCOUNT SETTINGS CARD --- */}
                <div className="rounded-xl shadow-sm p-6" style={{ backgroundColor: '#FEFDF5' }}>
                  <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Raleway' }}>
                   Account Settings
                  </h3>
                  <div className="pl-6">
                    <button className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                      {/* Custom Icon Image */}
                      <img src="/Updatepass.png" alt="Key Icon" className="w-5 h-5 object-contain" />
                      <span className="font-bold text-black text-lg" style={{ fontFamily: 'Raleway' }}>
                        Change Password
                      </span>
                    </button>
                  </div>
                </div>
                {/* --- END OF MODIFIED ACCOUNT SETTINGS CARD --- */}

            </div>
          )}
        </div>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        loading={loading}
      />
    </div>
  );
};

export default ProfileSettings;
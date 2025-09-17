import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
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
    specialization: ''
  });
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // Use conversations hook
  const {
    conversations,
    loadingConversations,
    handleLoadConversation,
    handleCreateNewConversation,
    handlePinConversation
  } = useConversations();

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    // Load user profile data
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setFetchingData(true);
      const response = await axios.get(`${API_BASE_URL}/users/profile/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
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
          specialization: userData.profile?.specialization || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      // Fallback to user data from auth context
      setProfileData(prev => ({
        ...prev,
        name: user?.username || '',
        email: user?.email || ''
      }));
    } finally {
      setFetchingData(false);
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const updateData = {
        username: profileData.name,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        profile: {
          date_of_birth: profileData.date_of_birth,
          clinic_name: profileData.clinic_name,
          license_number: profileData.license_number,
          specialization: profileData.specialization
        }
      };

      const response = await axios.put(`${API_BASE_URL}/users/profile/`, updateData, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
          'Content-Type': 'application/json',
        }
      });

      if (response.data) {
        console.log('Profile updated successfully');
        setEditingProfile(false);
        // Optionally refresh the data
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
          'Authorization': token ? `Token ${token}` : '',
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

  return (
    <div className="h-screen bg-[#F0F0F0] flex overflow-hidden">
      {/* Left Sidebar */}
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
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F0F0F0]">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#f0f1f1' }}>
          <div className="flex items-center space-x-4">
            {!sidebarVisible && (
              <button
                onClick={() => setSidebarVisible(true)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                title="Show sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h2 className="text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
              Profile Settings
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <ProfileButton />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {fetchingData ? (
            <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3] mx-auto mb-4"></div>
                <div className="text-lg font-medium text-gray-600" style={{ fontFamily: 'Raleway' }}>
                  Loading profile...
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Profile Information Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                  Profile Information
                </h3>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="bg-[#815FB3] hover:bg-[#6D4C9A] text-white font-bold py-2 px-6 rounded-full transition-colors"
                    style={{ fontFamily: 'Raleway' }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="flex items-start space-x-6">
                {/* Profile Image */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  {editingProfile && (
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#815FB3] rounded-full flex items-center justify-center text-white">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Profile Details */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Raleway' }}>
                        Name
                      </label>
                      {editingProfile ? (
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3]"
                          style={{ fontFamily: 'Raleway' }}
                        />
                      ) : (
                        <p className="text-gray-900" style={{ fontFamily: 'Raleway' }}>{profileData.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Raleway' }}>
                        Email
                      </label>
                      {editingProfile ? (
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3]"
                          style={{ fontFamily: 'Raleway' }}
                        />
                      ) : (
                        <p className="text-gray-900" style={{ fontFamily: 'Raleway' }}>{profileData.email}</p>
                      )}
                    </div>
                  </div>

                  {editingProfile && (
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="bg-[#815FB3] hover:bg-[#6D4C9A] text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50"
                        style={{ fontFamily: 'Raleway' }}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-6 rounded-full transition-colors"
                        style={{ fontFamily: 'Raleway' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                  Contact Information
                </h3>
                {!editingContact && (
                  <button
                    onClick={() => setEditingContact(true)}
                    className="bg-[#815FB3] hover:bg-[#6D4C9A] text-white font-bold py-2 px-6 rounded-full transition-colors"
                    style={{ fontFamily: 'Raleway' }}
                  >
                    Update Contact Info
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Raleway' }}>
                    Phone Number
                  </label>
                  {editingContact ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3]"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  ) : (
                    <p className="text-gray-900" style={{ fontFamily: 'Raleway' }}>{profileData.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Raleway' }}>
                    Complete Address
                  </label>
                  {editingContact ? (
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3]"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  ) : (
                    <p className="text-gray-900" style={{ fontFamily: 'Raleway' }}>{profileData.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Raleway' }}>
                    Facebook Link
                  </label>
                  {editingContact ? (
                    <input
                      type="url"
                      value={profileData.facebook}
                      onChange={(e) => handleInputChange('facebook', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3]"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  ) : (
                    <p className="text-gray-900" style={{ fontFamily: 'Raleway' }}>{profileData.facebook}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Raleway' }}>
                    City/Province
                  </label>
                  {editingContact ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3]"
                        style={{ fontFamily: 'Raleway' }}
                      />
                      <input
                        type="text"
                        value={profileData.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                        placeholder="Province"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3]"
                        style={{ fontFamily: 'Raleway' }}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900" style={{ fontFamily: 'Raleway' }}>
                      {profileData.city}, {profileData.province}
                    </p>
                  )}
                </div>
              </div>

              {editingContact && (
                <div className="flex space-x-3 pt-6">
                  <button
                    onClick={handleContactUpdate}
                    disabled={loading}
                    className="bg-[#815FB3] hover:bg-[#6D4C9A] text-white font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Raleway' }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setEditingContact(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-6 rounded-full transition-colors"
                    style={{ fontFamily: 'Raleway' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Account Settings Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Raleway' }}>
                Account Settings
              </h3>

              <div className="space-y-4">
                <button className="flex items-center space-x-3 text-[#815FB3] hover:text-[#6D4C9A] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h3m-3 0h-3m-2-5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="font-semibold" style={{ fontFamily: 'Raleway' }}>
                    Change Password
                  </span>
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
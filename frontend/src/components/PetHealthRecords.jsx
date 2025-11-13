import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useConversations from '../hooks/useConversations';
import AddPetModal from './AddPetModal';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import LogoutModal from './LogoutModal';

const PetHealthRecords = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    animal_type: '',
    sex: '',
    age: ''
  });
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { token, logout } = useAuth();
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

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // Only add non-empty filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value);
        }
      });
      const response = await axios.get(
        `http://localhost:8000/api/pets/?${params}`,
        {
          headers: {
            'Authorization': token ? `Token ${token}` : '',
          }
        }
      );
      setPets(response.data || []);
      // Debug: Log each pet's image URL
      // No need to define 'pet' if not used
      // if (response.data && response.data.length > 0) {
      //   response.data.forEach(pet => {
      //     // console.log(`Pet ${pet.name} (${pet.animal_type}) - Image URL:`, pet.image);
      //     // console.log(`Pet ${pet.name} - Image exists:`, !!pet.image);
      //     // console.log(`Pet ${pet.name} - Full pet data:`, pet);
      //   });
      // }
    } catch (error) {
      // console.error('Error fetching pets:', error);
      if (error.response?.status === 401) {
        logout();
  navigate('/petowner/login');
      }
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [filters, token, logout, navigate]);

  useEffect(() => {
    fetchPets();
  }, [filters, fetchPets]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

    useEffect(() => {
      fetchPets();
    }, [fetchPets]);

  const handleCloseModal = () => {
    setShowAddPetModal(false);
  };

  const handlePetAdded = () => {
    fetchPets(); // Refresh the pets list
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
    <div className="min-h-screen bg-[#f0f1f1] flex">
      {/* Sidebar - direct child, flex layout */}
      <Sidebar
        sidebarVisible={sidebarVisible}
        currentPage="pet-health-records"
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        conversations={conversations}
        loadingConversations={loadingConversations}
        onLoadConversation={handleLoadConversation}
        onCreateNewConversation={handleCreateNewConversation}
        onPinConversation={handlePinConversation}
        onRenameConversation={handleRenameConversation}
        onArchiveConversation={handleArchiveConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main Content Area - flex-1 */}
      <div className="flex-1 flex flex-col bg-white h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-[#f0f1f1] border-b p-4 flex items-center justify-between">
          {/* Page Title */}
          <div className="flex items-center">
            <h2 className="text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
              Pet Health Records
            </h2>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-[14px] bg-[#f0f1f1]"
                style={{ fontFamily: 'Raleway', borderColor: '#888888' }}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
        </div>

        {/* Main Content - Pet Cards */}
        <div className="flex-1 overflow-y-auto bg-[#f0f1f1]" style={{ padding: '30px 60px' }}>
          {/* Filters */}
          <div className="bg-[#f0f1f1] rounded-lg p-3 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {/* Pet Name Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                value=""
                onChange={(e) => handleFilterChange('name', e.target.value)}
              >
                <option value="">All Pets</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.name}>{pet.name}</option>
                ))}
              </select>

              {/* Animal Type Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                value={filters.animal_type}
                onChange={(e) => handleFilterChange('animal_type', e.target.value)}
              >
                <option value="">All Animals</option>
                <option value="cat">Cat</option>
                <option value="dog">Dog</option>
                <option value="hamster">Hamster</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="fish">Fish</option>
              </select>

              {/* Sex Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                value={filters.sex}
                onChange={(e) => handleFilterChange('sex', e.target.value)}
              >
                <option value="">All Sex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>

              {/* Age Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                value={filters.age}
                onChange={(e) => handleFilterChange('age', e.target.value)}
              >
                <option value="">All Age</option>
                <option value="0-1">0-1 year</option>
                <option value="1-3">1-3 years</option>
                <option value="3-7">3-7 years</option>
                <option value="7+">7+ years</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 justify-items-center" style={{ padding: '30px 0', minHeight: '300px' }}>
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3]"></div>
              </div>
            ) : (
              pets.map((pet) => (
                <div 
                  key={pet.id} 
                  className="cursor-pointer hover:transform hover:scale-105 transition-all duration-300"
                  onClick={() => navigate(`/pet-profile/${pet.id}`)}
                  style={{
                    position: 'relative',
                    width: '256px',
                    height: '270px',
                    background: '#FFFFF2',
                    borderRadius: '11px'
                  }}
                >
                  {/* Pet Image Section */}
                  <div 
                    className="relative overflow-hidden"
                    style={{
                      position: 'absolute',
                      width: '256px',
                      height: '204px',
                      left: '0px',
                      top: '0px',
                      background: '#FFFFFF',
                      borderRadius: '9px 9px 0px 0px'
                    }}
                  >
                    {pet.image ? (
                      <img 
                        src={pet.image} 
                        alt={pet.name}
                        className="object-cover"
                        style={{
                          position: 'absolute',
                          width: '276px',
                          height: '204px',
                          left: 'calc(50% - 276px/2)',
                          top: 'calc(50% - 204px/2)',
                          borderRadius: '9px 9px 0px 0px'
                        }}
                        onLoad={() => console.log(`✅ Image loaded successfully for ${pet.name}:`, pet.image)}
                        onError={(e) => {
                          console.error(`❌ Image failed to load for ${pet.name}:`);
                          e.target.style.display = 'none';
                          e.target.parentNode.querySelector('.letter-fallback').style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Letter fallback */}
                    <span 
                      className="text-6xl letter-fallback flex items-center justify-center absolute inset-0" 
                      style={{ 
                        display: pet.image ? 'none' : 'flex',
                        background: '#f8f9fa',
                        color: '#815FB3',
                        fontWeight: 900,
                        fontFamily: 'Raleway',
                        fontSize: '96px'
                      }}
                    >
                      {pet.name ? pet.name.charAt(0).toUpperCase() : ''}
                    </span>

                    {/* Gradient Overlay */}
                    <div 
                      style={{
                        position: 'absolute',
                        width: '256px',
                        height: '134px',
                        left: '0px',
                        top: '70px',
                        background: 'linear-gradient(180deg, rgba(153, 144, 74, 0) -10.06%, rgba(204, 192, 98, 0.2) 39.94%, #F5E9B8 89.94%)'
                      }}
                    ></div>
                  </div>
                  
                  {/* Pet Name */}
                  <h3 
                    style={{
                      position: 'absolute',
                      width: '180px', // Increased width to allow wrapping
                      minHeight: '23px',
                      left: '14px',
                      top: '160px', // Move higher to avoid overlap if wrapped
                      fontFamily: 'Raleway',
                      fontStyle: 'normal',
                      fontWeight: '800',
                      fontSize: '22px',
                      lineHeight: '25px',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#000000',
                      wordBreak: 'break-word',
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {pet.name}, {pet.age}
                  </h3>
                  
                  {/* Animal Label */}
                  <span 
                    style={{
                      position: 'absolute',
                      width: '46px',
                      height: '17px',
                      left: '29px',
                      top: '215px',
                      fontFamily: 'Raleway',
                      fontStyle: 'normal',
                      fontWeight: '400',
                      fontSize: '13px',
                      lineHeight: '17px',
                      color: 'rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    Animal:
                  </span>
                  
                  {/* Animal Value */}
                  <span 
                    style={{
                      position: 'absolute',
                      width: '22px',
                      height: '17px',
                      left: '78px',
                      top: '215px',
                      fontFamily: 'Raleway',
                      fontStyle: 'normal',
                      fontWeight: '400',
                      fontSize: '13px',
                      lineHeight: '17px',
                      color: '#000000'
                    }}
                  >
                    {pet.animal_type}
                  </span>
                  
                  {/* Sex Label */}
                  <span 
                    style={{
                      position: 'absolute',
                      width: '28px',
                      height: '17px',
                      left: '142px',
                      top: '215px',
                      fontFamily: 'Raleway',
                      fontStyle: 'normal',
                      fontWeight: '400',
                      fontSize: '13px',
                      lineHeight: '17px',
                      color: 'rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    Sex:
                  </span>
                  
                  {/* Sex Value */}
                  <span 
                    style={{
                      position: 'absolute',
                      width: '31px',
                      height: '17px',
                      left: '175px',
                      top: '215px',
                      fontFamily: 'Raleway',
                      fontStyle: 'normal',
                      fontWeight: '400',
                      fontSize: '13px',
                      lineHeight: '17px',
                      color: '#000000'
                    }}
                  >
                    {pet.sex}
                  </span>
                  
                  {/* Breed Label */}
                  <span 
                    style={{
                      position: 'absolute',
                      width: '41px',
                      height: '17px',
                      left: '29px',
                      top: '237px',
                      fontFamily: 'Raleway',
                      fontStyle: 'normal',
                      fontWeight: '400',
                      fontSize: '13px',
                      lineHeight: '17px',
                      color: 'rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    Breed:
                  </span>
                  
                  {/* Breed Value */}
                  <span 
                    style={{
                      position: 'absolute',
                      width: '121px',
                      height: '17px',
                      left: '75px',
                      top: '237px',
                      fontFamily: 'Raleway',
                      fontStyle: 'normal',
                      fontWeight: '400',
                      fontSize: '13px',
                      lineHeight: '17px',
                      color: '#000000'
                    }}
                  >
                    {pet.breed || 'Mixed'}
                  </span>
                </div>
              ))
            )}
            
            {/* Add Pet Card */}
            <div 
              onClick={() => setShowAddPetModal(true)}
              className="cursor-pointer hover:transform hover:scale-105 transition-all duration-300"
              style={{
                position: 'relative',
                width: '256px',
                height: '270px',
                border: '2px solid #815FB3',
                borderRadius: '11px',
                background: 'transparent',
                boxSizing: 'border-box'
              }}
            >
              <div className="relative w-full h-full">
                <img 
                  src="/basil_add-solid.png" 
                  alt="Add Pet" 
                  className="absolute"
                  style={{
                    width: '96px',
                    height: '96px',
                    left: '80px',
                    top: '87px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modals are outside the main layout */}
        <AddPetModal
          isOpen={showAddPetModal}
          onClose={handleCloseModal}
          onPetAdded={handlePetAdded}
          token={token}
        />

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={handleLogoutCancel}
          onConfirm={handleLogoutConfirm}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default PetHealthRecords;

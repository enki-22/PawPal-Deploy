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
  // Responsive mobile sidebar overlay
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-[#f0f1f1] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block sticky top-0 h-screen z-30">
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
          isMobileOverlay={false}
        />
      </div>

      {/* --- MODIFIED BLOCK --- */}
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
            currentPage="pet-health-records"
            onToggleSidebar={() => setIsMobileSidebarOpen(false)}
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
      {/* --- END OF MODIFIED BLOCK --- */}

      {/* Main Content Area - flex-1 */}
      <div className="flex-1 flex flex-col bg-white h-screen w-full">
        {/* Header - Stationary - Responsive */}
        {/* Header - Mobile: logo, sidebar toggle, profile. Desktop: unchanged. */}
        <div className="border-b p-2 md:p-4 flex flex-row items-center justify-between gap-2 md:gap-0 sticky top-0 z-20 bg-[#DCCEF1] md:bg-[#f0f1f1]">
          {/* Mobile header */}
          <div className="flex items-center gap-2 md:hidden w-full justify-between">
            <div className="flex items-center gap-2">
              <img src="/pat-removebg-preview 2.png" alt="PawPal Logo" className="w-8 h-8" />
              <span className="font-bold text-lg text-[#815FB3]" style={{ fontFamily: 'Raleway' }}>PAWPAL</span>
              <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 ml-2" aria-label="Open sidebar">
                {/* Flipped sidebar-expand-icon.png to face right */}
                <img src="/sidebar-expand-icon.png" alt="Sidebar Toggle" className="w-6 h-6" style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-2 md:gap-4">
              <h2 className="text-[18px] md:text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                Pet Health Records
              </h2>
            </div>
            {/* Search Bar - Hidden on mobile, flex on desktop */}
            <div className="flex-1 w-full max-w-xs md:max-w-2xl mx-0 md:mx-8">
              <div className="relative w-full">
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
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
        </div>
        {/* Page name below header for mobile */}
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#f0f1f1' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            Pet Health Records
          </h2>
        </div>

        {/* Main Content - Pet Cards (Scrollable) */}
        <div className="flex-1 overflow-y-auto bg-[#f0f1f1] p-2 md:p-8">
          {/* Filters */}
          <div className="bg-[#f0f1f1] rounded-lg p-2 md:p-3 mb-4 md:mb-6">
            <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 justify-items-center py-4 md:py-8 min-h-[200px] md:min-h-[300px]">
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3]"></div>
              </div>
            ) : (
              pets.map((pet) => (
                <div 
                  key={pet.id} 
                  className="cursor-pointer hover:transform hover:scale-105 transition-all duration-300 w-full max-w-xs md:max-w-sm h-auto bg-[#FFFFF2] rounded-xl flex flex-col"
                  onClick={() => navigate(`/pet-profile/${pet.id}`)}
                  style={{ minHeight: '260px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
                >
                  {/* Pet Image Section */}
                  <div className="relative overflow-hidden w-full h-32 md:h-48 bg-white rounded-t-xl flex items-center justify-center">
                    {pet.image ? (
                      <img 
                        src={pet.image} 
                        alt={pet.name}
                        className="object-cover w-full h-full rounded-t-xl"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.querySelector('.letter-fallback').style.display = 'flex';
                        }}
                      />
                    ) : null}
                    {/* Letter fallback */}
                    <span 
                      className={`text-4xl md:text-6xl letter-fallback flex items-center justify-center absolute inset-0 bg-[#f8f9fa] text-[#815FB3] font-extrabold font-raleway ${pet.image ? 'hidden' : 'flex'}`}
                    >
                      {pet.name ? pet.name.charAt(0).toUpperCase() : ''}
                    </span>
                    {/* Gradient Overlay */}
                    <div 
                      className="absolute left-0 top-1/2 w-full h-1/2"
                      style={{ background: 'linear-gradient(180deg, rgba(153, 144, 74, 0) -10.06%, rgba(204, 192, 98, 0.2) 39.94%, #F5E9B8 89.94%)' }}
                    ></div>
                  </div>
                  {/* Pet Info Section - inside card */}
                  <div className="flex flex-col flex-1 px-4 py-3 md:px-6 md:py-4 justify-between">
                    <h3 className="font-raleway font-extrabold text-lg md:text-2xl text-black mb-1 break-words">
                      {pet.name}, {pet.age}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm text-black">
                      <span><span className="text-black/70">Animal:</span> {pet.animal_type}</span>
                      <span><span className="text-black/70">Sex:</span> {pet.sex}</span>
                      <span><span className="text-black/70">Breed:</span> {pet.breed || 'Mixed'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Add Pet Card */}
            <div 
              onClick={() => setShowAddPetModal(true)}
              className="cursor-pointer hover:transform hover:scale-105 transition-all duration-300 w-full max-w-xs md:max-w-sm h-auto border-2 border-[#815FB3] rounded-xl bg-transparent flex items-center justify-center min-h-[220px]"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src="/basil_add-solid.png" 
                  alt="Add Pet" 
                  className="w-20 h-20 md:w-24 md:h-24"
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

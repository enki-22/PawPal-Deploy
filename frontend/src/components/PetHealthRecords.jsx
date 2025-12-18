import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useConversations from '../hooks/useConversations';
import AddPetModal from './AddPetModal';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import LogoutModal from './LogoutModal';
import Skeleton from './common/Skeleton';

const PetHealthRecords = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    animal_type: '',
    sex: '',
    age: '',
    name: ''
  });
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  // Responsive mobile sidebar overlay
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = `${API_ROOT}/api`;
  
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
        if (!value) return;
        // Normalize to string
        const v = String(value).trim();
        if (!v) return;

        // Map age ranges to min_age/max_age query params
        if (key === 'age') {
          if (v === '0-1') {
            params.append('min_age', '0');
            params.append('max_age', '1');
          } else if (v === '1-3') {
            params.append('min_age', '1');
            params.append('max_age', '3');
          } else if (v === '3-7') {
            params.append('min_age', '3');
            params.append('max_age', '7');
          } else if (v === '7+') {
            params.append('min_age', '7');
          }
          return;
        }

        // If pet name was set, also set `search` so backend will match by name
        if (key === 'name') {
          params.append('search', v);
          return;
        }

        params.append(key, v);
      });
      const response = await axios.get(
        `${API_BASE_URL}/pets/?${params}`,
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
          <div
            className="flex items-center gap-2 md:hidden w-full justify-between"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              zIndex: 100,
              background: '#DCCEF1',
              padding: '0.5rem 1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div className="flex items-center gap-2">
              <img src="/pat-removebg-preview 1.png" alt="PawPal Logo" className="w-8 h-8" />
              <span className="font-bold text-lg text-[#815FB3]" style={{ fontFamily: 'Raleway' }}>PAWPAL</span>
              <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 ml-2" aria-label="Open sidebar">
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
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#f0f1f1', paddingTop: '56px' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            Pet Health Records
          </h2>
        </div>

        {/* Main Content - Pet Cards (Scrollable) */}
        <div className="flex-1 overflow-y-auto bg-[#f0f1f1] p-2 md:p-8" style={{ paddingTop: '20px' }}>
          {/* Filters */}
          <div className="bg-[#f0f1f1] rounded-lg p-2 md:p-3 mb-4 md:mb-6">
            <div className="flex flex-nowrap gap-1 md:gap-4 items-center justify-center px-0 md:px-2">
              {/* Pet Name Filter */}
                  <select
                className="px-1 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3] md:px-1 md:py-2 md:text-base md:rounded-lg"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                    value={filters.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      // set both name and search so backend filters by name
                      setFilters(prev => ({ ...prev, name: v, search: v }));
                    }}
              >
                <option value="">All Pets</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.name}>{pet.name}</option>
                ))}
              </select>

              {/* Animal Type Filter */}
              <select
                className="px-1 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3] md:px-1 md:py-2 md:text-base md:rounded-lg"
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
                className="px-1 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3] md:px-1 md:py-2 md:text-base md:rounded-lg"
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
                className="px-1 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3] md:px-1 md:py-2 md:text-base md:rounded-lg"
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 justify-items-center py-4 md:py-8 min-h-[200px] md:min-h-[300px]">
            {loading ? (
              // MODERN SKELETON LOADING STATE
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="w-40 md:w-60 h-[230px] md:h-[260px] bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
                  <Skeleton className="w-full h-28 md:h-48 rounded-lg" />
                  <Skeleton className="w-3/4 h-6" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="w-1/3 h-4" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                </div>
              ))
            ) : (
              pets.map((pet) => (
                <div 
                  key={pet.id} 
                  className="cursor-pointer hover:transform hover:scale-105 transition-all duration-200 w-40 md:w-60 h-auto bg-[#FFFFF2] rounded-xl flex flex-col min-h-[230px] md:min-h-[260px]"
                  onClick={() => navigate(`/pet-profile/${pet.id}`)}
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}
                >
                  {/* Pet Image Section */}
                  <div className="relative overflow-hidden w-full h-28 md:h-48 bg-white rounded-t-xl flex items-center justify-center">
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
                  {/* Changed justify-between to justify-start (for mobile) and added gap-2 */}
                  <div className="flex flex-col flex-1 px-2 py-3 md:px-6 md:py-4 justify-start gap-2 md:justify-between md:gap-0">
                    {/* Added capitalize to name as well for consistency */}
                    <h3 className="font-raleway font-extrabold text-base md:text-2xl text-black mb-1 break-words capitalize">
                      {pet.name}, {pet.age}
                    </h3>
                    {/* MODIFIED: Added 'capitalize' class here to fix Species and Sex casing */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs md:text-sm text-black capitalize">
                      <span><span className="text-black/70">Animal:</span> {pet.animal_type}</span>
                      <span><span className="text-black/70">Sex:</span> {pet.sex}</span>
                      <span><span className="text-black/70">Breed:</span> {pet.breed || 'Mixed'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Add Pet Card - MODERNIZED */}
            <div 
              onClick={() => setShowAddPetModal(true)}
              // CHANGED: bg-white/30 (transparent), border-dashed, border-2, hover effect
              className="cursor-pointer group hover:-translate-y-1 transition-all duration-300 w-40 md:w-60 h-auto border-2 border-dashed border-[#815FB3] bg-white/30 hover:bg-purple-50 rounded-xl flex flex-col items-center justify-center min-h-[230px] md:min-h-[260px] gap-3"
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-purple-100 rounded-full group-hover:bg-[#815FB3] transition-colors duration-300">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-[#815FB3] group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                 </svg>
              </div>
              <span className="font-raleway font-bold text-[#815FB3] text-sm md:text-base group-hover:text-[#6D4C9A]">
                Add New Pet
              </span>
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

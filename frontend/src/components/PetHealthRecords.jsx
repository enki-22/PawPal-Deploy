import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useConversations from '../hooks/useConversations';
import AddPetModal from './AddPetModal';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';

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

  const fetchPets = async () => {
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
      console.log('Pets fetched:', response.data);
      // Debug: Log each pet's image URL
      if (response.data && response.data.length > 0) {
        response.data.forEach(pet => {
          console.log(`Pet ${pet.name} (${pet.animal_type}) - Image URL:`, pet.image);
          console.log(`Pet ${pet.name} - Image exists:`, !!pet.image);
          console.log(`Pet ${pet.name} - Full pet data:`, pet);
        });
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAddPet = () => {
    setShowAddPetModal(true);
  };

  const handleCloseModal = () => {
    setShowAddPetModal(false);
  };

  const handlePetAdded = () => {
    fetchPets(); // Refresh the pets list
  };

  const getAnimalEmoji = (animalType) => {
    const emojis = {
      'cat': '🐱',
      'dog': '🐕',
      'hamster': '🐹',
      'bird': '🐦',
      'rabbit': '🐰',
      'fish': '🐠'
    };
    return emojis[animalType?.toLowerCase()] || '🐾';
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f1f1' }}>
      {/* Left Sidebar */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
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
            <ProfileButton />
          </div>
        </div>

        {/* Main Content - Pet Cards */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#f0f1f1]">
          {/* Filters */}
          <div className="bg-[#f0f1f1] rounded-lg p-3 mb-3">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {/* Pet Name Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                value=""
                onChange={(e) => handleFilterChange('name', e.target.value)}
              >
                <option value="">Pet Name</option>
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
                <option value="">Animal Type</option>
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
                <option value="">Sex</option>
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
                <option value="">Age</option>
                <option value="0-1">0-1 year</option>
                <option value="1-3">1-3 years</option>
                <option value="3-7">3-7 years</option>
                <option value="7+">7+ years</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3]"></div>
              </div>
            ) : (
              pets.map((pet) => (
                <div 
                  key={pet.id} 
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/pet-profile/${pet.id}`)}
                >
                  {/* Pet Image - Top Section without gradient */}
                  <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                    {pet.image ? (
                      <img 
                        src={pet.image} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onLoad={() => console.log(`✅ Image loaded successfully for ${pet.name}:`, pet.image)}
                        onError={(e) => {
                          console.error(`❌ Image failed to load for ${pet.name}:`);
                          console.error('  - Pet animal_type:', pet.animal_type);
                          console.error('  - Image URL:', pet.image);
                          console.error('  - Error src:', e.target.src);
                          console.error('  - Error event:', e);
                          e.target.style.display = 'none';
                          e.target.parentNode.querySelector('.emoji-fallback').style.display = 'flex';
                        }}
                      />
                    ) : (
                      console.log(`⚠️ No image URL for ${pet.name} (${pet.animal_type})`)
                    )}
                    <span 
                      className="text-6xl emoji-fallback" 
                      style={{ display: pet.image ? 'none' : 'flex' }}
                    >
                      {getAnimalEmoji(pet.animal_type)}
                    </span>
                  </div>
                  
                  {/* Pet Details - Bottom Section with custom background color */}
                  <div className="p-4" style={{ backgroundColor: '#fefef2' }}>
                    {/* Pet Name and Age */}
                    <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: 'Raleway' }}>
                      {pet.name}, {pet.age}
                    </h3>
                    
                    {/* Pet Details - Compact layout */}
                    <div className="space-y-1">
                      {/* Row 1: Animal and Sex - side by side but not stretched */}
                      <div className="flex items-center gap-6">
                        <span className="text-gray-600 text-sm" style={{ fontFamily: 'Raleway' }}>
                          Animal: <span className="text-gray-900">{pet.animal_type}</span>
                        </span>
                        <span className="text-gray-600 text-sm" style={{ fontFamily: 'Raleway' }}>
                          Sex: <span className="font-bold text-gray-900">{pet.sex}</span>
                        </span>
                      </div>
                      
                      {/* Row 2: Breed */}
                      <div>
                        <span className="text-gray-600 text-sm" style={{ fontFamily: 'Raleway' }}>
                          Breed: <span className="font-bold text-gray-900">{pet.breed || 'Mixed'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Add Pet Card */}
            <div 
              onClick={handleAddPet}
              className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-[#815FB3] transition-colors cursor-pointer group min-h-[280px]"
            >
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-[#815FB3] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#6d4a96] transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1" style={{ fontFamily: 'Raleway' }}>Add New Pet</h3>
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>Create a health record for your pet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Pet Modal */}
      <AddPetModal
        isOpen={showAddPetModal}
        onClose={handleCloseModal}
        onPetAdded={handlePetAdded}
        token={token}
      />
    </div>
  );
};

export default PetHealthRecords;

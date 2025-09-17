import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import useConversations from '../hooks/useConversations';

const PetProfile = () => {
  const [pet, setPet] = useState(null);
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const { petId } = useParams();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  
  // Use conversations hook
  const {
    conversations,
    loadingConversations,
    handleLoadConversation,
    handleCreateNewConversation,
    handlePinConversation
  } = useConversations();

  const fetchAllPets = async () => {
    try {
      console.log('Fetching all pets...');
      const response = await axios.get(
        'http://localhost:8000/api/pets/',
        {
          headers: {
            'Authorization': token ? `Token ${token}` : '',
          }
        }
      );
      console.log('All pets response:', response.data);
      setAllPets(response.data || []);
    } catch (error) {
      console.error('Error fetching all pets:', error);
    }
  };

  const fetchPetDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching pet details for petId:', petId);
      const response = await axios.get(
        `http://localhost:8000/api/pets/${petId}/`,
        {
          headers: {
            'Authorization': token ? `Token ${token}` : '',
          }
        }
      );
      console.log('Pet details response:', response.data);
      setPet(response.data);
    } catch (error) {
      console.error('Error fetching pet details:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
      // Don't set pet to null here, let it remain null to show "Pet not found"
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPets();
    fetchPetDetails();
  }, [petId]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSpeciesEmoji = (species) => {
    const emojis = {
      cat: '🐱',
      dog: '🐶',
      hamster: '🐹',
      rabbit: '🐰',
      bird: '🐦',
      fish: '🐠',
      other: '🐾'
    };
    return emojis[species] || '🐾';
  };

  const handlePetSelect = (selectedPetId) => {
    console.log('Handle pet select called with:', selectedPetId);
    console.log('Current petId from URL:', petId);
    if (selectedPetId !== petId) {
      console.log('Navigating to pet profile:', selectedPetId);
      navigate(`/pet-profile/${selectedPetId}`);
    }
  };

  const parseMedicalNotes = (notes) => {
    if (!notes) return {};
    
    const lines = notes.split('\n');
    const parsed = {};
    
    lines.forEach(line => {
      if (line.includes('Blood Type:')) {
        parsed.bloodType = line.split('Blood Type:')[1]?.trim() || 'Unknown';
      } else if (line.includes('Allergies:')) {
        parsed.allergies = line.split('Allergies:')[1]?.trim() || 'None';
      } else if (line.includes('Chronic Disease:')) {
        parsed.chronicDisease = line.split('Chronic Disease:')[1]?.trim() || 'None';
      } else if (line.includes('Spayed/Neutered:')) {
        parsed.spayedNeutered = line.split('Spayed/Neutered:')[1]?.trim() || 'No';
      }
    });
    
    return parsed;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#D8CAED] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3]"></div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-[#D8CAED] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pet not found</h2>
          <button 
            onClick={() => navigate('/pet-health-records')}
            className="bg-[#815FB3] text-white px-6 py-2 rounded-lg hover:bg-[#6d4a96] transition-colors"
          >
            Back to Pet Records
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex">
      {/* Left Sidebar */}
      <Sidebar 
        sidebarVisible={sidebarVisible}
        currentPage="pet-profile" 
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        conversations={conversations}
        loadingConversations={loadingConversations}
        onLoadConversation={handleLoadConversation}
        onCreateNewConversation={handleCreateNewConversation}
        onPinConversation={handlePinConversation}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white border-b p-4 flex items-center justify-between">
          {/* Left side - Title */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/pet-health-records')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to Pet Health Records"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
              Pet Health Records
            </h2>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search pets..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3]"
                style={{ fontFamily: 'Raleway' }}
              />
            </div>
          </div>

          {/* Right side - User Profile */}
          <div className="flex items-center space-x-4">
            <ProfileButton />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#f0f1f1] flex">
          {/* Pet Details Section - Left Side */}
          <div className="w-2/3 pr-6">
            {pet && (
              <>
                {/* Horizontal Pet Selector */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                      Select Pet
                    </h3>
                  </div>
                
                <div className="flex space-x-4 overflow-x-auto pb-2">
                  {allPets.map((petItem) => (
                    <div
                      key={petItem.id}
                      onClick={() => handlePetSelect(petItem.id.toString())}
                      className={`flex-shrink-0 w-24 cursor-pointer transition-all ${
                        petItem.id.toString() === petId 
                          ? 'opacity-100 transform scale-105' 
                          : 'opacity-70 hover:opacity-90'
                      }`}
                    >
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 mx-auto ${
                        petItem.id.toString() === petId 
                          ? 'bg-[#815FB3] ring-4 ring-[#815FB3] ring-opacity-30' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}>
                        {petItem.image ? (
                          <img 
                            src={petItem.image} 
                            alt={petItem.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className={`text-2xl ${
                            petItem.id.toString() === petId ? 'text-white' : 'text-gray-600'
                          }`}>
                            {getSpeciesEmoji(petItem.animal_type)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs text-center font-medium truncate ${
                        petItem.id.toString() === petId ? 'text-[#815FB3]' : 'text-gray-600'
                      }`} style={{ fontFamily: 'Raleway' }}>
                        {petItem.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Pet Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Large Pet Photo Header with rounded corners */}
                <div className="relative">
                  <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {pet.image ? (
                      <img 
                        src={pet.image} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-8xl mb-4">{getSpeciesEmoji(pet.animal_type)}</div>
                        <p className="text-gray-500 text-lg" style={{ fontFamily: 'Raleway' }}>
                          No photo available
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Pet Name and Edit button overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'Raleway' }}>
                          {pet.name}
                        </h1>
                        <p className="text-xl text-white/90" style={{ fontFamily: 'Raleway' }}>
                          {pet.breed || 'Mixed Breed'}
                        </p>
                      </div>
                      <button className="p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-colors group">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pet Information Section */}
                <div className="p-8">
                  {/* Quick Info Row */}
                  <div className="flex items-center space-x-12 mb-8 pb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#815FB3] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Raleway' }}>Species</p>
                        <p className="text-lg font-bold capitalize" style={{ fontFamily: 'Raleway' }}>
                          {pet.animal_type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#815FB3] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Raleway' }}>Sex</p>
                        <p className="text-lg font-bold capitalize" style={{ fontFamily: 'Raleway' }}>
                          {pet.sex}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#815FB3] rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.89-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.11-.9-2-2-2zm0 16H5V9h14v11z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Raleway' }}>Age</p>
                        <p className="text-lg font-bold" style={{ fontFamily: 'Raleway' }}>
                          {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information Section */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Raleway' }}>
                      Medical Information
                    </h2>
                    
                    {(() => {
                      const medicalData = parseMedicalNotes(pet.medical_notes);
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4 py-3">
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-medium text-black" style={{ fontFamily: 'Raleway' }}>
                                Blood Type
                              </p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-black" style={{ fontFamily: 'Raleway' }}>
                                {medicalData.bloodType || 'Type A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 py-3">
                            <div className="w-10 h-10 bg-[#815FB3] rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-medium text-black" style={{ fontFamily: 'Raleway' }}>
                                Spayed/Neutered
                              </p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-black" style={{ fontFamily: 'Raleway' }}>
                                {medicalData.spayedNeutered || 'No'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 py-3">
                            <div className="w-10 h-10 bg-[#815FB3] rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-medium text-black" style={{ fontFamily: 'Raleway' }}>
                                Allergies
                              </p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-black" style={{ fontFamily: 'Raleway' }}>
                                {medicalData.allergies || 'Flea Allergy Dermatitis'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 py-3">
                            <div className="w-10 h-10 bg-[#815FB3] rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-medium text-black" style={{ fontFamily: 'Raleway' }}>
                                Chronic Disease
                              </p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-black" style={{ fontFamily: 'Raleway' }}>
                                {medicalData.chronicDisease || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Files Section */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Raleway' }}>
                      Files
                    </h2>
                    
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg" style={{ fontFamily: 'Raleway' }}>
                        There are no files yet
                      </p>
                    </div>
                  </div>

                  {/* Download Medical Information Section */}
                  <div className="bg-[#FFF07B] rounded-lg p-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Raleway' }}>
                      Download Medical Information
                    </h3>
                    <p className="text-gray-700 mb-6" style={{ fontFamily: 'Raleway' }}>
                      Get a complete PDF report of {pet.name}&apos;s medical information and files
                    </p>
                    <button className="bg-[#E6D45B] hover:bg-[#D4C34A] text-black font-bold py-4 px-12 rounded-full text-lg transition-colors shadow-md transform hover:scale-105" style={{ fontFamily: 'Raleway' }}>
                      Download
                    </button>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>

          {/* Extended Pet Profile Section - Right Side (Placeholder) */}
          <div className="w-1/3 pl-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Raleway' }}>
                Extended Profile
              </h3>
              <p className="text-gray-500" style={{ fontFamily: 'Raleway' }}>
                Extended pet information will go here
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetProfile;

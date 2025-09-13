import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const PetProfile = () => {
  const [pet, setPet] = useState(null);
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { petId } = useParams();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownVisible && !event.target.closest('.dropdown-container')) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownVisible]);

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
            <span className="text-[14px] text-gray-600" style={{ fontFamily: 'Raleway' }}>
              {user?.username}
            </span>
            <div className="relative dropdown-container">
              <button
                onClick={() => setDropdownVisible(!dropdownVisible)}
                className="w-10 h-10 bg-[#815FB3] rounded-full flex items-center justify-center hover:bg-[#6d4a96] transition-colors"
              >
                <span className="text-white text-lg font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
              
              {/* Dropdown Menu */}
              {dropdownVisible && (
                <div className="absolute right-0 top-12 bg-[#FFF4C9] rounded-xl shadow-lg py-3 min-w-56 z-50">
                  <div className="px-5 py-3 border-b border-[#F0E68C]">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[#815FB3] rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">
                          {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-black font-semibold text-[18px]" style={{ fontFamily: 'Raleway' }}>
                        {user?.username || 'User'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <button className="w-full text-left px-5 py-3 hover:bg-[#F0E68C] transition-colors flex items-center space-x-4 text-[#815FB3]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[16px] font-medium" style={{ fontFamily: 'Raleway' }}>Settings</span>
                    </button>
                    
                    <button className="w-full text-left px-5 py-3 hover:bg-[#F0E68C] transition-colors flex items-center space-x-4 text-[#815FB3]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[16px] font-medium" style={{ fontFamily: 'Raleway' }}>Terms & Policy</span>
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-5 py-3 hover:bg-[#F0E68C] transition-colors flex items-center space-x-4 text-[#815FB3]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-[16px] font-medium" style={{ fontFamily: 'Raleway' }}>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#f0f1f1]">
          {/* Pet Details Section */}
          {pet && (
            <div className="max-w-4xl mx-auto">
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
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Large Pet Photo Header */}
                <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
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

                {/* Pet Information Section */}
                <div className="p-8">
                  {/* Pet Name and Breed */}
                  <div className="mb-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                        {pet.name}
                      </h1>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xl text-gray-600" style={{ fontFamily: 'Raleway' }}>
                      {pet.breed || 'Mixed Breed'}
                    </p>
                  </div>

                  {/* Quick Info Row */}
                  <div className="flex items-center space-x-8 mb-8 pb-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#815FB3] bg-opacity-10 rounded-full flex items-center justify-center">
                        <span className="text-xl">🐾</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Raleway' }}>Species</p>
                        <p className="text-lg font-semibold capitalize" style={{ fontFamily: 'Raleway' }}>
                          {pet.animal_type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#815FB3] bg-opacity-10 rounded-full flex items-center justify-center">
                        <span className="text-xl">💙</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Raleway' }}>Sex</p>
                        <p className="text-lg font-semibold capitalize" style={{ fontFamily: 'Raleway' }}>
                          {pet.sex}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#815FB3] bg-opacity-10 rounded-full flex items-center justify-center">
                        <span className="text-xl">📅</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Raleway' }}>Age</p>
                        <p className="text-lg font-semibold" style={{ fontFamily: 'Raleway' }}>
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
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0v-.5A1.5 1.5 0 0114.5 6c.526 0 .988-.27 1.256-.679a6.012 6.012 0 011.912 2.706A8.037 8.037 0 0117 10.5a7.002 7.002 0 01-14 0c0-.863.154-1.695.332-2.473z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-medium" style={{ fontFamily: 'Raleway' }}>
                                Blood type: <span className="text-gray-700">{medicalData.bloodType || 'Type A'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 py-3">
                            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-medium" style={{ fontFamily: 'Raleway' }}>
                                Spayed/Neutered: <span className="text-gray-700">{medicalData.spayedNeutered || 'No'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 py-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-medium" style={{ fontFamily: 'Raleway' }}>
                                Allergies: <span className="font-bold text-gray-900">{medicalData.allergies || 'Flea Allergy Dermatitis'}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 py-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-medium" style={{ fontFamily: 'Raleway' }}>
                                Chronic Disease: <span className="text-gray-700">{medicalData.chronicDisease || 'N/A'}</span>
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
                    
                    <div className="space-y-3">
                      {pet.medical_files && pet.medical_files.length > 0 ? (
                        pet.medical_files.map((file, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                                {file.name}
                              </p>
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                                {file.created_at || 'Unknown date'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                                {file.file_size_display || '225 kb'}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                                Blood Test - 060225.pdf
                              </p>
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                                June 2, 2025
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                                225 kb
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                                Surgery - 082524.pdf
                              </p>
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                                August 25, 2024
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                                225 kb
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                                Vaccination Record.pdf
                              </p>
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                                March 15, 2024
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                                180 kb
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Download Medical Information Section */}
                  <div className="bg-[#FFF07B] rounded-lg p-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Raleway' }}>
                      Download Medical Information
                    </h3>
                    <p className="text-gray-700 mb-6" style={{ fontFamily: 'Raleway' }}>
                      Get a complete PDF report of {pet.name}'s medical information and files
                    </p>
                    <button className="bg-[#E6D45B] hover:bg-[#D4C34A] text-black font-bold py-4 px-12 rounded-full text-lg transition-colors shadow-md transform hover:scale-105" style={{ fontFamily: 'Raleway' }}>
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetProfile;

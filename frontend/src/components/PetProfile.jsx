import React, { useEffect, useState } from 'react';
import AddVaccinationRecordModal from './AddVaccinationRecordModal';
import AddMedicalRecordModal from './AddMedicalRecordModal';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import Modal from './LogoutModal';
import AddPetModal from './AddPetModal';
import { useAuth } from '../context/AuthContext';
import useConversations from '../hooks/useConversations';
import MedicalRecordDetailsModal from './MedicalRecordDetailsModal';
import VaccinationRecordDetailsModal from './VaccinationRecordDetailsModal';

const PetProfile = () => {
  const [showVaccinationRecordModal, setShowVaccinationRecordModal] = useState(false);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [pet, setPet] = useState(null);
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [petSwitchLoading, setPetSwitchLoading] = useState(false); // Separate loading for pet switching
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null); // Add state for current pet ID
  const [showAddPetModal, setShowAddPetModal] = useState(false); // Modal state for AddPetModal
  const [medicalRecords, setMedicalRecords] = useState(() => {
    const saved = localStorage.getItem('medicalRecords');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Vaccination details modal state
  const [selectedVaccinationRecord, setSelectedVaccinationRecord] = useState(null);
  const [showVaccinationDetailsModal, setShowVaccinationDetailsModal] = useState(false);
  const [vaccinationRecords, setVaccinationRecords] = useState(() => {
    const saved = localStorage.getItem('vaccinationRecords');
    return saved ? JSON.parse(saved) : [];
  });
  const { petId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // Use conversations hook for sidebar chat functionality
  const {
    conversations,
    loadingConversations,
    handleLoadConversation,
    handleCreateNewConversation,
    handlePinConversation,
    handleRenameConversation,
    handleArchiveConversation,
    handleDeleteConversation,
  } = useConversations();

  const mockFiles = [
    // Temporarily empty to show empty state - uncomment below for data
    // { id: 1, name: 'Blood Test - 060225.pdf', size: '225 kb' },
    // { id: 2, name: 'Surgery - 082624.pdf', size: '225 kb' },
    // { id: 3, name: 'Surgery - 082624.pdf', size: '225 kb' }
  ];

  // Fetch all pets
  const fetchAllPets = React.useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/pets/', {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        },
      });
      setAllPets(response.data || []);
    } catch (error) {
      setAllPets([]);
    }
  }, [token]);

  // Fetch pet details by petId
  const fetchPetDetails = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/pets/${petId}/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        },
      });
      setPet(response.data);
    } catch (error) {
      setPet(null);
    } finally {
      setLoading(false);
    }
  }, [petId, token]);

  useEffect(() => {
    fetchPetDetails();
    fetchAllPets();
    // Set initial current pet ID from URL parameter
    setCurrentPetId(parseInt(petId));
  }, [petId, token, fetchAllPets, fetchPetDetails]);

  const getSpeciesEmoji = (species) => {
    switch (species?.toLowerCase()) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      default: return '🐾';
    }
  };

  const handlePetSelect = (selectedPetId) => {
    if (selectedPetId !== currentPetId) {
      // Update URL without page reload
      window.history.pushState(null, '', `/pet-profile/${selectedPetId}`);
      
      // Update current pet ID state immediately for instant UI feedback
      setCurrentPetId(selectedPetId);
      
      // Find the selected pet data from allPets and set it immediately
      const selectedPet = allPets.find(p => p.id === selectedPetId);
      if (selectedPet) {
        setPet(selectedPet);
      }
      
      // Fetch detailed pet data in background without showing loading state
      fetchPetDetailsByIdDirectly(selectedPetId);
    }
  };

  // Helper function to fetch pet details silently in background
  const fetchPetDetailsByIdDirectly = async (petIdToFetch) => {
    try {
      setPetSwitchLoading(true);
      const response = await axios.get(`http://localhost:8000/api/pets/${petIdToFetch}/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        },
      });
      // Only update pet data if this is still the selected pet
      if (petIdToFetch === currentPetId) {
        setPet(response.data);
      }
    } catch (error) {
      console.error('Error fetching detailed pet data:', error);
      // Don't show error to user, keep the basic pet data from allPets
    } finally {
      setPetSwitchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pet Not Found</h2>
          <p className="text-gray-600 mb-4">The pet you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => navigate('/pet-health-records')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Pet Health Records
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F0F0F0]">
      {/* AddPetModal - overlays everything including header */}
      <AddPetModal
        isOpen={showAddPetModal}
        onClose={() => setShowAddPetModal(false)}
        onPetAdded={() => {
          setShowAddPetModal(false);
          fetchAllPets();
        }}
        token={token}
      />

      {/* Sidebar (sticky, stationary while content scrolls) */}
      <div className="h-screen sticky top-0 flex-shrink-0 z-50">
        <Sidebar
          sidebarVisible={sidebarVisible}
          currentPage="pet-profile"
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between bg-[#F0F0F0]">
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
          <div className="flex items-center space-x-4">
            <ProfileButton onLogoutClick={() => setShowLogoutModal(true)} />
          </div>
        </div>

        {/* Pet Navigation - UPDATED with larger icons */}
  <div className="pt-6 px-6 pb-6">
          <div className="flex items-center space-x-6">
            {/* Add Pet Button - LARGER */}
            <button 
              onClick={() => setShowAddPetModal(true)}
              className="flex-shrink-0 transition-all duration-300 ease-in-out hover:transform hover:scale-105"
              style={{
                width: '80px',
                height: '80px',
                background: '#FFF4C9',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Add Pet"
            >
              <span 
                className="font-bold text-gray-600"
                style={{ 
                  fontSize: '32px',
                  fontWeight: '900'
                }}
              >
                +
              </span>
            </button>
            
            {/* Vertical Separator Line - TALLER */}
            <div className="w-px h-20 bg-gray-400"></div>
            
            {/* Pet Selection - LARGER icons */}
            <div className="flex items-center space-x-4">
              {allPets.map((petItem) => {
                const isSelected = petItem.id === currentPetId; // Use currentPetId instead of petId
                return (
                  <div
                    key={petItem.id}
                    onClick={() => handlePetSelect(petItem.id)}
                    className="cursor-pointer transition-all duration-300 ease-in-out hover:transform hover:scale-105"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isSelected ? '#FFF4C9' : 'transparent',
                      borderRadius: isSelected ? '40px' : '50%',  // Increased border radius
                      padding: isSelected ? '12px 24px 12px 12px' : '0',  // Increased padding
                      minWidth: isSelected ? '200px' : '80px',  // Increased from 140px/48px
                      height: '80px',  // Increased from 48px
                      overflow: 'hidden',
                    }}
                  >
                    {/* Pet Image Circle - LARGER */}
                    <div 
                      className="bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{
                        width: '56px',  // Increased from 32px
                        height: '56px'  // Increased from 32px
                      }}
                    >
                      {petItem.image_url || petItem.image ? (
                        <img 
                          src={petItem.image_url || petItem.image} 
                          alt={petItem.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span style={{ fontSize: '28px' }}>  {/* Increased from 14px */}
                          {getSpeciesEmoji(petItem.species)}
                        </span>
                      )}
                    </div>
                    
                    {/* Pet Name - Only visible when selected */}
                    <span 
                      className={`ml-4 font-bold text-gray-900 whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isSelected ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4'
                      }`}
                      style={{
                        fontFamily: 'Raleway',
                        fontSize: '18px',  // Increased from 14px
                        display: isSelected ? 'block' : 'none',
                      }}
                    >
                      {petItem.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 px-6 pb-6">
          {/* AddPetModal - Centered, overlay, blur */}
          <AddPetModal
            isOpen={showAddPetModal}
            onClose={() => setShowAddPetModal(false)}
            onPetAdded={() => {
              setShowAddPetModal(false);
              fetchAllPets(); // Refresh pets after adding
            }}
            token={token}
          />
          {/* Add subtle loading indicator only for the content area during pet switching */}
          <div className={`transition-opacity duration-200 ${petSwitchLoading ? 'opacity-50' : 'opacity-100'}`}> 
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Pet Info */}
              <div className="space-y-6">
              {/* Pet Profile Card - Redesigned to match Pasted Image 1 */}
              <div 
                className="rounded-lg overflow-hidden"
                style={{ 
                  backgroundColor: '#FFFFF2',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
                }}
              >
                {/* Pet Image with Gradient Overlay and Text */}
                <div className="relative" style={{ height: '320px' }}>
                  {pet.image_url || pet.image ? (
                    <img 
                      src={pet.image_url || pet.image} 
                      alt={pet.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-6xl"
                      style={{ backgroundColor: '#E5E7EB' }}
                    >
                      {getSpeciesEmoji(pet.species)}
                    </div>
                  )}
                  
                  {/* Dark Gradient Overlay */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
                    }}
                  ></div>
                  
                  {/* Pet Name and Breed Text Overlay */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <h1 
                        className="text-white font-bold"
                        style={{ 
                          fontFamily: 'Raleway',
                          fontSize: '28px',
                          lineHeight: '32px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        {pet.name}
                      </h1>
                      <button className="text-white hover:text-gray-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p 
                      className="text-white"
                      style={{ 
                        fontFamily: 'Raleway',
                        fontSize: '16px',
                        lineHeight: '19px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {pet.breed || 'Domestic Shorthair'}
                    </p>
                  </div>
                </div>

                {/* Pet Basic Info Section - 3 Column Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {/* Species */}
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        <img 
                          src="/mdi_paw.png" 
                          alt="Species" 
                          className="w-[35px] h-[35px]"
                          style={{ filter: 'none', color: '#815FB3' }}
                        />
                      </div>
                      <p 
                        className="text-gray-600 mb-1"
                        style={{ 
                          fontFamily: 'Raleway',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        Species
                      </p>
                      <p 
                        className="text-gray-900 font-bold"
                        style={{ 
                          fontFamily: 'Raleway',
                          fontSize: '14px'
                        }}
                      >
                        {pet.animal_type ? pet.animal_type.charAt(0).toUpperCase() + pet.animal_type.slice(1) : 'N/A'}
                      </p>
                    </div>

                    {/* Sex */}
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        <img 
                          src="/solar_health-bold.png" 
                          alt="Sex" 
                          className="w-[35px] h-[35px]"
                          style={{ filter: 'none', color: '#815FB3' }}
                        />
                      </div>
                      <p 
                        className="text-gray-600 mb-1"
                        style={{ 
                          fontFamily: 'Raleway',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        Sex
                      </p>
                      <p 
                        className="text-gray-900 font-bold"
                        style={{ 
                          fontFamily: 'Raleway',
                          fontSize: '14px'
                        }}
                      >
                        {pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : 'N/A'}
                      </p>
                    </div>

                    {/* Age */}
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        <img 
                          src="/mage_calendar-fill.png" 
                          alt="Age" 
                          className="w-[35px] h-[35px]"
                          style={{ filter: 'none', color: '#815FB3' }}
                        />
                      </div>
                      <p 
                        className="text-gray-600 mb-1"
                        style={{ 
                          fontFamily: 'Raleway',
                          fontSize: '12px',
                          fontWeight: 500
                        }}
                      >
                        Age
                      </p>
                      <p 
                        className="text-gray-900 font-bold"
                        style={{ 
                          fontFamily: 'Raleway',
                          fontSize: '14px'
                        }}
                      >
                        {typeof pet.age !== 'undefined' ? `${pet.age} years old` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Medical Information Section - Two Column Layout */}
                  <div>
                    <h3 
                      className="text-gray-900 mb-6"
                      style={{ 
                        fontFamily: 'Raleway',
                        fontSize: '20px',
                        fontWeight: 600,
                        lineHeight: '23px'
                      }}
                    >
                      Medical Information
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Blood Type */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src="/healthicons_blood-drop-24px.png" 
                            alt="Blood Type" 
                            className="w-6 h-6"
                            style={{ filter: 'none', color: '#34113F' }}
                          />
                          <span 
                            className="text-gray-700"
                            style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500 }}
                          >
                            Blood Type
                          </span>
                        </div>
                        <span 
                          className="text-gray-900 font-semibold"
                          style={{ fontFamily: 'Raleway', fontSize: '14px' }}
                        >
                          {pet.blood_type ? pet.blood_type : (pet.medical_notes && pet.medical_notes.match(/Blood Type: ([^\n]+)/)?.[1]) || 'N/A'}
                        </span>
                      </div>
                      {/* Spayed/Neutered */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src="/mynaui_heart-x-solid.png" 
                            alt="Spayed/Neutered" 
                            className="w-6 h-6"
                            style={{ filter: 'none', color: '#34113F' }}
                          />
                          <span 
                            className="text-gray-700"
                            style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500 }}
                          >
                            Spayed/Neutered
                          </span>
                        </div>
                        <span 
                          className="text-gray-900 font-semibold"
                          style={{ fontFamily: 'Raleway', fontSize: '14px' }}
                        >
                          {typeof pet.spayed_neutered !== 'undefined' ? (pet.spayed_neutered ? 'Yes' : 'No') : (pet.medical_notes && pet.medical_notes.match(/Spayed\/Neutered: ([^\n]+)/)?.[1]) || 'N/A'}
                        </span>
                      </div>
                      {/* Allergies */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src="/material-symbols-light_pet-supplies.png" 
                            alt="Allergies" 
                            className="w-6 h-6"
                            style={{ filter: 'none', color: '#34113F' }}
                          />
                          <span 
                            className="text-gray-700"
                            style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500 }}
                          >
                            Allergies
                          </span>
                        </div>
                        <span 
                          className="text-gray-900 font-semibold"
                          style={{ fontFamily: 'Raleway', fontSize: '14px' }}
                        >
                          {pet.allergies ? pet.allergies : (pet.medical_notes && pet.medical_notes.match(/Allergies: ([^\n]+)/)?.[1]) || 'N/A'}
                        </span>
                      </div>
                      {/* Chronic Disease */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <img 
                            src="/fa6-solid_disease.png" 
                            alt="Chronic Disease" 
                            className="w-6 h-6"
                            style={{ filter: 'none', color: '#34113F' }}
                          />
                          <span 
                            className="text-gray-700"
                            style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500 }}
                          >
                            Chronic Disease
                          </span>
                        </div>
                        <span 
                          className="text-gray-900 font-semibold"
                          style={{ fontFamily: 'Raleway', fontSize: '14px' }}
                        >
                          {pet.chronic_disease ? pet.chronic_disease : (pet.medical_notes && pet.medical_notes.match(/Chronic Disease: ([^\n]+)/)?.[1]) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Files Card - First Separate Card */}
              <div 
                className="rounded-lg p-6"
                style={{ 
                  background: '#FFFFF2',
                  borderRadius: '10px'
                }}
              >
                <h3 
                  className="mb-4"
                  style={{ 
                    fontFamily: 'Raleway',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#333333'
                  }}
                >
                  Files
                </h3>
                
                {mockFiles.length > 0 ? (
                  <div className="space-y-3">
                    {mockFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center space-x-3">
                          {/* Dark Purple File Icon */}
                          <div className="w-6 h-6 flex items-center justify-center">
                            <svg 
                              className="w-6 h-6" 
                              fill="#4A0E4E" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z"/>
                              <polyline points="13,2 13,9 20,9"/>
                            </svg>
                          </div>
                          <span 
                            style={{ 
                              fontFamily: 'Raleway',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#333333'
                            }}
                          >
                            {file.name}
                          </span>
                        </div>
                        <span 
                          style={{ 
                            fontFamily: 'Raleway',
                            fontSize: '14px',
                            fontWeight: 400,
                            color: '#666666'
                          }}
                        >
                          {file.size}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <svg 
                        className="w-12 h-12" 
                        fill="#CCCCCC" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z"/>
                        <polyline points="13,2 13,9 20,9"/>
                      </svg>
                    </div>
                    <p 
                      style={{ 
                        fontFamily: 'Raleway',
                        fontSize: '14px',
                        fontWeight: 400,
                        color: '#999999'
                      }}
                    >
                      There are no files yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Download Medical Information Card - Second Separate Card */}
              <div 
                className="rounded-lg p-6"
                style={{ 
                  background: '#FFFFF2',
                  borderRadius: '10px'
                }}
              >
                <div className="text-center">
                  <h4 
                    className="mb-4"
                    style={{ 
                      fontFamily: 'Raleway',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#333333'
                    }}
                  >
                    Download Medical Information
                  </h4>
                  <button 
                    className="px-8 py-3 rounded-lg font-medium transition-colors hover:opacity-90"
                    style={{ 
                      background: '#F5E9B8',
                      color: '#4A0E4E',
                      fontFamily: 'Raleway',
                      fontSize: '16px',
                      fontWeight: 600,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: 'none'
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Records */}
            <div className="space-y-6">
              {/* Medical Records Section */}
              <div>
                {/* Title, Add Button, and Search Bar - Title and Button closer, Search separate */}
                <div className="flex items-center mb-4">
                  {/* Left side - Title and Add Button closer together */}
                  <div className="flex items-center space-x-2">
                    <h3 
                      className="font-bold flex items-center"
                      style={{ 
                        fontFamily: 'Raleway',
                        fontStyle: 'normal',
                        fontWeight: 700,
                        fontSize: '20px',
                        lineHeight: '23px',
                        color: '#815FB3',
                        width: '186px',
                        height: '23px'
                      }}
                    >
                      MEDICAL RECORDS
                    </h3>
                    {/* Add Button - Closer to title with shadow */}
                    <button 
                      onClick={() => setShowMedicalRecordModal(true)}
                      className="rounded text-center transition-colors hover:opacity-90"
                      style={{ 
                        width: '50px',
                        height: '27px',
                        background: '#F5E9B8',
                        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                        borderRadius: '10px',
                        border: 'none',
                        fontFamily: 'Raleway',
                        fontStyle: 'normal',
                        fontWeight: 800,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        letterSpacing: '0.05em',
                        color: '#34113F'
                      }}
                    >
                      Add
                    </button>
                    {/* Add Medical Record Modal */}
                      <AddMedicalRecordModal
                        isOpen={showMedicalRecordModal}
                        onClose={() => setShowMedicalRecordModal(false)}
                        onSave={record => {
                          setMedicalRecords(prev => {
                            const updated = [...prev, record];
                            localStorage.setItem('medicalRecords', JSON.stringify(updated));
                            return updated;
                          });
                          setShowMedicalRecordModal(false);
                        }}
                      />
                  </div>
                  {/* Right side - Search Bar separated */}
                  <div className="ml-auto">
                    {/* Search Bar - Shorter width to align with table */}
                    <input
                      type="text"
                      placeholder="Search"
                      className="px-3 py-1 rounded text-sm"
                      style={{ 
                        border: '1px solid #666666', // Added thicker border
                        borderRadius: '5px',
                        fontFamily: 'Raleway',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: '12px',
                        lineHeight: '14px',
                        color: '#666666',
                        backgroundColor: '#FFFFFF',
                        width: '250px', // Reduced from 357px to fit page properly
                        height: '25px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
                {/* Main Card - Only contains table */}
                <div className="rounded-lg" style={{ background: '#FFFFF2', borderRadius: '10px' }}>
                  <table className="min-w-full divide-y divide-gray-200" style={{ fontFamily: 'Raleway' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Provider</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Provided</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {medicalRecords.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-400">No medical records yet.</td>
                        </tr>
                      ) : (
                        medicalRecords.map((record, idx) => (
                          <tr key={idx} className="cursor-pointer hover:bg-gray-100" onClick={() => { setSelectedRecord(idx); setShowDetailsModal(true); }}>
                            <td className="px-6 py-4 whitespace-nowrap">{record.serviceType}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{record.provider}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{record.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vaccination Records Section */}
              <div>
                {/* Title, Add Button, and Search Bar - Same layout as Medical Records */}
                <div className="flex items-center mb-4">
                  {/* Left side - Title and Add Button closer together */}
                  <div className="flex items-center space-x-2">
                    <h3 
                      className="font-bold flex items-center"
                      style={{ 
                        fontFamily: 'Raleway',
                        fontStyle: 'normal',
                        fontWeight: 700,
                        fontSize: '20px',
                        lineHeight: '23px',
                        color: '#815FB3',
                        width: '240px', // Slightly wider for "VACCINATION RECORDS"
                        height: '23px'
                      }}
                    >
                      VACCINATION RECORDS
                    </h3>
                    
                    {/* Add Button - Same style as Medical Records */}
                    <button 
                      onClick={() => setShowVaccinationRecordModal(true)}
                      className="rounded text-center transition-colors hover:opacity-90"
                      style={{ 
                        width: '50px',
                        height: '27px',
                        background: '#F5E9B8',
                        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                        borderRadius: '10px',
                        border: 'none',
                        fontFamily: 'Raleway',
                        fontStyle: 'normal',
                        fontWeight: 800,
                        fontSize: '12px',
                        lineHeight: '14px',
                        textAlign: 'center',
                        letterSpacing: '0.05em',
                        color: '#34113F'
                      }}
                    >
                      Add
                    </button>
                    {/* Add Vaccination Record Modal */}
                    <AddVaccinationRecordModal
                      isOpen={showVaccinationRecordModal}
                      onClose={() => setShowVaccinationRecordModal(false)}
                      onSave={record => {
                        setVaccinationRecords(prev => {
                          const updated = [...prev, record];
                          localStorage.setItem('vaccinationRecords', JSON.stringify(updated));
                          return updated;
                        });
                        setShowVaccinationRecordModal(false);
                      }}
                    />
                  </div>
                  
                  {/* Right side - Search Bar separated */}
                  <div className="ml-auto">
                    {/* Search Bar - Same style as Medical Records */}
                    <input
                      type="text"
                      placeholder="Search"
                      className="px-3 py-1 rounded text-sm"
                      style={{ 
                        border: '1px solid #666666',
                        borderRadius: '5px',
                        fontFamily: 'Raleway',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: '12px',
                        lineHeight: '14px',
                        color: '#666666',
                        backgroundColor: '#FFFFFF',
                        width: '250px',
                        height: '25px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Main Card - Table of vaccination records */}
                <div
                  className="rounded-lg"
                  style={{ background: '#FFFFF2', borderRadius: '10px' }}
                >
                  <table className="min-w-full divide-y divide-gray-200" style={{ fontFamily: 'Raleway' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaccine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Administered By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Administered</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {vaccinationRecords.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-400">No vaccination records yet.</td>
                        </tr>
                      ) : (
                        vaccinationRecords.map((record, idx) => (
                          <tr
                            key={idx}
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSelectedVaccinationRecord(idx);
                              setShowVaccinationDetailsModal(true);
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">{record.vaccineType}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{record.administeredBy}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{record.dateAdministered}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{record.nextDueDate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <Modal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            logout();
            navigate('/petowner/login');
          }}
          title="Confirm Logout"
          message="Are you sure you want to logout?"
          confirmText="Logout"
          confirmButtonColor="bg-red-500 hover:bg-red-600"
        />
      )}

      {/* Medical Record Details Modal - Pop-out modal for medical record details */}
      {showDetailsModal && (
        <MedicalRecordDetailsModal
          isOpen={showDetailsModal}
          record={medicalRecords[selectedRecord]}
          onClose={() => setShowDetailsModal(false)}
          onDelete={() => {
            setMedicalRecords(prev => {
              const updated = prev.filter((_, i) => i !== selectedRecord);
              localStorage.setItem('medicalRecords', JSON.stringify(updated));
              return updated;
            });
            setShowDetailsModal(false);
            setSelectedRecord(null);
          }}
          onSave={(updatedRecord) => {
            setMedicalRecords(prev => {
              const updated = prev.map((item, index) => {
                if (index === selectedRecord) {
                  return updatedRecord;
                }
                return item;
              });
              localStorage.setItem('medicalRecords', JSON.stringify(updated));
              return updated;
            });
            setShowDetailsModal(false);
          }}
        />
      )}

      {/* Vaccination Record Details Modal - Pop-out modal for vaccination record details */}
      {showVaccinationDetailsModal && (
        <VaccinationRecordDetailsModal
          isOpen={showVaccinationDetailsModal}
          record={vaccinationRecords[selectedVaccinationRecord]}
          onClose={() => setShowVaccinationDetailsModal(false)}
          onDelete={() => {
            setVaccinationRecords(prev => {
              const updated = prev.filter((_, i) => i !== selectedVaccinationRecord);
              localStorage.setItem('vaccinationRecords', JSON.stringify(updated));
              return updated;
            });
            setShowVaccinationDetailsModal(false);
            setSelectedVaccinationRecord(null);
          }}
          onSave={(updatedRecord) => {
            setVaccinationRecords(prev => {
              const updated = prev.map((item, index) => {
                if (index === selectedVaccinationRecord) {
                  return updatedRecord;
                }
                return item;
              });
              localStorage.setItem('vaccinationRecords', JSON.stringify(updated));
              return updated;
            });
            setShowVaccinationDetailsModal(false);
          }}
        />
      )}
    </div>
  );
};

export default PetProfile;

import ExcelJS from 'exceljs';
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
import './custom-scrollbar.css';

const PetProfile = () => {
  // State for file size error modal
  const [showFileSizeErrorModal, setShowFileSizeErrorModal] = useState(false);
  const [fileSizeErrorMsg, setFileSizeErrorMsg] = useState('');
  // State for delete confirmation modal
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [showVaccinationRecordModal, setShowVaccinationRecordModal] = useState(false);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [pet, setPet] = useState(null);
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [petSwitchLoading, setPetSwitchLoading] = useState(false); // Separate loading for pet switching
  const [sidebarVisible, setSidebarVisible] = useState(true);
  // Responsive mobile sidebar overlay
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentPetId, setCurrentPetId] = useState(null); // Add state for current pet ID
  const [showAddPetModal, setShowAddPetModal] = useState(false); // Modal state for AddPetModal
  // Medical records state and search
  const [medicalRecords, setMedicalRecords] = useState(() => {
    const saved = localStorage.getItem('medicalRecords');
    return saved ? JSON.parse(saved) : [];
  });
  const [medicalSearch, setMedicalSearch] = useState("");
  const filteredMedicalRecords = medicalRecords.filter(record => {
    const query = medicalSearch.toLowerCase();
    return (
      record.serviceType?.toLowerCase().includes(query) ||
      record.provider?.toLowerCase().includes(query) ||
      record.date?.toLowerCase().includes(query)
    );
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

  // Files state for uploaded PDFs, persisted in localStorage
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('petProfileFiles');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        // Restore File objects from base64
        return arr.map(f => {
          if (f.fileData) {
            const byteString = atob(f.fileData.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const fileObj = new File([ab], f.name, { type: 'application/pdf' });
            return { ...f, file: fileObj };
          }
          return f;
        });
      } catch {
        return [];
      }
    }
    return [];
  });
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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
        // Clear records for new pet
        setMedicalRecords([]);
        setVaccinationRecords([]);
        localStorage.setItem('medicalRecords', JSON.stringify([]));
        localStorage.setItem('vaccinationRecords', JSON.stringify([]));
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

  // Vaccination records search state and filter
  const [vaccinationSearch, setVaccinationSearch] = useState("");
  const filteredVaccinationRecords = vaccinationRecords.filter(record => {
    const query = vaccinationSearch.toLowerCase();
    return (
      record.vaccineType?.toLowerCase().includes(query) ||
      record.administeredBy?.toLowerCase().includes(query) ||
      record.dateAdministered?.toLowerCase().includes(query) ||
      record.nextDueDate?.toLowerCase().includes(query)
    );
  });

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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F0F0F0] overflow-hidden">
      {/* AddPetModal - overlays everything including header */}
      <AddPetModal
        isOpen={showAddPetModal}
        onClose={() => setShowAddPetModal(false)}
        onPetAdded={() => {
          setShowAddPetModal(false);
          fetchAllPets();
          // Clear records for new pet
          setMedicalRecords([]);
          setVaccinationRecords([]);
          localStorage.setItem('medicalRecords', JSON.stringify([]));
          localStorage.setItem('vaccinationRecords', JSON.stringify([]));
        }}
        token={token}
      />

      {/* --- MODIFIED BLOCK --- */}
      {/* Mobile Sidebar Overlay with Transitions */}
      <div
        className={`
          md:hidden fixed inset-0 z-[60] flex
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
            currentPage="pet-profile"
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

      {/* Desktop Sidebar - Fixed and stationary */}
      <div
        className="hidden md:block"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '320px',
          zIndex: 30,
        }}
      >
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
          isMobileOverlay={false}
        />
      </div>

      {/* Main Content - add left/top margin for fixed sidebar/header on desktop */}
      <div
        className="flex-1 flex flex-col"
        style={{
          marginLeft: '0px',
          marginTop: '0px',
          ...(typeof window !== 'undefined' && window.innerWidth >= 768
            ? { marginLeft: '320px', marginTop: '72px' } // 320px sidebar, 72px header
            : {}),
        }}
      >
        {/* Header - Mobile: logo, sidebar toggle, profile. Desktop: fixed and stationary. */}
        <div
          className="border-b p-4 flex items-center justify-between md:bg-[#F0F0F0]"
          style={{
            position: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'fixed' : 'static',
            top: typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : undefined,
            left: typeof window !== 'undefined' && window.innerWidth >= 768 ? 320 : undefined,
            right: typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : undefined,
            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'calc(100% - 320px)' : '100%',
            height: typeof window !== 'undefined' && window.innerWidth >= 768 ? '72px' : undefined,
            zIndex: 40,
            background: typeof window !== 'undefined' && window.innerWidth >= 768 ? '#F0F0F0' : '#DCCEF1',
          }}
        >
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
            <ProfileButton onLogoutClick={() => setShowLogoutModal(true)} />
          </div>
          {/* Desktop header */}
          <div className="hidden md:flex items-center space-x-2 md:space-x-4 w-full justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <button 
                onClick={() => navigate('/pet-health-records')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Pet Health Records"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-lg md:text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                Pet Health Records
              </h2>
            </div>
            <ProfileButton onLogoutClick={() => setShowLogoutModal(true)} />
          </div>
        </div>
        {/* Page name below header for mobile */}
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#F0F0F0' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            Pet Health Records
          </h2>
        </div>

        {/* Pet Navigation - Made scrollable on x-axis for small screens */}
        <div className="pt-6 px-6 pb-6 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center space-x-6">
            {/* Add Pet Button - Responsive */}
            <button 
              onClick={() => setShowAddPetModal(true)}
              className="flex-shrink-0 transition-all duration-300 ease-in-out hover:transform hover:scale-105 w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-[#FFF4C9] border-none cursor-pointer"
              title="Add Pet"
            >
              <span className="font-bold text-gray-600 text-2xl md:text-4xl">+</span>
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
                        width: '56px',
                        height: '56px'
                      }}
                    >
                      {petItem.image_url || petItem.image ? (
                        <img 
                          src={petItem.image_url || petItem.image} 
                          alt={petItem.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span style={{
                          fontSize: '32px',
                          fontWeight: 900,
                          color: '#815FB3',
                          fontFamily: 'Raleway',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%'
                        }}>
                          {petItem.name ? petItem.name.charAt(0).toUpperCase() : ''}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <div style={{ width: '80%', height: '80%', margin: '0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', position: 'relative' }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '80%',
                        height: '80%',
                        fontSize: '96px',
                        fontWeight: 900,
                        color: '#815FB3',
                        position: 'relative',
                        top: '10%',
                        fontFamily: 'Raleway',
                        background: 'none',
                        borderRadius: '50%'
                      }}>
                        {pet.name ? pet.name.charAt(0).toUpperCase() : ''}
                      </span>
                    </div>
                  )}
                  
                  {/* Dark Gradient Overlay */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(153,144,74,0.7) 0%, rgba(204,192,98,0.3) 20%, rgba(245,233,184,0.0) 100%)'
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
                className="rounded-lg p-6 flex flex-col"
                style={{ 
                  background: '#FFFFF2',
                  borderRadius: '10px',
                  height: '320px'
                }}
              >
                {/* Header: Title and Add Button (fixed, non-scrolling) */}
                <div className="flex items-center mb-4 justify-between">
                  <h3 
                    className="mb-0"
                    style={{ 
                      fontFamily: 'Raleway',
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#333333'
                    }}
                  >
                    Files
                  </h3>
                  {/* Add File Button - Same style as Medical/Vaccination Add */}
                  <label htmlFor="file-upload" className="rounded text-center transition-colors hover:opacity-90 cursor-pointer" style={{ width: '50px', height: '27px', background: '#F5E9B8', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '10px', border: 'none', fontFamily: 'Raleway', fontWeight: 800, fontSize: '12px', lineHeight: '14px', textAlign: 'center', letterSpacing: '0.05em', color: '#34113F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Add
                    <input
                      id="file-upload"
                      type="file"
                      accept="application/pdf"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files[0];
                        const maxSize = 5 * 1024 * 1024; // 5MB
                        if (file) {
                          if (file.size > maxSize) {
                            setFileSizeErrorMsg('File is too large. Maximum allowed size is 5MB.');
                            setShowFileSizeErrorModal(true);
                            e.target.value = '';
                            return;
                          }
                          if (file.type === 'application/pdf') {
                            // Convert file to base64 for localStorage
                            const reader = new FileReader();
                            reader.onload = function(ev) {
                              const fileData = ev.target.result;
                              setFiles(prev => {
                                const newFiles = [...prev, { id: Date.now(), name: file.name, size: `${Math.round(file.size/1024)} kb`, file, fileData }];
                                localStorage.setItem('petProfileFiles', JSON.stringify(newFiles));
                                return newFiles;
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {/* File Size Error Modal - moved outside label/input for correct overlay and rendering */}
                  {showFileSizeErrorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative flex flex-col items-center">
                        <h3 style={{ fontFamily: 'Raleway', fontSize: '20px', fontWeight: 700, color: '#34113F', marginBottom: '16px', textAlign: 'center' }}>
                          File Upload Error
                        </h3>
                        <p style={{ fontFamily: 'Raleway', fontSize: '16px', color: '#333', marginBottom: '24px', textAlign: 'center' }}>
                          {fileSizeErrorMsg}
                        </p>
                        <button
                          onClick={() => setShowFileSizeErrorModal(false)}
                          style={{
                            background: '#F5E9B8',
                            color: '#34113F',
                            fontFamily: 'Raleway',
                            fontWeight: 700,
                            fontSize: '16px',
                            borderRadius: '8px',
                            border: 'none',
                            padding: '8px 24px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                            transition: 'opacity 0.2s',
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Scrollable file list area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ paddingRight: 0 }}>
                  <div style={{ marginRight: 40 }}>
                    {files.length > 0 ? (
                      <div className="space-y-3">
                        {files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between py-3 cursor-pointer group"
                          style={{ position: 'relative' }}
                          onClick={e => {
                            // Only open modal if not clicking download/delete
                            if (e.target.closest('.file-action-btn')) return;
                            setSelectedFile(file);
                            setShowFileModal(true);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            {/* File Icon - files.png */}
                            <div className="w-6 h-6 flex items-center justify-center">
                              <img src="/files.png" alt="File" style={{ width: '24px', height: '24px' }} />
                            </div>
                            <span style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500, color: '#333333' }}>{file.name}</span>
                          </div>
                          <div style={{ minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative' }}>
                            {/* File size fades out on hover, buttons fade in */}
                            <span
                              className="transition-opacity duration-200 ease-in group-hover:opacity-0"
                              style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 400, color: '#666666', position: 'absolute', right: 0 }}
                            >
                              {file.size}
                            </span>
                            <span
                              className="file-action-btn transition-opacity duration-200 ease-in opacity-0 group-hover:opacity-100 flex items-center space-x-2"
                              style={{ position: 'absolute', right: 0 }}
                            >
                              <button
                                className="file-action-btn"
                                style={{ background: 'none', border: 'none', padding: 0, marginRight: '8px', cursor: 'pointer' }}
                                title="Download"
                                onClick={e => {
                                  e.stopPropagation();
                                  const url = URL.createObjectURL(file.file);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = file.name;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                                }}
                              >
                                <img src="/download.png" alt="Download" style={{ width: '20px', height: '20px' }} />
                              </button>
                              <button
                                className="file-action-btn"
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                title="Delete"
                                onClick={e => {
                                  e.stopPropagation();
                                  setFileToDelete(file);
                                  setShowDeleteFileModal(true);
                                }}
                              >
                                <img src="/delete.png" alt="Delete" style={{ width: '24px', height: '24px' }} />
                              </button>
              {/* Delete File Confirmation Modal */}
              {showDeleteFileModal && fileToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative flex flex-col items-center">
                    <h3 style={{ fontFamily: 'Raleway', fontSize: '20px', fontWeight: 700, color: '#34113F', marginBottom: '16px', textAlign: 'center' }}>
                      Delete File
                    </h3>
                    <p style={{ fontFamily: 'Raleway', fontSize: '16px', color: '#333', marginBottom: '24px', textAlign: 'center' }}>
                      Are you sure you want to delete <span style={{ fontWeight: 600 }}>{fileToDelete.name}</span>? This action cannot be undone.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setShowDeleteFileModal(false);
                          setFileToDelete(null);
                        }}
                        style={{
                          background: '#F5E9B8',
                          color: '#34113F',
                          fontFamily: 'Raleway',
                          fontWeight: 700,
                          fontSize: '16px',
                          borderRadius: '8px',
                          border: 'none',
                          padding: '8px 24px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                          transition: 'opacity 0.2s',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setFiles(prev => {
                            const newFiles = prev.filter(f => f.id !== fileToDelete.id);
                            localStorage.setItem('petProfileFiles', JSON.stringify(newFiles));
                            return newFiles;
                          });
                          setShowDeleteFileModal(false);
                          setFileToDelete(null);
                        }}
                        style={{
                          background: '#E74C3C',
                          color: '#fff',
                          fontFamily: 'Raleway',
                          fontWeight: 700,
                          fontSize: '16px',
                          borderRadius: '8px',
                          border: 'none',
                          padding: '8px 24px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                          transition: 'opacity 0.2s',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
                            </span>
                          </div>
                        </div>
                      ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="flex justify-center mb-4">
                          <svg className="w-12 h-12" fill="#CCCCCC" viewBox="0 0 24 24">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z"/>
                            <polyline points="13,2 13,9 20,9"/>
                          </svg>
                        </div>
                        <p style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 400, color: '#999999' }}>There are no files yet.</p>
                      </div>
                    )}
                  </div>
                  {/* File Preview Modal */}
                  {showFileModal && selectedFile && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white rounded-lg shadow-lg p-8 max-w-5xl w-full relative" style={{ minWidth: '800px', minHeight: '700px' }}>
                        <button
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowFileModal(false)}
                          style={{ fontSize: '24px', fontWeight: 700 }}
                        >
                          ×
                        </button>
                        <h4 style={{ fontFamily: 'Raleway', fontSize: '22px', fontWeight: 600, color: '#34113F', marginBottom: '20px' }}>{selectedFile.name}</h4>
                        <iframe
                          src={URL.createObjectURL(selectedFile.file)}
                          title={selectedFile.name}
                          width="100%"
                          height="600px"
                          style={{ border: '1px solid #ccc', borderRadius: '8px', minHeight: '600px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
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
                    onClick={async () => {
                      // PawPal colors
                      const pawpalPurple = '815FB3';
                      const pawpalBeige = 'FFFFF2';
                      const white = 'FFFFFF';

                      const workbook = new ExcelJS.Workbook();

                      // Sheet 1: Medical Information
                      const sheet1 = workbook.addWorksheet('Medical Information');
                      sheet1.mergeCells('A1:B1');
                      sheet1.getCell('A1').value = 'Medical Information';
                      sheet1.getCell('A1').font = { bold: true, color: { argb: white }, size: 16, name: 'Raleway' };
                      sheet1.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
                      sheet1.getCell('A1').fill = { type: 'gradient', gradient: 'angle', degree: 0, stops: [{ position: 0, color: { argb: pawpalPurple } }, { position: 1, color: { argb: pawpalBeige } }] };
                      sheet1.getRow(1).height = 28;
                      const petInfoRows = [
                        ['Field', 'Value'],
                        ['Name', pet.name],
                        ['Sex', pet.sex],
                        ['Age', typeof pet.age !== 'undefined' ? `${pet.age} years old` : 'N/A'],
                        ['Species', pet.animal_type],
                        ['Breed', pet.breed],
                        ['Blood Type', pet.blood_type || (pet.medical_notes && pet.medical_notes.match(/Blood Type: ([^\n]+)/)?.[1]) || 'N/A'],
                        ['Spayed/Neutered', typeof pet.spayed_neutered !== 'undefined' ? (pet.spayed_neutered ? 'Yes' : 'No') : (pet.medical_notes && pet.medical_notes.match(/Spayed\/Neutered: ([^\n]+)/)?.[1]) || 'N/A'],
                        ['Allergies', pet.allergies || (pet.medical_notes && pet.medical_notes.match(/Allergies: ([^\n]+)/)?.[1]) || 'N/A'],
                        ['Chronic Disease', pet.chronic_disease || (pet.medical_notes && pet.medical_notes.match(/Chronic Disease: ([^\n]+)/)?.[1]) || 'N/A'],
                      ];
                      sheet1.addRows(petInfoRows);
                      sheet1.columns = [{ width: 20 }, { width: 40 }];
                      // Style header row
                      sheet1.getRow(2).font = { bold: true, color: { argb: white }, size: 13, name: 'Raleway' };
                      sheet1.getRow(2).alignment = { horizontal: 'center', vertical: 'middle' };
                      sheet1.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pawpalPurple } };
                      // Style data rows
                      for (let r = 3; r <= petInfoRows.length + 1; ++r) {
                        const row = sheet1.getRow(r);
                        row.font = { name: 'Raleway', size: 12 };
                        row.alignment = { horizontal: 'left', vertical: 'middle' };
                        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: r % 2 === 1 ? white : pawpalBeige } };
                        row.border = {
                          top: { style: 'thin', color: { argb: 'CCCCCC' } },
                          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                          left: { style: 'thin', color: { argb: 'CCCCCC' } },
                          right: { style: 'thin', color: { argb: 'CCCCCC' } }
                        };
                      }

                      // Sheet 2: Medical Records
                      const sheet2 = workbook.addWorksheet('Medical Records');
                      sheet2.mergeCells('A1:C1');
                      sheet2.getCell('A1').value = 'Medical Records';
                      sheet2.getCell('A1').font = { bold: true, color: { argb: white }, size: 16, name: 'Raleway' };
                      sheet2.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
                      sheet2.getCell('A1').fill = { type: 'gradient', gradient: 'angle', degree: 0, stops: [{ position: 0, color: { argb: pawpalPurple } }, { position: 1, color: { argb: pawpalBeige } }] };
                      sheet2.getRow(1).height = 28;
                      const medHeaders = ['Service Type', 'Service Provider', 'Date Provided'];
                      sheet2.addRow(medHeaders);
                      sheet2.columns = [{ width: 25 }, { width: 25 }, { width: 20 }];
                      sheet2.getRow(2).font = { bold: true, color: { argb: white }, size: 13, name: 'Raleway' };
                      sheet2.getRow(2).alignment = { horizontal: 'center', vertical: 'middle' };
                      sheet2.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pawpalPurple } };
                      const medRows = medicalRecords.map(r => [r.serviceType, r.provider, r.date]);
                      sheet2.addRows(medRows);
                      for (let r = 3; r <= medRows.length + 2; ++r) {
                        const row = sheet2.getRow(r);
                        row.font = { name: 'Raleway', size: 12 };
                        row.alignment = { horizontal: 'left', vertical: 'middle' };
                        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: r % 2 === 1 ? white : pawpalBeige } };
                        row.border = {
                          top: { style: 'thin', color: { argb: 'CCCCCC' } },
                          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                          left: { style: 'thin', color: { argb: 'CCCCCC' } },
                          right: { style: 'thin', color: { argb: 'CCCCCC' } }
                        };
                      }

                      // Sheet 3: Vaccination Records
                      const sheet3 = workbook.addWorksheet('Vaccination Records');
                      sheet3.mergeCells('A1:D1');
                      sheet3.getCell('A1').value = 'Vaccination Records';
                      sheet3.getCell('A1').font = { bold: true, color: { argb: white }, size: 16, name: 'Raleway' };
                      sheet3.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
                      sheet3.getCell('A1').fill = { type: 'gradient', gradient: 'angle', degree: 0, stops: [{ position: 0, color: { argb: pawpalPurple } }, { position: 1, color: { argb: pawpalBeige } }] };
                      sheet3.getRow(1).height = 28;
                      const vacHeaders = ['Vaccine', 'Administered By', 'Date Administered', 'Next Due'];
                      sheet3.addRow(vacHeaders);
                      sheet3.columns = [{ width: 20 }, { width: 25 }, { width: 20 }, { width: 20 }];
                      sheet3.getRow(2).font = { bold: true, color: { argb: white }, size: 13, name: 'Raleway' };
                      sheet3.getRow(2).alignment = { horizontal: 'center', vertical: 'middle' };
                      sheet3.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pawpalPurple } };
                      const vacRows = vaccinationRecords.map(r => [r.vaccineType, r.administeredBy, r.dateAdministered, r.nextDueDate]);
                      sheet3.addRows(vacRows);
                      for (let r = 3; r <= vacRows.length + 2; ++r) {
                        const row = sheet3.getRow(r);
                        row.font = { name: 'Raleway', size: 12 };
                        row.alignment = { horizontal: 'left', vertical: 'middle' };
                        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: r % 2 === 1 ? white : pawpalBeige } };
                        row.border = {
                          top: { style: 'thin', color: { argb: 'CCCCCC' } },
                          bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
                          left: { style: 'thin', color: { argb: 'CCCCCC' } },
                          right: { style: 'thin', color: { argb: 'CCCCCC' } }
                        };
                      }

                      // Download
                      const buffer = await workbook.xlsx.writeBuffer();
                      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${pet.name || 'pet'}_profile.xlsx`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
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
                    <div style={{ position: 'relative', width: '300px' }}>
                      <img src="/Magnifying glass.png" alt="Search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#666666', pointerEvents: 'none', zIndex: 2 }} />
                      <input
                        type="text"
                        placeholder="Search"
                        value={medicalSearch}
                        onChange={e => setMedicalSearch(e.target.value)}
                        className="px-3 py-1 rounded text-sm"
                        style={{
                          border: '1.5px solid #666666',
                          borderRadius: '8px',
                          fontFamily: 'Raleway',
                          fontStyle: 'normal',
                          fontWeight: 500,
                          fontSize: '16px',
                          lineHeight: '20px',
                          color: '#666666',
                          backgroundColor: '#FFFFFF',
                          width: '100%',
                          height: '38px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          paddingLeft: '40px', // space for icon
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* Main Card - Only contains table */}
                <div className="rounded-lg" style={{ background: '#FFFFF2', borderRadius: '10px', height: '320px', overflowY: 'auto' }}>
                  <table className="min-w-full divide-y divide-gray-200" style={{ fontFamily: 'Raleway', background: '#FFFFF2' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ background: '#FFFFF2' }}>Service Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ background: '#FFFFF2' }}>Service Provider</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ background: '#FFFFF2' }}>Date Provided</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200" style={{ background: '#FFFFF2' }}>
                      {filteredMedicalRecords.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-400">No medical records yet.</td>
                        </tr>
                      ) : (
                        filteredMedicalRecords.map((record, idx) => (
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
                  
                  {/* Right side - Search Bar with icon, wider */}
                  <div className="ml-auto">
                    <div style={{ position: 'relative', width: '250px' }}>
                      <img src="/Magnifying glass.png" alt="Search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#666666', pointerEvents: 'none', zIndex: 2 }} />
                      <input
                        type="text"
                        placeholder="Search"
                        value={vaccinationSearch}
                        onChange={e => setVaccinationSearch(e.target.value)}
                        className="px-3 py-1 rounded text-sm"
                        style={{
                          border: '1.5px solid #666666',
                          borderRadius: '8px',
                          fontFamily: 'Raleway',
                          fontStyle: 'normal',
                          fontWeight: 500,
                          fontSize: '16px',
                          lineHeight: '20px',
                          color: '#666666',
                          backgroundColor: '#FFFFFF',
                          width: '100%',
                          height: '38px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          paddingLeft: '40px', // space for icon
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* Main Card - Table of vaccination records */}
                <div className="rounded-lg" style={{ background: '#FFFFF2', borderRadius: '10px', height: '320px', overflowY: 'auto' }}>
                  <table className="min-w-full divide-y divide-gray-200" style={{ fontFamily: 'Raleway', background: '#FFFFF2' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ background: '#FFFFF2' }}>Vaccine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ background: '#FFFFF2' }}>Administered By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ background: '#FFFFF2' }}>Date Administered</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ background: '#FFFFF2' }}>Next Due</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200" style={{ background: '#FFFFF2' }}>
                      {filteredVaccinationRecords.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-400">No vaccination records yet.</td>
                        </tr>
                      ) : (
                        filteredVaccinationRecords.map((record, idx) => (
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

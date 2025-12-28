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

// --- Helper Component for the Download Card ---
const DownloadSection = ({ onDownload, className = "" }) => (
  <div 
    className={`rounded-lg p-4 md:p-6 bg-[#FFFFF2] ${className}`}
    style={{ borderRadius: '10px' }}
  >
    <div className="text-center">
      <h4 className="mb-3 md:mb-4 font-raleway text-[16px] md:text-[20px] font-semibold text-[#333333]">
        Download Medical Information
      </h4>
      <button 
        className="px-6 py-2 md:px-8 md:py-3 rounded-lg font-medium transition-colors hover:opacity-90 bg-[#F5E9B8] text-[#4A0E4E] font-raleway text-[14px] md:text-[16px] font-semibold shadow-sm border-none"
        onClick={onDownload}
      >
        Download
      </button>
    </div>
  </div>
);

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
  const [editingPet, setEditingPet] = useState(null);
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
  const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = `${API_ROOT}/api`;

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
      const response = await axios.get(`${API_BASE_URL}/pets/`, {
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
      const response = await axios.get(`${API_BASE_URL}/pets/${petId}/`, {
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
    setCurrentPetId(parseInt(petId));
  }, [petId, token, fetchAllPets, fetchPetDetails]);

  const handlePetSelect = (selectedPetId) => {
    if (selectedPetId !== currentPetId) {
      window.history.pushState(null, '', `/pet-profile/${selectedPetId}`);
      setCurrentPetId(selectedPetId);
      const selectedPet = allPets.find(p => p.id === selectedPetId);
      if (selectedPet) {
        setPet(selectedPet);
        setMedicalRecords([]);
        setVaccinationRecords([]);
        localStorage.setItem('medicalRecords', JSON.stringify([]));
        localStorage.setItem('vaccinationRecords', JSON.stringify([]));
      }
      fetchPetDetailsByIdDirectly(selectedPetId);
    }
  };

  const fetchPetDetailsByIdDirectly = async (petIdToFetch) => {
    try {
      setPetSwitchLoading(true);
      const response = await axios.get(`${API_BASE_URL}/pets/${petIdToFetch}/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        },
      });
      if (petIdToFetch === currentPetId) {
        setPet(response.data);
      }
    } catch (error) {
      console.error('Error fetching detailed pet data:', error);
    } finally {
      setPetSwitchLoading(false);
    }
  };

  const handleEditClick = (petToOpen) => {
    setEditingPet(petToOpen);
    setShowAddPetModal(true);
  };

    // --- Extracted Excel Logic ---
    const handleDownloadReport = async () => {
      if (!pet) return;

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
      
      // FIX: Added 'Weight' to the Excel export rows
      const petInfoRows = [
        ['Field', 'Value'],
        ['Name', pet.name],
        ['Sex', pet.sex],
        ['Age', typeof pet.age !== 'undefined' ? `${pet.age} years old` : 'N/A'],
        ['Weight', pet.weight ? `${pet.weight} kg` : 'N/A'], // Added Weight Row
        ['Species', pet.animal_type],
        ['Breed', pet.breed],
        ['Blood Type', pet.blood_type || (pet.medical_notes && pet.medical_notes.match(/Blood Type: ([^\n]+)/)?.[1]) || 'N/A'],
        ['Spayed/Neutered', typeof pet.spayed_neutered !== 'undefined' ? (pet.spayed_neutered ? 'Yes' : 'No') : (pet.medical_notes && pet.medical_notes.match(/Spayed\/Neutered: ([^\n]+)/)?.[1]) || 'N/A'],
        ['Allergies', pet.allergies || (pet.medical_notes && pet.medical_notes.match(/Allergies: ([^\n]+)/)?.[1]) || 'N/A'],
        ['Chronic Disease', pet.chronic_disease || (pet.medical_notes && pet.medical_notes.match(/Chronic Disease: ([^\n]+)/)?.[1]) || 'N/A'],
      ];
      
      sheet1.addRows(petInfoRows);
      sheet1.columns = [{ width: 20 }, { width: 40 }];
      sheet1.getRow(2).font = { bold: true, color: { argb: white }, size: 13, name: 'Raleway' };
      sheet1.getRow(2).alignment = { horizontal: 'center', vertical: 'middle' };
      sheet1.getRow(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pawpalPurple } };
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

      // Sheet 2: Medical Records (kept same)
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

      // Sheet 3: Vaccination Records (kept same)
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
    };

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
      <AddPetModal
        isOpen={showAddPetModal}
        petToEdit={editingPet}
        onClose={() => {
          setShowAddPetModal(false);
          setEditingPet(null);
        }}
        onPetAdded={() => {
          setShowAddPetModal(false);
          setEditingPet(null);
          fetchAllPets();
          setMedicalRecords([]);
          setVaccinationRecords([]);
          localStorage.setItem('medicalRecords', JSON.stringify([]));
          localStorage.setItem('vaccinationRecords', JSON.stringify([]));
          // Refresh details to get the new weight
          if (currentPetId) {
            fetchPetDetailsByIdDirectly(currentPetId);
          } else {
            fetchPetDetails();
          }
        }}
        token={token}
      />

      {/* Mobile Sidebar Overlay */}
      <div
        className={`
          md:hidden fixed inset-0 z-[60] flex
          transition-opacity duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        role="dialog"
        aria-modal="true"
      >
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
        <div 
          className="flex-1 bg-black bg-opacity-50" 
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        ></div>
      </div>

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

      <div
        className="flex-1 flex flex-col"
        style={{
          marginLeft: '0px',
          marginTop: '0px',
          ...(typeof window !== 'undefined' && window.innerWidth >= 768
            ? {
                marginLeft: sidebarVisible ? '320px' : '80px',
                marginTop: '72px',
                transition: 'margin-left 0.3s',
              }
            : {}),
        }}
      >
        <div
          className="border-b p-4 flex items-center justify-between md:bg-[#F0F0F0]"
          style={{
            position: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'fixed' : 'static',
            top: typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : undefined,
            left: typeof window !== 'undefined' && window.innerWidth >= 768 ? (sidebarVisible ? 320 : 80) : undefined,
            right: typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : undefined,
            width: typeof window !== 'undefined' && window.innerWidth >= 768 ? (sidebarVisible ? 'calc(100% - 320px)' : 'calc(100% - 80px)') : '100%',
            height: typeof window !== 'undefined' && window.innerWidth >= 768 ? '72px' : undefined,
            zIndex: 40,
            background: typeof window !== 'undefined' && window.innerWidth >= 768 ? '#F0F0F0' : '#DCCEF1',
            transition: 'left 0.3s, width 0.3s',
          }}
        >
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
              <img src="/pat-logo.png" alt="PawPal Logo" className="w-8 h-8" />
              <span className="font-bold text-lg text-[#815FB3]" style={{ fontFamily: 'Raleway' }}>PAWPAL</span>
              <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 ml-2" aria-label="Open sidebar">
                <img src="/sidebar-expand-icon.png" alt="Sidebar Toggle" className="w-6 h-6" style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
            <ProfileButton onLogoutClick={() => setShowLogoutModal(true)} />
          </div>
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
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#F0F0F0', paddingTop: '56px' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            Pet Health Records
          </h2>
        </div>

        <div className="pt-6 px-6 pb-6 overflow-x-auto whitespace-nowrap" style={{ paddingTop: '20px' }}>
          <div className="flex items-center space-x-2 md:space-x-6">
            <button
              onClick={() => setShowAddPetModal(true)}
              className="flex-shrink-0 transition-all duration-300 ease-in-out hover:transform hover:scale-105 w-10 h-10 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-[#FFF4C9] border-none cursor-pointer"
              title="Add Pet"
            >
              <span className="font-bold text-gray-600 text-xl md:text-4xl">+</span>
            </button>
            <div className="w-px h-10 md:h-20 bg-gray-400"></div>
            <div className="flex items-center space-x-2 md:space-x-4">
              {allPets.map((petItem) => {
                const isSelected = petItem.id === currentPetId; 
                return (
                  <div
                    key={petItem.id}
                    onClick={() => handlePetSelect(petItem.id)}
                    className={`cursor-pointer transition-all duration-300 ease-in-out hover:transform hover:scale-105 flex items-center overflow-hidden
                      ${isSelected ? 'bg-[#FFF4C9]' : 'bg-transparent'}
                      ${isSelected ? 'rounded-[20px] md:rounded-[40px]' : 'rounded-full'} 
                      ${isSelected ? 'pr-3 pl-1 py-1 md:pr-6 md:pl-3 md:py-3' : 'p-0'} 
                      ${isSelected ? 'min-w-[120px] md:min-w-[200px]' : 'min-w-[40px] md:min-w-[80px]'} 
                      h-10 md:h-[80px]
                    `}
                  >
                    <div 
                      className="bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 w-8 h-8 md:w-[56px] md:h-[56px]"
                    >
                      {petItem.image_url || petItem.image ? (
                        <img 
                          src={petItem.image_url || petItem.image} 
                          alt={petItem.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span 
                          className="text-sm md:text-[32px]"
                          style={{
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
                    <span 
                      className={`ml-2 md:ml-4 font-bold text-gray-900 whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isSelected ? 'opacity-100 transform translate-x-0 block' : 'opacity-0 transform translate-x-4 hidden'
                      } text-sm md:text-[18px]`}
                      style={{
                        fontFamily: 'Raleway',
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

        <div className="flex-1 px-4 pb-6 md:px-6">
          <div className={`transition-opacity duration-200 ${petSwitchLoading ? 'opacity-50' : 'opacity-100'}`}> 
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-4 md:space-y-6">
              <div 
                className="rounded-lg mt-4 overflow-hidden shadow-sm bg-[#FFFFF2]"
              >
                <div className="relative h-[220px] md:h-[320px]">
                  {pet.image_url || pet.image ? (
                    <img 
                      src={pet.image_url || pet.image} 
                      alt={pet.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-[80%] h-[80%] mx-auto flex items-start justify-center relative">
                      <span className="flex items-center justify-center w-[80%] h-[80%] text-[60px] md:text-[96px] font-[900] text-[#815FB3] relative top-[10%] font-raleway bg-none rounded-full">
                        {pet.name ? pet.name.charAt(0).toUpperCase() : ''}
                      </span>
                    </div>
                  )}
                  
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(153,144,74,0.7) 0%, rgba(204,192,98,0.3) 20%, rgba(245,233,184,0.0) 100%)'
                    }}
                  ></div>
                  
                  <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
                    <div className="flex items-center space-x-2 mb-1 md:mb-2">
                      <h1 
                        className="text-white font-bold font-raleway text-[24px] md:text-[28px] leading-tight shadow-sm"
                        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      >
                        {pet.name}
                      </h1>
                      <button onClick={() => handleEditClick(pet)} className="text-[#815FB3] hover:text-[#6d4a96] transition-colors bg-white/30 rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p 
                      className="text-white font-raleway text-[14px] md:text-[16px] leading-tight"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {pet.breed || 'Domestic Shorthair'}
                    </p>
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  {/* FIX: Changed grid-cols-3 to grid-cols-4 to accommodate Weight */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                    {/* Species */}
                    <div className="text-center">
                      <div className="flex justify-center mb-2 md:mb-3">
                        <img 
                          src="/mdi_paw.png" 
                          alt="Species" 
                          className="w-[24px] h-[24px] md:w-[35px] md:h-[35px] text-[#815FB3]"
                          style={{ filter: 'none' }}
                        />
                      </div>
                      <p className="text-gray-600 mb-1 font-raleway text-[10px] md:text-[12px] font-medium">Species</p>
                      <p className="text-gray-900 font-bold font-raleway text-[12px] md:text-[14px]">
                        {pet.animal_type ? pet.animal_type.charAt(0).toUpperCase() + pet.animal_type.slice(1) : 'N/A'}
                      </p>
                    </div>

                    {/* Sex */}
                    <div className="text-center">
                      <div className="flex justify-center mb-2 md:mb-3">
                        <img 
                          src="/solar_health-bold.png" 
                          alt="Sex" 
                          className="w-[24px] h-[24px] md:w-[35px] md:h-[35px] text-[#815FB3]"
                          style={{ filter: 'none' }}
                        />
                      </div>
                      <p className="text-gray-600 mb-1 font-raleway text-[10px] md:text-[12px] font-medium">Sex</p>
                      <p className="text-gray-900 font-bold font-raleway text-[12px] md:text-[14px]">
                        {pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : 'N/A'}
                      </p>
                    </div>

                    {/* Age */}
                    <div className="text-center">
                      <div className="flex justify-center mb-2 md:mb-3">
                        <img 
                          src="/mage_calendar-fill.png" 
                          alt="Age" 
                          className="w-[24px] h-[24px] md:w-[35px] md:h-[35px] text-[#815FB3]"
                          style={{ filter: 'none' }}
                        />
                      </div>
                      <p className="text-gray-600 mb-1 font-raleway text-[10px] md:text-[12px] font-medium">Age</p>
                      <p className="text-gray-900 font-bold font-raleway text-[12px] md:text-[14px]">
                        {typeof pet.age !== 'undefined' ? `${pet.age} years old` : 'N/A'}
                      </p>
                    </div>

                    {/* FIX: Added Weight Display Block */}
                    <div className="text-center">
                      <div className="flex justify-center mb-2 md:mb-3">
                        <img 
                          src="/fa7-solid_weight-scale.png" 
                          alt="Weight" 
                          className="w-[24px] h-[24px] md:w-[35px] md:h-[35px] text-[#815FB3]"
                          style={{ filter: 'none' }}
                        />
                      </div>
                      <p className="text-gray-600 mb-1 font-raleway text-[10px] md:text-[12px] font-medium">Weight</p>
                      <p className="text-gray-900 font-bold font-raleway text-[12px] md:text-[14px]">
                        {pet.weight ? `${pet.weight} kg` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-gray-900 mb-4 md:mb-6 font-raleway text-[18px] md:text-[20px] font-semibold">
                      Medical Information
                    </h3>
                    
                    <div className="space-y-2 md:space-y-4">
                      {/* Blood Type */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <img src="/healthicons_blood-drop-24px.png" alt="Blood Type" className="w-5 h-5 md:w-6 md:h-6 text-[#34113F]" style={{ filter: 'none' }} />
                          <span className="text-gray-700 font-raleway text-[12px] md:text-[14px] font-medium">Blood Type</span>
                        </div>
                        <span className="text-gray-900 font-semibold font-raleway text-[12px] md:text-[14px]">
                          {pet.blood_type ? pet.blood_type : (pet.medical_notes && pet.medical_notes.match(/Blood Type: ([^\n]+)/)?.[1]) || 'N/A'}
                        </span>
                      </div>
                      {/* Spayed/Neutered */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <img src="/mynaui_heart-x-solid.png" alt="Spayed/Neutered" className="w-5 h-5 md:w-6 md:h-6 text-[#34113F]" style={{ filter: 'none' }} />
                          <span className="text-gray-700 font-raleway text-[12px] md:text-[14px] font-medium">Spayed/Neutered</span>
                        </div>
                        <span className="text-gray-900 font-semibold font-raleway text-[12px] md:text-[14px]">
                          {typeof pet.spayed_neutered !== 'undefined' ? (pet.spayed_neutered ? 'Yes' : 'No') : (pet.medical_notes && pet.medical_notes.match(/Spayed\/Neutered: ([^\n]+)/)?.[1]) || 'N/A'}
                        </span>
                      </div>
                      {/* Allergies */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <img src="/material-symbols-light_pet-supplies.png" alt="Allergies" className="w-5 h-5 md:w-6 md:h-6 text-[#34113F]" style={{ filter: 'none' }} />
                          <span className="text-gray-700 font-raleway text-[12px] md:text-[14px] font-medium">Allergies</span>
                        </div>
                        <span className="text-gray-900 font-semibold font-raleway text-[12px] md:text-[14px]">
                          {pet.allergies ? pet.allergies : (pet.medical_notes && pet.medical_notes.match(/Allergies: ([^\n]+)/)?.[1]) || 'N/A'}
                        </span>
                      </div>
                      {/* Chronic Disease */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 md:space-x-4">
                          <img src="/fa6-solid_disease.png" alt="Chronic Disease" className="w-5 h-5 md:w-6 md:h-6 text-[#34113F]" style={{ filter: 'none' }} />
                          <span className="text-gray-700 font-raleway text-[12px] md:text-[14px] font-medium">Chronic Disease</span>
                        </div>
                        <span className="text-gray-900 font-semibold font-raleway text-[12px] md:text-[14px]">
                          {pet.chronic_disease ? pet.chronic_disease : (pet.medical_notes && pet.medical_notes.match(/Chronic Disease: ([^\n]+)/)?.[1]) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Files Card */}
              <div 
                className="rounded-lg p-4 md:p-6 flex flex-col bg-[#FFFFF2]"
                style={{ borderRadius: '10px' }}
              >
                <div className="h-[250px] md:h-[320px] flex flex-col">
                  <div className="flex items-center mb-3 md:mb-4 justify-between">
                    <h3 className="mb-0 font-raleway text-[18px] md:text-[20px] font-semibold text-[#333333]">
                      Files
                    </h3>
                    <label htmlFor="file-upload" className="rounded text-center transition-colors hover:opacity-90 cursor-pointer flex items-center justify-center w-[50px] h-[27px] bg-[#F5E9B8] shadow-sm border-none font-raleway font-extrabold text-[12px] text-[#34113F]">
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
                    {showFileSizeErrorModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-md w-full relative flex flex-col items-center">
                          <h3 className="font-raleway text-[18px] md:text-[20px] font-bold text-[#34113F] mb-4 text-center">
                            File Upload Error
                          </h3>
                          <p className="font-raleway text-[14px] md:text-[16px] text-[#333] mb-6 text-center">
                            {fileSizeErrorMsg}
                          </p>
                          <button
                            onClick={() => setShowFileSizeErrorModal(false)}
                            className="bg-[#F5E9B8] text-[#34113F] font-raleway font-bold text-[14px] md:text-[16px] rounded-lg border-none px-6 py-2 shadow-sm"
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-0">
                    <div className="mr-2 md:mr-10">
                      {files.length > 0 ? (
                        <div className="space-y-2 md:space-y-3">
                          {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between py-2 md:py-3 cursor-pointer group relative"
                            onClick={e => {
                              if (e.target.closest('.file-action-btn')) return;
                              setSelectedFile(file);
                              setShowFileModal(true);
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 flex items-center justify-center">
                                <img src="/files.png" alt="File" className="w-5 h-5 md:w-6 md:h-6" />
                              </div>
                              <span className="font-raleway text-[12px] md:text-[14px] font-medium text-[#333333] truncate max-w-[150px] md:max-w-none">{file.name}</span>
                            </div>
                            <div className="min-w-[70px] flex items-center justify-end relative">
                              <span
                                className="transition-opacity duration-200 ease-in group-hover:opacity-0 font-raleway text-[12px] md:text-[14px] font-normal text-[#666666] absolute right-0"
                              >
                                {file.size}
                              </span>
                              <span
                                className="file-action-btn transition-opacity duration-200 ease-in opacity-100 md:opacity-0 md:group-hover:opacity-100 flex items-center space-x-2 absolute right-0 bg-[#FFFFF2] pl-2"
                              >
                                <button
                                  className="file-action-btn bg-none border-none p-0 mr-2 cursor-pointer"
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
                                  <img src="/download.png" alt="Download" className="w-4 h-4 md:w-5 md:h-5" />
                                </button>
                                <button
                                  className="file-action-btn bg-none border-none p-0 cursor-pointer"
                                  title="Delete"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setFileToDelete(file);
                                    setShowDeleteFileModal(true);
                                  }}
                                >
                                  <img src="/delete.png" alt="Delete" className="w-5 h-5 md:w-6 md:h-6" />
                                </button>
               {showDeleteFileModal && fileToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
                  <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-md w-full relative flex flex-col items-center">
                    <h3 className="font-raleway text-[18px] md:text-[20px] font-bold text-[#34113F] mb-4 text-center">
                      Delete File
                    </h3>
                    <p className="font-raleway text-[14px] md:text-[16px] text-[#333] mb-6 text-center">
                      Are you sure you want to delete <span className="font-bold">{fileToDelete.name}</span>? This action cannot be undone.
                    </p>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          setShowDeleteFileModal(false);
                          setFileToDelete(null);
                        }}
                        className="bg-[#F5E9B8] text-[#34113F] font-raleway font-bold text-[14px] md:text-[16px] rounded-lg border-none px-6 py-2 shadow-sm"
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
                        className="bg-[#E74C3C] text-white font-raleway font-bold text-[14px] md:text-[16px] rounded-lg border-none px-6 py-2 shadow-sm"
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
                        <div className="text-center py-6 h-full flex flex-col items-center justify-center">
                          <div className="flex justify-center mb-3">
                            <div className="w-12 h-12 bg-[#FFF4C9] rounded-full flex items-center justify-center">
                              <img src="/files.png" alt="No files" className="w-6 h-6 opacity-50" />
                            </div>
                          </div>
                          <p className="font-raleway text-[14px] font-medium text-gray-500 mb-3">No files uploaded yet.</p>
                          
                          <label 
                            htmlFor="file-upload-empty" 
                            className="px-4 py-2 bg-white border border-[#815FB3] text-[#815FB3] rounded-lg text-xs font-bold cursor-pointer hover:bg-[#F0F0FF] transition-colors shadow-sm"
                          >
                            Upload First File
                            <input
                              id="file-upload-empty"
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files[0];
                                if (file) document.getElementById('file-upload').files = e.target.files;
                                const main = document.getElementById('file-upload');
                                if (main) main.dispatchEvent(new Event('change', { bubbles: true }));
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    {showFileModal && selectedFile && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 max-w-5xl w-full relative flex flex-col" style={{ minHeight: '50vh', maxHeight: '90vh' }}>
                          <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => setShowFileModal(false)}
                          >
                            ×
                          </button>
                          <h4 className="font-raleway text-[18px] md:text-[22px] font-semibold text-[#34113F] mb-4">{selectedFile.name}</h4>
                          <iframe
                            src={URL.createObjectURL(selectedFile.file)}
                            title={selectedFile.name}
                            className="w-full flex-1 border border-[#ccc] rounded-lg min-h-[300px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DownloadSection 
                onDownload={handleDownloadReport} 
                className="hidden md:block" 
              />
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <div className="flex flex-col md:flex-row md:items-center mb-4 gap-3 md:gap-0">
                  <div className="flex items-center space-x-2 justify-between md:justify-start w-full md:w-auto">
                    <h3 className="font-bold flex items-center font-raleway text-[18px] md:text-[20px] leading-tight text-[#815FB3] md:w-[186px]">
                      MEDICAL RECORDS
                    </h3>
                    <button 
                      onClick={() => setShowMedicalRecordModal(true)}
                      className="rounded text-center transition-colors hover:opacity-90 w-[50px] h-[27px] bg-[#F5E9B8] shadow-sm border-none font-raleway font-extrabold text-[12px] text-[#34113F] flex items-center justify-center"
                    >
                      Add
                    </button>
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
                  <div className="w-full md:ml-auto md:w-[300px] relative">
                    <img src="/magnifying-glass.png" alt="Search" className="absolute left-[10px] top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#666666] pointer-events-none z-[2]" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={medicalSearch}
                      onChange={e => setMedicalSearch(e.target.value)}
                      className="px-3 py-1 rounded text-sm border-[1.5px] border-[#666666] rounded-[8px] font-raleway font-medium text-[16px] text-[#666666] bg-white w-full h-[38px] outline-none pl-[40px]"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-[#FFFFF2] h-[250px] md:h-[320px] overflow-y-auto" style={{ borderRadius: '10px' }}>
                  <table className="min-w-full divide-y divide-gray-200 font-raleway bg-[#FFFFF2]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider bg-[#FFFFF2]">Service Type</th>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider bg-[#FFFFF2]">Service Provider</th>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-[12px] font-medium text-gray-500 uppercase tracking-wider bg-[#FFFFF2]">Date Provided</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 bg-[#FFFFF2]">
                      {filteredMedicalRecords.length === 0 ? (
                        <tr style={{ background: '#FFFFF2' }}>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-400 text-sm" style={{ background: '#FFFFF2' }}>No medical records yet.</td>
                        </tr>
                      ) : (
                        filteredMedicalRecords.map((record, idx) => (
                          <tr key={idx} className="cursor-pointer hover:bg-gray-100" onClick={() => { setSelectedRecord(idx); setShowDetailsModal(true); }}>
                            <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-[12px] md:text-sm">{record.serviceType}</td>
                            <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-[12px] md:text-sm">{record.provider}</td>
                            <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-[12px] md:text-sm">{record.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="flex flex-col md:flex-row md:items_center mb-4 gap-3 md:gap-0">
                  <div className="flex items-center space-x-2 justify-between md:justify-start w-full md:w-auto">
                    <h3 className="font-bold flex items-center font-raleway text-[18px] md:text-[20px] leading-tight text-[#815FB3] md:w-[240px]">
                      VACCINATION RECORDS
                    </h3>
                    
                    <button 
                      onClick={() => setShowVaccinationRecordModal(true)}
                      className="rounded text-center transition-colors hover:opacity-90 w-[50px] h-[27px] bg-[#F5E9B8] shadow-sm border-none font-raleway font-extrabold text-[12px] text-[#34113F] flex items-center justify-center"
                    >
                      Add
                    </button>
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
                  
                  <div className="w-full md:ml-auto md:w-[250px] relative">
                    <img src="/magnifying-glass.png" alt="Search" className="absolute left-[10px] top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#666666] pointer-events-none z-[2]" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={vaccinationSearch}
                      onChange={e => setVaccinationSearch(e.target.value)}
                      className="px-3 py-1 rounded text-sm border-[1.5px] border-[#666666] rounded-[8px] font-raleway font-medium text-[16px] text-[#666666] bg-white w-full h-[38px] outline-none pl-[40px]"
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-[#FFFFF2] h-[250px] md:h-[320px] overflow-y-auto" style={{ borderRadius: '10px' }}>
                  <table className="min-w-full divide-y divide-gray-200 font-raleway bg-[#FFFFF2]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider bg-[#FFFFF2]">Vaccine</th>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider bg-[#FFFFF2]">Administered By</th>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider bg-[#FFFFF2]">Date Administered</th>
                        <th className="px-3 py-2 md:px-6 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider bg-[#FFFFF2]">Next Due</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 bg-[#FFFFF2]">
                      {filteredVaccinationRecords.length === 0 ? (
                        <tr style={{ background: '#FFFFF2' }}>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-400 text-sm" style={{ background: '#FFFFF2' }}>No vaccination records yet.</td>
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
                            <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-[12px] md:text-sm">{record.vaccineType}</td>
                            <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-[12px] md:text-sm">{record.administeredBy}</td>
                            <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-[12px] md:text-sm">{record.dateAdministered}</td>
                            <td className="px-3 py-2 md:px-6 md:py-4 whitespace-nowrap text-[12px] md:text-sm">{record.nextDueDate}</td>
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
        <DownloadSection 
          onDownload={handleDownloadReport} 
          className="block md:hidden mt-4" 
        />
      </div>
      </div>

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
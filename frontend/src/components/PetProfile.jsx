import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import Modal from './LogoutModal';
import { useAuth } from '../context/AuthContext';

const PetProfile = () => {
  const [pet, setPet] = useState(null);
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { petId } = useParams();
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  // Mock conversations for demonstration - in a real app, these would come from an API
  const mockConversations = [
    {
      id: 1,
      title: "New Conversation",
      is_pinned: false,
      created_at: "2025-11-02T10:00:00Z"
    },
    {
      id: 2,
      title: "Pet Care: Pet Health & Wellness C...",
      is_pinned: true,
      created_at: "2025-11-01T15:30:00Z"
    },
    {
      id: 3,
      title: "New Conversation",
      is_pinned: false,
      created_at: "2025-11-01T14:20:00Z"
    },
    {
      id: 4,
      title: "Pet Care: Itchy Dog: Vet Visit Need...",
      is_pinned: false,
      created_at: "2025-10-31T16:45:00Z"
    },
    {
      id: 5,
      title: "Pet Care: Dog Itching: Causes & Tr...",
      is_pinned: false,
      created_at: "2025-10-31T11:15:00Z"
    }
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
  }, [petId, token, fetchAllPets, fetchPetDetails]);

  const getSpeciesEmoji = (species) => {
    switch ((species || '').toLowerCase()) {
      case 'cat': return '🐱';
      case 'dog': return '🐶';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      default: return '🐾';
    }
  };

  const handlePetSelect = (selectedPetId) => {
    if (selectedPetId !== petId) {
      navigate(`/pet-profile/${selectedPetId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3]"></div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
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
    <div className="min-h-screen flex" style={{ background: '#F0F0F0' }}>
      {/* Fixed Sidebar */}
      <div className="fixed top-0 left-0 h-screen z-50">
        <Sidebar
          sidebarVisible={sidebarVisible}
          currentPage="pet-health-records"
          showSearch={true}
          showPinnedChats={true}
          showRecentChats={true}
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          conversations={mockConversations}
          currentConversationId={null}
          loadingConversations={false}
          onLoadConversation={(conversationId) => {
            console.log('Loading conversation:', conversationId);
            navigate('/chat');
          }}
          onCreateNewConversation={() => navigate('/chat')}
          onPinConversation={(conversationId) => {
            console.log('Pin conversation:', conversationId);
          }}
          onRenameConversation={(conversationId, newTitle) => {
            console.log('Rename conversation:', conversationId, newTitle);
          }}
          onArchiveConversation={(conversationId) => {
            console.log('Archive conversation:', conversationId);
          }}
          onDeleteConversation={(conversationId) => {
            console.log('Delete conversation:', conversationId);
          }}
        />
      </div>

      {/* Main Content with left margin to account for sidebar */}
      <div 
        className="flex-1 flex flex-col bg-[#F0F0F0] min-h-screen"
        style={{
          marginLeft: sidebarVisible ? '320px' : '64px',
          transition: 'margin-left 0.3s ease-in-out'
        }}
      >
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

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <Modal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={async () => {
              await logout();
              setShowLogoutModal(false);
              navigate('/login');
            }}
            title="Confirm Logout"
            message="Are you sure you want to log out?"
          />
        )}

        {/* Main Content Container */}
        <div style={{ width: '100%', padding: '32px 48px 24px 48px' }}>
          {/* Top Pet Selector Circles */}
          <div
            style={{
              background: '#F0F0F0',
              padding: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Add Pet Button */}
            <div
              onClick={() => navigate('/add-pet')}
              style={{
                width: 60, // Reduced size by 20%
                height: 60, // Reduced size by 20%
                background: '#F5E9B8',
                borderRadius: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginLeft: '8px',
                boxShadow: '0 0 0 2px #F0F0F0',
              }}
            >
              <span
                style={{
                  color: '#642A77',
                  fontSize: 38, // Reduced size by 20%
                  fontWeight: 700,
                  fontFamily: 'Raleway',
                  lineHeight: '58px',
                }}
              >
                +
              </span>
            </div>

            {/* Vertical Separator Line */}
            <div
              style={{
                width: '1px',
                height: '60px', // Reduced size by 20%
                background: '#666666',
                margin: '0 16px',
              }}
            ></div>

            {/* Pet Circles */}
            {allPets.map((petItem) => {
              const isSelected = petItem.id.toString() === petId;
              return (
                <div
                  key={petItem.id}
                  onClick={() => handlePetSelect(petItem.id.toString())}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isSelected ? '#F5E9B8' : '#FFFFFF',
                      padding: isSelected ? '10px 20px' : '0',
                      borderRadius: isSelected ? '28px' : '100px', // Reduced size by 20%
                      boxShadow: '0 0 0 2px #F0F0F0',
                      fontFamily: 'Raleway',
                      fontSize: 19, // Reduced size by 20%
                      color: '#34113F',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      width: isSelected ? 190 : 60, // Reduced size by 20%
                      height: 60, // Reduced size by 20%
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <div
                      style={{
                        width: 60, // Reduced size by 20%
                        height: 60, // Reduced size by 20%
                        borderRadius: '100px',
                        overflow: 'hidden',
                        background: '#FFFFFF',
                        boxShadow: '0 0 0 2px #F0F0F0',
                        marginLeft: '-10px', // Adjusted for closer alignment
                      }}
                    >
                      {petItem.image ? (
                        <img
                          src={petItem.image}
                          alt={petItem.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '100px',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span
                            style={{
                              fontSize: 34, // Reduced size by 20%
                              color: '#815FB3',
                              fontWeight: 400,
                              fontFamily: 'Raleway',
                            }}
                          >
                            {getSpeciesEmoji(petItem.animal_type)}
                          </span>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontFamily: 'Raleway',
                          fontSize: 19, // Reduced size by 20%
                          color: '#34113F',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          marginLeft: '10%', // Moved name to the right by 10%
                        }}
                      >
                        {petItem.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Two-column responsive layout: left column for profile/files/download; right column for tables */}
          <div style={{ display: 'flex', gap: 32, padding: '0 8px 24px 8px', alignItems: 'flex-start', width: '100%' }}>
            {/* Left Column - takes remaining space and includes the pet card, files, download */}
            <div style={{ flex: 2, minWidth: 420 }}>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Unified Pet Basic Information Section */}
                <div
                  className="w-full p-8"
                  style={{
                    maxWidth: '100%',
                    margin: '0',
                    background: '#FFFFF2',
                    borderRadius: '10px',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Pet Image */}
                  <div
                    className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative"
                    style={{ borderRadius: '8px 8px 0px 0px' }}
                  >
                    {pet.image ? (
                      <img
                        src={pet.image}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        style={{ borderRadius: '8px 8px 0px 0px' }}
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

                  {/* Pet Name and Breed */}
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      borderBottom: '1px solid #ddd',
                    }}
                  >
                    <h1
                      style={{
                        fontFamily: 'Raleway',
                        fontStyle: 'normal',
                        fontWeight: 800,
                        fontSize: '20px',
                        lineHeight: '23px',
                        color: '#000000',
                      }}
                    >
                      {pet.name}
                    </h1>
                    <p
                      style={{
                        fontFamily: 'Raleway',
                        fontStyle: 'normal',
                        fontWeight: 400,
                        fontSize: '14px',
                        lineHeight: '14px',
                        color: '#000000',
                        marginTop: '5px',
                      }}
                    >
                      {pet.breed || 'Domestic Shorthair'}
                    </p>
                  </div>

                  {/* Quick Info Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-around',
                      padding: '16px',
                    }}
                  >
                    {/* Species */}
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src="mdi_paw.png"
                        alt="Species Icon"
                        style={{ width: '35px', height: '35px', marginBottom: '8px' }}
                      />
                      <p
                        style={{
                          fontFamily: 'Raleway',
                          fontWeight: 500,
                          fontSize: '12px',
                          color: '#000000',
                        }}
                      >
                        Species
                      </p>
                      <p
                        style={{
                          fontFamily: 'Raleway',
                          fontWeight: 700,
                          fontSize: '15px',
                          color: '#000000',
                        }}
                      >
                        {pet.animal_type}
                      </p>
                    </div>

                    {/* Sex */}
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src="solar_health-bold.png"
                        alt="Sex Icon"
                        style={{ width: '35px', height: '35px', marginBottom: '8px' }}
                      />
                      <p
                        style={{
                          fontFamily: 'Raleway',
                          fontWeight: 500,
                          fontSize: '12px',
                          color: '#000000',
                        }}
                      >
                        Sex
                      </p>
                      <p
                        style={{
                          fontFamily: 'Raleway',
                          fontWeight: 700,
                          fontSize: '15px',
                          color: '#000000',
                        }}
                      >
                        {pet.sex}
                      </p>
                    </div>

                    {/* Age */}
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src="mage_calendar-fill.png"
                        alt="Age Icon"
                        style={{ width: '35px', height: '35px', marginBottom: '8px' }}
                      />
                      <p
                        style={{
                          fontFamily: 'Raleway',
                          fontWeight: 500,
                          fontSize: '12px',
                          color: '#000000',
                        }}
                      >
                        Age
                      </p>
                      <p
                        style={{
                          fontFamily: 'Raleway',
                          fontWeight: 700,
                          fontSize: '15px',
                          color: '#000000',
                        }}
                      >
                        {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                      </p>
                    </div>
                  </div>
                </div>

                {/* Files Section */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: 165,
                    background: '#FFFFF2',
                    borderRadius: 10,
                    marginTop: 32,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px 0 24px 0',
                  }}
                >
                  <div
                    style={{
                      marginLeft: 16,
                      marginBottom: 16,
                      fontFamily: 'Raleway',
                      fontWeight: 600,
                      fontSize: 20,
                      lineHeight: '23px',
                      color: '#000',
                    }}
                  >
                    Files
                  </div>
                  {/* Placeholder for no files */}
                  <div
                    style={{
                      marginLeft: 16,
                      width: 362,
                      height: 37,
                      display: 'flex',
                      alignItems: 'center',
                      fontFamily: 'Raleway',
                      fontWeight: 400,
                      fontSize: 16,
                      color: '#000',
                      background: 'none',
                    }}
                  >
                    <svg
                      style={{ width: 24, height: 24, marginRight: 12, color: '#34113F' }}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828A2 2 0 0 0 19.414 7.414l-5.828-5.828A2 2 0 0 0 12.172 1H6zm0 2h6v5a2 2 0 0 0 2 2h5v10H6V4zm8 0v5h5l-5-5z" />
                    </svg>
                    There are no files yet
                  </div>
                </div>

                {/* Download Medical Information Section */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    minHeight: 131,
                    background: '#FFFFF2',
                    borderRadius: 10,
                    marginTop: 24,
                    boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 0',
                  }}
                >
                  <div
                    style={{
                      width: 315,
                      height: 23,
                      fontFamily: 'Raleway',
                      fontWeight: 600,
                      fontSize: 20,
                      lineHeight: '23px',
                      color: '#000',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 24,
                    }}
                  >
                    Download Medical Information
                  </div>
                  <button
                    style={{
                      width: 238,
                      height: 39,
                      background: '#F5E9B8',
                      boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={() => alert('Download not implemented yet')}
                  >
                    <span
                      style={{
                        fontFamily: 'Raleway',
                        fontWeight: 800,
                        fontSize: 16,
                        lineHeight: '19px',
                        color: '#34113F',
                        textAlign: 'center',
                        letterSpacing: '0.05em',
                        width: '100%',
                      }}
                    >
                      Download
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - fixed width so it stays to the right and responds to sidebar */}
            <div style={{ width: 520, maxWidth: '45%', flexShrink: 0 }}>
              {/* Medical Records Panel */}
              <div style={{
                background: '#FFFFF2',
                borderRadius: 10,
                padding: 18,
                boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                marginBottom: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: '#815FB3' }}>MEDICAL RECORDS</div>
                  <button style={{ background: '#F5E9B8', borderRadius: 8, border: 'none', padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>Add</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <input placeholder="Search" style={{ width: 180, padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd' }} />
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#34113F', fontWeight: 600 }}>
                      <th style={{ padding: 8 }}>Service</th>
                      <th style={{ padding: 8 }}>Provider</th>
                      <th style={{ padding: 8 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={3} style={{ padding: 8, color: '#6b7280' }}>No medical records</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Vaccination Records Panel */}
              <div style={{ background: '#FFFFF2', borderRadius: 10, padding: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: '#815FB3' }}>VACCINATION RECORDS</div>
                  <button style={{ background: '#F5E9B8', borderRadius: 8, border: 'none', padding: '6px 12px', cursor: 'pointer', fontWeight: 700 }}>Add</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <input placeholder="Search" style={{ width: 180, padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd' }} />
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#34113F', fontWeight: 600 }}>
                      <th style={{ padding: 8 }}>Vaccine</th>
                      <th style={{ padding: 8 }}>By</th>
                      <th style={{ padding: 8 }}>Date</th>
                      <th style={{ padding: 8 }}>Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td colSpan={4} style={{ padding: 8, color: '#6b7280' }}>No vaccination records</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetProfile;
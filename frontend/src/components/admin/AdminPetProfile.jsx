import React, { useEffect, useState, useCallback } from 'react';
// Helper function to style urgency type
function getUrgencyStyle(urgency) {
  switch (urgency) {
    case 'Critical':
      return { color: '#dc2626', fontWeight: 'bold' };
    case 'High':
      return { color: '#f59e42', fontWeight: 'bold' };
    case 'Medium':
      return { color: '#eab308', fontWeight: 'bold' };
    case 'Low':
      return { color: '#22c55e', fontWeight: 'bold' };
    default:
      return { color: '#64748b' };
  }
}
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminTopNav from './AdminTopNav';
import { X } from 'lucide-react';
import AddVaccinationRecordModal from '../AddVaccinationRecordModal';
import AddMedicalRecordModal from '../AddMedicalRecordModal';
import MedicalRecordDetailsModal from '../MedicalRecordDetailsModal';
import VaccinationRecordDetailsModal from '../VaccinationRecordDetailsModal';

const AdminPetProfile = () => {
  const [showVaccinationRecordModal, setShowVaccinationRecordModal] = useState(false);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [pet, setPet] = useState(null);
    const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState(() => {
    const saved = localStorage.getItem('medicalRecords');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedVaccinationRecord, setSelectedVaccinationRecord] = useState(null);
  const [showVaccinationDetailsModal, setShowVaccinationDetailsModal] = useState(false);
  const [vaccinationRecords, setVaccinationRecords] = useState(() => {
    const saved = localStorage.getItem('vaccinationRecords');
    return saved ? JSON.parse(saved) : [];
  });
  const { petId } = useParams();
  const navigate = useNavigate();
  const { adminAxios } = useAdminAuth();

  // const mockFiles = [
  //   { id: 1, name: 'Blood Test - 060225.pdf', size: '225 kb' },
  //   { id: 2, name: 'Surgery - 082624.pdf', size: '225 kb' },
  //   { id: 3, name: 'Surgery - 082624.pdf', size: '225 kb' }
  // ];

  // Fetch pet details using adminAxios
  const fetchPetDetails = useCallback(async () => {
    setLoading(true);
    try {
      // Extract numeric ID from petId (e.g., RP-000008 -> 8)
      let numericId = petId;
      if (typeof petId === 'string' && petId.startsWith('RP-')) {
        numericId = petId.replace('RP-', '').replace(/^0+/, '');
      }
      const response = await adminAxios.get(`/admin/pets/${numericId}`);
      setPet(response.data.pet || response.data.data || response.data);
    } catch (error) {
      setPet(null);
    } finally {
      setLoading(false);
    }
  }, [petId, adminAxios]);

  useEffect(() => {
    fetchPetDetails();
  }, [fetchPetDetails]);
  // Helper to get numeric pet ID
  const getNumericId = (id) => {
    if (typeof id === 'string' && id.startsWith('RP-')) {
      return id.replace('RP-', '').replace(/^0+/, '');
    }
    return id;
  };

  // Use diagnosisService to fetch diagnoses for admin
  useEffect(() => {
    fetchPetDetails();
    const fetchDiagnoses = async () => {
      try {
        const numericId = getNumericId(petId);
        // Use adminAxios to call the admin diagnoses endpoint
  const response = await adminAxios.get(`/admin/pets/${numericId}/diagnoses`);
        setDiagnoses(response.data.diagnoses || []);
      } catch (error) {
        setDiagnoses([]);
      }
    };
    fetchDiagnoses();
  }, [fetchPetDetails, petId, adminAxios]);

  const getSpeciesEmoji = (species) => {
    switch (species?.toLowerCase()) {
      case 'dog': return '🐕';
      case 'cat': return '🐱';
      default: return '🐾';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0F0F0]">
        <div className="text-lg">Loading Pet Profile...</div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F0F0F0]">
        <AdminTopNav activePage="Pets" />
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pet Not Found</h2>
            <p className="text-gray-600 mb-4">The pet you&apos;re looking for doesn&apos;t exist.</p>
            <button
              onClick={() => navigate('/admin/pets')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Back to Pets List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pet Info Bar
  const PetInfoBar = () => (
    <div className="mx-6 mt-[90px] mb-6 px-8 py-4 bg-[#FBFBF3] rounded-lg shadow-sm flex items-center justify-between" style={{zIndex:2, position:'relative'}}>
      <div className="flex items-center gap-12">
        {/* Pet Owner */}
        <div>
          <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            {pet.owner_name || 'N/A'}
          </h3>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Raleway' }}>
            Pet Owner
          </p>
        </div>
        {/* Pet ID */}
        <div>
          <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            {pet.pet_id || pet.id}
          </h3>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Raleway' }}>
            Pet ID
          </p>
        </div>
        {/* Registered Date */}
        <div>
          <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            {formatDate(pet.registered_date || pet.created_at)}
          </h3>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Raleway' }}>
            Registered Date
          </p>
        </div>
      </div>
      {/* Close Button */}
      <button 
        onClick={() => navigate('/admin/pets')} 
        className="text-gray-500 hover:text-red-600 transition-colors"
        title="Close and go back to pets list"
      >
        <X size={28} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F0F0]">
      <AdminTopNav activePage="Pets" />
      <PetInfoBar />
      <div className="flex-1 px-6 pb-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Pet Info */}
          <div className="space-y-6">
            <div 
              className="rounded-lg overflow-hidden"
              style={{ backgroundColor: '#FFFFF2', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}
            >
              <div className="relative" style={{ height: '320px' }}>
                {pet.photo || pet.image ? (
                  <img 
                    src={pet.photo || pet.image} 
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
                <div 
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}
                ></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 
                      className="text-white font-bold"
                      style={{ fontFamily: 'Raleway', fontSize: '28px', lineHeight: '32px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                    >
                      {pet.name}
                    </h1>
                  </div>
                  <p 
                    className="text-white"
                    style={{ fontFamily: 'Raleway', fontSize: '16px', lineHeight: '19px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {pet.breed || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {/* Species */}
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <img src="/mdi_paw.png" alt="Species" className="w-[35px] h-[35px]" />
                    </div>
                    <p className="text-gray-600 mb-1" style={{ fontFamily: 'Raleway', fontSize: '12px', fontWeight: 500 }}>
                      Species
                    </p>
                    <p className="text-gray-900 font-bold" style={{ fontFamily: 'Raleway', fontSize: '14px' }}>
                      {pet.species ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1) : 'N/A'}
                    </p>
                  </div>
                  {/* Sex */}
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <img src="/solar_health-bold.png" alt="Sex" className="w-[35px] h-[35px]" />
                    </div>
                    <p className="text-gray-600 mb-1" style={{ fontFamily: 'Raleway', fontSize: '12px', fontWeight: 500 }}>
                      Sex
                    </p>
                    <p className="text-gray-900 font-bold" style={{ fontFamily: 'Raleway', fontSize: '14px' }}>
                      {pet.sex ? pet.sex.charAt(0).toUpperCase() + pet.sex.slice(1) : 'N/A'}
                    </p>
                  </div>
                  {/* Age */}
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <img src="/mage_calendar-fill.png" alt="Age" className="w-[35px] h-[35px]" />
                    </div>
                    <p className="text-gray-600 mb-1" style={{ fontFamily: 'Raleway', fontSize: '12px', fontWeight: 500 }}>
                      Age
                    </p>
                    <p className="text-gray-900 font-bold" style={{ fontFamily: 'Raleway', fontSize: '14px' }}>
                      {typeof pet.age !== 'undefined' ? `${pet.age} years old` : 'N/A'}
                    </p>
                  </div>
                </div>
                {/* Medical Information Section */}
                <div>
                  <h3 className="text-gray-900 mb-6" style={{ fontFamily: 'Raleway', fontSize: '20px', fontWeight: 600, lineHeight: '23px' }}>
                    Medical Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src="/healthicons_blood-drop-24px.png" alt="Blood Type" className="w-6 h-6" />
                        <span className="text-gray-700" style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500 }}>
                          Blood Type
                        </span>
                      </div>
                      <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Raleway', fontSize: '14px' }}>
                        {pet.blood_type || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src="/mynaui_heart-x-solid.png" alt="Spayed/Neutered" className="w-6 h-6" />
                        <span className="text-gray-700" style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500 }}>
                          Spayed/Neutered
                        </span>
                      </div>
                      <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Raleway', fontSize: '14px' }}>
                        {typeof pet.spayed_neutered !== 'undefined' ? (pet.spayed_neutered ? 'Yes' : 'No') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src="/material-symbols-light_pet-supplies.png" alt="Allergies" className="w-6 h-6" />
                        <span className="text-gray-700" style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500 }}>
                          Allergies
                        </span>
                      </div>
                      <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Raleway', fontSize: '14px' }}>
                        {pet.allergies || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img src="/fa6-solid_disease.png" alt="Chronic Disease" className="w-6 h-6" />
                        <span className="text-gray-700" style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 500 }}>
                          Chronic Disease
                        </span>
                      </div>
                      <span className="text-gray-900 font-semibold" style={{ fontFamily: 'Raleway', fontSize: '14px' }}>
                        {pet.chronic_disease || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Files Card */}
            <div className="rounded-lg p-6" style={{ background: '#FFFFF2', borderRadius: '10px' }}>
              <h3 className="mb-4" style={{ fontFamily: 'Raleway', fontSize: '20px', fontWeight: 600, color: '#333333' }}>
                Files
              </h3>
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <svg className="w-12 h-12" fill="#CCCCCC" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z"/><polyline points="13,2 13,9 20,9"/></svg>
                </div>
                <p style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 400, color: '#999999' }}>
                  There are no files yet.
                </p>
              </div>
            </div>
            {/* Download Card */}
            <div className="rounded-lg p-6" style={{ background: '#FFFFF2', borderRadius: '10px' }}>
              <div className="text-center">
                <h4 className="mb-4" style={{ fontFamily: 'Raleway', fontSize: '20px', fontWeight: 600, color: '#333333' }}>
                  Download Medical Information
                </h4>
                <button 
                  className="px-8 py-3 rounded-lg font-medium transition-colors hover:opacity-90"
                  style={{ background: '#F5E9B8', color: '#4A0E4E', fontFamily: 'Raleway', fontSize: '16px', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', border: 'none' }}
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
              <div className="flex items-center mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold flex items-center" style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#815FB3' }}>
                    MEDICAL RECORDS
                  </h3>
                  <button 
                    onClick={() => setShowMedicalRecordModal(true)}
                    className="rounded text-center transition-colors hover:opacity-90"
                    style={{ width: '50px', height: '27px', background: '#F5E9B8', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '10px', border: 'none', fontFamily: 'Raleway', fontWeight: 800, fontSize: '12px', color: '#34113F' }}
                  >
                    Add
                  </button>
                </div>
                <div className="ml-auto">
                  <input
                    type="text"
                    placeholder="Search"
                    className="px-3 py-1 rounded text-sm"
                    style={{ border: '1px solid #666666', borderRadius: '5px', fontFamily: 'Raleway', fontSize: '12px', color: '#666666', backgroundColor: '#FFFFFF', width: '250px', height: '25px', outline: 'none' }}
                  />
                </div>
              </div>
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
              <div className="flex items-center mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold flex items-center" style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#815FB3' }}>
                    VACCINATION RECORDS
                  </h3>
                  <button 
                    onClick={() => setShowVaccinationRecordModal(true)}
                    className="rounded text-center transition-colors hover:opacity-90"
                    style={{ width: '50px', height: '27px', background: '#F5E9B8', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '10px', border: 'none', fontFamily: 'Raleway', fontWeight: 800, fontSize: '12px', color: '#34113F' }}
                  >
                    Add
                  </button>
                </div>
                <div className="ml-auto">
                  <input
                    type="text"
                    placeholder="Search"
                    className="px-3 py-1 rounded text-sm"
                    style={{ border: '1px solid #666666', borderRadius: '5px', fontFamily: 'Raleway', fontSize: '12px', color: '#666666', backgroundColor: '#FFFFFF', width: '250px', height: '25px', outline: 'none' }}
                  />
                </div>
              </div>
              <div className="rounded-lg" style={{ background: '#FFFFF2', borderRadius: '10px' }}>
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
                          onClick={() => { setSelectedVaccinationRecord(idx); setShowVaccinationDetailsModal(true); }}
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
            {/* AI Diagnosis Section - Admin Format, filtered by petId */}
            <div className="rounded-lg p-6" style={{ background: '#FFFFF2', borderRadius: '10px' }}>
              <h3 className="mb-4" style={{ fontFamily: 'Raleway', fontSize: '20px', fontWeight: 600, color: '#333333' }}>
                AI Assessments
              </h3>
              {(() => {
                // Normalize petId for comparison
                const numericPetId = typeof petId === 'string' && petId.startsWith('RP-') ? petId.replace('RP-', '').replace(/^0+/, '') : String(petId);
                // Filter diagnoses for this pet
                const filteredDiagnoses = diagnoses.filter(
                  diag => String(diag.pet_id) === numericPetId || String(diag.pet?.id) === numericPetId
                );
                return filteredDiagnoses.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredDiagnoses.map((diag, idx) => (
                      <div key={diag.case_id || idx} className="rounded-lg p-4 shadow" style={{ background: '#F7F7F7', border: '1px solid #E5E7EB' }}>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                          <span className="font-bold text-[#815FB3]" style={{ fontFamily: 'Raleway', fontSize: '16px' }}>Case ID: {diag.case_id}</span>
                          <span style={getUrgencyStyle(diag.urgency || diag.flag_level)}>{diag.urgency || diag.flag_level}</span>
                        </div>
                        <div className="mb-1">
                          <span className="font-semibold text-gray-700" style={{ fontFamily: 'Raleway', fontSize: '15px' }}>Main Condition:</span>
                          <span className="ml-2 text-gray-900" style={{ fontFamily: 'Raleway', fontWeight: 600 }}>{diag.main_condition || diag.top_condition || 'N/A'}</span>
                        </div>
                        <div className="mb-1">
                          <span className="font-semibold text-gray-700" style={{ fontFamily: 'Raleway', fontSize: '15px' }}>Likelihood:</span>
                          <span className="ml-2 text-gray-900" style={{ fontFamily: 'Raleway', fontWeight: 600 }}>{typeof diag.likelihood !== 'undefined' ? `${(diag.likelihood * 100).toFixed(1)}%` : 'N/A'}</span>
                        </div>
                        <div className="mb-1">
                          <span className="font-semibold text-gray-700" style={{ fontFamily: 'Raleway', fontSize: '15px' }}>Date Generated:</span>
                          <span className="ml-2 text-gray-900" style={{ fontFamily: 'Raleway', fontWeight: 600 }}>{diag.date_generated ? formatDate(diag.date_generated) : 'N/A'}</span>
                        </div>
                        {diag.subjective_snippet && (
                          <div className="mb-1">
                            <span className="font-semibold text-gray-700" style={{ fontFamily: 'Raleway', fontSize: '15px' }}>Summary:</span>
                            <span className="ml-2 text-gray-900" style={{ fontFamily: 'Raleway', fontWeight: 400 }}>{diag.subjective_snippet}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p style={{ fontFamily: 'Raleway', fontSize: '14px', fontWeight: 400, color: '#999999' }}>
                      No AI diagnosis found for this pet.
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <AddMedicalRecordModal
        isOpen={showMedicalRecordModal}
        onClose={() => setShowMedicalRecordModal(false)}
        onSave={record => {
          setMedicalRecords(prev => [...prev, record]);
          setShowMedicalRecordModal(false);
        }}
      />
      <AddVaccinationRecordModal
        isOpen={showVaccinationRecordModal}
        onClose={() => setShowVaccinationRecordModal(false)}
        onSave={record => {
          setVaccinationRecords(prev => [...prev, record]);
          setShowVaccinationRecordModal(false);
        }}
      />
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

export default AdminPetProfile;

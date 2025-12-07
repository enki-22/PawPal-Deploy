import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../context/ConversationsContext';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import LogoutModal from './LogoutModal';
import './SymptomTimeline.css';
import SymptomLogger from './SymptomLogger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/chatbot';

const SymptomTimeline = ({ petId: propPetId, pet: propPet }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPetId, setSelectedPetId] = useState(propPetId || null);
  const [selectedPet, setSelectedPet] = useState(propPet || null);
  const [pets, setPets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [latestTrend, setLatestTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogger, setShowLogger] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { token, logout } = useAuth();
  
  const {
    conversations,
    loadingConversations,
    fetchConversations,
    handlePinConversation,
    handleRenameConversation,
    handleArchiveConversation,
    handleDeleteConversation
  } = useConversations();
  
  // Check if we should show logger immediately (from diagnosis navigation)
  useEffect(() => {
    if (location.state?.prefillSymptoms && location.state?.fromDiagnosis) {
      // Wait for pet to be loaded before showing logger as modal
      if (selectedPet) {
        setShowLogger(true);
      }
    }
  }, [location.state, selectedPet]);

  // Fetch user's pets
  useEffect(() => {
    fetchUserPets();
  }, []);

  // Load data when pet is selected
  useEffect(() => {
    if (selectedPetId) {
      loadData();
    }
  }, [selectedPetId]);

  const fetchUserPets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/get-user-pets/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.pets) {
        setPets(response.data.pets);
        // Auto-select first pet if no petId provided
        if (!selectedPetId && response.data.pets.length > 0) {
          const firstPet = response.data.pets[0];
          setSelectedPetId(firstPet.id);
          setSelectedPet(firstPet);
        } else if (selectedPetId) {
          // Find and set the selected pet
          const pet = response.data.pets.find(p => p.id === selectedPetId);
          if (pet) {
            setSelectedPet(pet);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
    }
  };

  const loadData = async () => {
    if (!selectedPetId) return;
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/symptom-tracker/health-timeline/?pet_id=${selectedPetId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setLogs(response.data.logs || []);
      setLatestTrend(response.data.latest_trend || null);
    } catch (err) {
      console.error('Error loading timeline:', err);
      // Extract error message as string (handle both string and object errors)
      const errorData = err.response?.data?.error;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (errorData?.message || errorData?.error || err.message || 'Failed to load health timeline');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePetSelect = (petId) => {
    const pet = pets.find(p => p.id === petId);
    setSelectedPetId(petId);
    setSelectedPet(pet);
    setShowLogger(false);
  };

  const handleLogComplete = () => {
    setShowLogger(false);
    loadData(); // Refresh timeline
  };

  const handleRunNewAssessment = () => {
    // Navigate to chat with symptom checker mode and context
    navigate('/chat/new', {
      state: {
        mode: 'symptom_checker',
        reason: 'worsening_trend',
        history_summary: latestTrend?.trend_analysis || '',
        petId: selectedPetId,
        petName: selectedPet?.name || 'Your Pet'
      }
    });
  };

  // Logout modal handlers
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      navigate('/petowner/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleSidebarConversationSelect = (id) => {
    navigate(`/chat/${id}`);
    setIsMobileSidebarOpen(false);
  };

  // Get risk score color
  const getRiskColor = (score) => {
    if (score >= 70) return '#ef4444'; // Red - Critical
    if (score >= 50) return '#f59e0b'; // Orange - High
    if (score >= 30) return '#eab308'; // Yellow - Moderate
    return '#10b981'; // Green - Low
  };

  // Get urgency badge color
  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format symptom name
  const formatSymptomName = (symptom) => {
    return symptom
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Prepare chart data - show max severity per day
  const chartData = logs.map(log => {
    const severityScores = log.severity_scores || {};
    const maxSeverity = Object.values(severityScores).length > 0
      ? Math.max(...Object.values(severityScores))
      : 5; // Default to 5 if no scores
    
    // Get top 2 symptoms by severity
    const sortedSymptoms = Object.entries(severityScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);
    
    const dataPoint = {
      date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: log.log_date,
      maxSeverity: maxSeverity,
      symptoms: log.symptoms || []
    };
    
    // Add top 2 symptoms as separate lines
    sortedSymptoms.forEach(([symptom, severity], index) => {
      dataPoint[`symptom_${index + 1}`] = severity;
      dataPoint[`symptom_${index + 1}_name`] = formatSymptomName(symptom);
    });
    
    return dataPoint;
  });

  // Main layout wrapper component - matches PetHealthRecords.jsx structure exactly
  // Defined before early returns so it can be used in loading/error states
  const MainLayout = ({ children }) => (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block sticky top-0 h-screen z-30">
        <Sidebar
          sidebarVisible={sidebarVisible}
          currentPage="symptom-tracker"
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          conversations={conversations}
          loadingConversations={loadingConversations}
          onLoadConversation={handleSidebarConversationSelect}
          onCreateNewConversation={() => navigate('/chat/new')}
          onPinConversation={handlePinConversation}
          onRenameConversation={handleRenameConversation}
          onArchiveConversation={handleArchiveConversation}
          onDeleteConversation={handleDeleteConversation}
          isMobileOverlay={false}
        />
      </div>

      {/* Mobile Sidebar Overlay with Transitions - matches PetHealthRecords exactly */}
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
            currentPage="symptom-tracker"
            onToggleSidebar={() => setIsMobileSidebarOpen(false)}
            conversations={conversations}
            loadingConversations={loadingConversations}
            onLoadConversation={(id) => {
              handleSidebarConversationSelect(id);
              setIsMobileSidebarOpen(false);
            }}
            onCreateNewConversation={() => {
              navigate('/chat/new');
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

      {/* Main Content Area - flex-1 - matches PetHealthRecords */}
      <div className="flex-1 flex flex-col bg-white h-screen w-full">
        {/* Header - Stationary - Responsive - matches PetHealthRecords exactly */}
        <div className="border-b p-2 md:p-4 flex flex-row items-center justify-between gap-2 md:gap-0 sticky top-0 z-20 bg-[#DCCEF1] md:bg-[#F0F0F0]">
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
              <img src="/pat-removebg-preview 2.png" alt="PawPal Logo" className="w-8 h-8" />
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
                Symptom Tracker
              </h2>
            </div>
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
        </div>
        {/* Page name below header for mobile - matches PetHealthRecords */}
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#F0F0F0', paddingTop: '56px' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            Symptom Tracker
          </h2>
        </div>

        {/* Main Content - Scrollable - matches PetHealthRecords spacing */}
        <div className="flex-1 overflow-y-auto bg-[#F0F0F0] p-2 md:p-6" style={{ paddingTop: '20px' }}>
          <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto w-full">
            {children}
          </div>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        loading={false}
      />
    </div>
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#815FB3] mx-auto mb-4"></div>
            <p className="text-gray-600" style={{ fontFamily: 'Raleway' }}>Loading health timeline...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    // Ensure error is a string for rendering
    const errorText = typeof error === 'string' ? error : (error?.message || error?.toString() || 'An unknown error occurred');
    return (
      <MainLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2" style={{ fontFamily: 'Raleway' }}>⚠️ Error Loading Timeline</h3>
          <p className="text-red-600 mb-4" style={{ fontFamily: 'Raleway' }}>{errorText}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            style={{ fontFamily: 'Raleway' }}
          >
            Try Again
          </button>
        </div>
      </MainLayout>
    );
  }

  // Note: Logger is now shown as a modal, not a full-page view

  // Pet selection screen
  if (!selectedPetId && pets.length > 0) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Raleway' }}>Select a Pet</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => handlePetSelect(pet.id)}
                className="p-6 bg-[#FFFFF2] rounded-xl shadow-md hover:shadow-lg transition-shadow text-left"
                style={{ fontFamily: 'Raleway' }}
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{pet.name}</h3>
                <p className="text-gray-600">{pet.animal_type}</p>
              </button>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }


  if (!logs || logs.length === 0) {
    return (
      <MainLayout>
        <div className="text-center py-12 bg-[#FFFFF2] rounded-xl shadow-md p-8">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Raleway' }}>No Symptom Logs Yet</h3>
          <p className="text-gray-600 mb-6" style={{ fontFamily: 'Raleway' }}>
            Start tracking {selectedPet?.name || 'your pet'}&apos;s symptoms to see progression over time.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/chat"
              className="px-6 py-3 bg-[#815FB3] text-white rounded-xl hover:bg-[#6a4c9c] font-semibold transition-colors"
              style={{ fontFamily: 'Raleway' }}
            >
              💬 Log via Chat
            </Link>
            <button
              onClick={() => setShowLogger(true)}
              className="px-6 py-3 bg-[#DCCEF1] text-[#34113F] rounded-xl hover:bg-[#c9b8e8] font-semibold border border-[#815FB3] transition-colors"
              style={{ fontFamily: 'Raleway' }}
            >
              📝 Manual Log
            </button>
          </div>
        </div>

        {/* Manual Log Modal */}
        {showLogger && selectedPet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Raleway' }}>Manual Symptom Log Entry</h3>
                <button
                  onClick={() => setShowLogger(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="p-6">
                <SymptomLogger 
                  pet={selectedPet} 
                  onComplete={handleLogComplete}
                />
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Worsening Alert Banner - Prominent at Top */}
      {latestTrend && latestTrend.alert_needed && (
        <div className="mb-6 bg-red-600 text-white rounded-xl shadow-lg p-6 border-l-4 border-red-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Raleway' }}>Worsening Trend Detected</h3>
                <p className="text-red-50 mb-4" style={{ fontFamily: 'Raleway' }}>
                  Our AI analysis indicates your pet&apos;s symptoms are showing a concerning trend. 
                  We recommend running a new AI Assessment to get updated insights.
                </p>
                <button
                  onClick={handleRunNewAssessment}
                  className="px-6 py-3 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors shadow-md"
                  style={{ fontFamily: 'Raleway' }}
                >
                  🔍 Run New Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Raleway' }}>📊 Health Timeline</h2>
          {selectedPet && (
            <div className="text-gray-600" style={{ fontFamily: 'Raleway' }}>
              <span className="font-semibold">{selectedPet.name}</span>
              <span className="mx-2">•</span>
              <span>{selectedPet.animal_type}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {pets.length > 1 && (
            <select
              value={selectedPetId}
              onChange={(e) => handlePetSelect(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
              style={{ fontFamily: 'Raleway' }}
            >
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          )}
          {/* Log Symptoms Button - Primary Action */}
          <button
            onClick={() => setShowLogger(true)}
            className="px-4 py-2 bg-[#815FB3] text-white rounded-xl hover:bg-[#6a4c9c] font-medium transition-colors shadow-sm"
            style={{ fontFamily: 'Raleway' }}
            title="Log symptoms"
          >
            📝 Log Symptoms
          </button>
        </div>
      </div>

      {/* AI Insight Header - Main Focus */}
      {latestTrend && (
        <div className="mb-6 bg-[#FFFFF2] rounded-xl shadow-lg p-6 border-2 border-[#DCCEF1]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Risk Score Badge */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                style={{ backgroundColor: getRiskColor(latestTrend.risk_score) }}
              >
                {latestTrend.risk_score}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Raleway' }}>AI Health Analysis</h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Raleway' }}>
                  Last updated: {new Date(latestTrend.analysis_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full border font-semibold ${getUrgencyColor(latestTrend.urgency_level)}`} style={{ fontFamily: 'Raleway' }}>
              {latestTrend.urgency_level}
            </span>
          </div>

          {/* Alert Indicator (Smaller, since we have prominent banner above) */}
          {latestTrend.alert_needed && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <strong className="text-red-800" style={{ fontFamily: 'Raleway' }}>Alert Status Active</strong>
                  <p className="text-red-700 text-sm mt-1" style={{ fontFamily: 'Raleway' }}>
                    See the alert banner above for recommended action.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trend Analysis */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Trend Analysis</h4>
            <p className="text-gray-600" style={{ fontFamily: 'Raleway' }}>{latestTrend.trend_analysis}</p>
          </div>

          {/* Prediction */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>24-Hour Forecast</h4>
            <p className="text-gray-600" style={{ fontFamily: 'Raleway' }}>{latestTrend.prediction}</p>
          </div>
        </div>
      )}

      {/* Trend Chart - Main Focus */}
      {chartData.length > 0 && (
        <div className="mb-6 bg-[#FFFFF2] rounded-xl shadow-lg p-6 border-2 border-[#DCCEF1]">
          <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Raleway' }}>📈 Severity Over Time</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Severity (1-10)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-gray-800 mb-2">{data.fullDate}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          Max Severity: <strong>{data.maxSeverity}/10</strong>
                        </p>
                        {data.symptoms && data.symptoms.length > 0 && (
                          <p className="text-sm text-gray-600">
                            Symptoms: {data.symptoms.map(s => formatSymptomName(s)).join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="maxSeverity"
                stroke="#815FB3"
                strokeWidth={3}
                name="Max Severity"
                dot={{ r: 4 }}
              />
              {chartData[0]?.symptom_1 && (
                <Line
                  type="monotone"
                  dataKey="symptom_1"
                  stroke="#10b981"
                  strokeWidth={2}
                  name={chartData[0]?.symptom_1_name || 'Top Symptom 1'}
                  dot={{ r: 3 }}
                />
              )}
              {chartData[0]?.symptom_2 && (
                <Line
                  type="monotone"
                  dataKey="symptom_2"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name={chartData[0]?.symptom_2_name || 'Top Symptom 2'}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log History */}
      <div className="bg-[#FFFFF2] rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Raleway' }}>📋 Log History</h3>
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className="border border-[#DCCEF1] rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800" style={{ fontFamily: 'Raleway' }}>
                    {new Date(log.log_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h4>
                  <p className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Symptoms */}
              {log.symptoms && log.symptoms.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Raleway' }}>Symptoms: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {log.symptoms.map((symptom, idx) => {
                      const severity = log.severity_scores?.[symptom] || 5;
                      return (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-[#DCCEF1] text-[#34113F] rounded text-xs"
                          style={{ fontFamily: 'Raleway' }}
                        >
                          {formatSymptomName(symptom)}
                          {log.severity_scores && (
                            <span className="ml-1 font-semibold">({severity}/10)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {log.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Raleway' }}>
                    <span className="font-medium">Notes: </span>
                    {log.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Manual Log Option - Shown as Modal */}
      {showLogger && selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Raleway' }}>Manual Symptom Log Entry</h3>
              <button
                onClick={() => setShowLogger(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {location.state?.fromDiagnosis && (
                <div className="mb-4 p-3 bg-[#DCCEF1] border border-[#815FB3] rounded-lg">
                  <p className="text-sm text-[#34113F]" style={{ fontFamily: 'Raleway' }}>
                    💡 <strong>Pre-filled from diagnosis:</strong> Symptoms from your recent assessment have been pre-selected. 
                    Adjust severity and add any additional observations.
                  </p>
                </div>
              )}
              <SymptomLogger 
                pet={selectedPet} 
                onComplete={handleLogComplete}
              />
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SymptomTimeline;

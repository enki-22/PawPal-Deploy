import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-[#FFFFF2] rounded-xl shadow-sm border border-[#E0E0E0] max-w-2xl mx-auto mt-8">
          <img 
            src="/si_ai-note-fill.png" 
            alt="No Logs" 
            className="w-20 h-20 mb-6 opacity-90"
            style={{ clipPath: 'inset(6% 6% 6% 6%)', objectFit: 'cover' }}
          />
          <h3 className="text-2xl font-bold text-[#34113F] mb-3 text-center" style={{ fontFamily: 'Raleway' }}>
            No Symptom Logs Yet
          </h3>
          <p className="text-[#555555] mb-8 text-center max-w-md text-lg" style={{ fontFamily: 'Raleway', lineHeight: '1.6' }}>
            Start tracking {selectedPet?.name || 'your pet'}&apos;s symptoms to see progression over time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            {/* Log via Chat Button */}
            <button
              onClick={() => navigate('/chat/new')}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#F5E9B8] rounded-xl hover:bg-[#ebd78c] transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 w-full sm:w-auto"
            >
              <img 
                src="/material-symbols_chat.png" 
                alt="Chat" 
                className="w-6 h-6"
              />
              <span className="font-bold text-[#34113F] text-lg" style={{ fontFamily: 'Raleway' }}>
                Log via Chat
              </span>
            </button>

            {/* Manual Log Button */}
            <button
              onClick={() => setShowLogger(true)}
              className="group flex items-center justify-center gap-3 px-8 py-4 bg-[#F5E9B8] rounded-xl hover:bg-[#ebd78c] transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 w-full sm:w-auto"
            >
              <img 
                src="/icon-park-solid_notebook-and-pen.png" 
                alt="Manual" 
                className="w-6 h-6"
              />
              <span className="font-bold text-[#34113F] text-lg" style={{ fontFamily: 'Raleway' }}>
                Manual Log
              </span>
            </button>
          </div>
        </div>

        {/* Manual Log Modal */}
        {showLogger && selectedPet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#FFFFF2] border-b border-[#E0E0E0] p-5 flex justify-between items-center z-10">
                <h3 className="text-xl font-bold text-[#34113F]" style={{ fontFamily: 'Raleway' }}>
                  Manual Symptom Log Entry
                </h3>
                <button
                  onClick={() => setShowLogger(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[#34113F] font-bold text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="p-6 bg-white">
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
        <div className="mb-6 bg-red-50 text-red-900 rounded-xl shadow-md p-6 border border-red-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-2 bg-red-100 rounded-full">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 text-red-800" style={{ fontFamily: 'Raleway' }}>Worsening Trend Detected</h3>
                <p className="text-red-700 mb-4 leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                  Our AI analysis indicates your pet&apos;s symptoms are showing a concerning trend. 
                  We recommend running a new AI Assessment to get updated insights.
                </p>
                <button
                  onClick={handleRunNewAssessment}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm text-sm"
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
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#34113F] mb-1" style={{ fontFamily: 'Raleway' }}>
            📊 Health Timeline
          </h2>
          {selectedPet && (
            <div className="text-gray-600 font-medium text-sm" style={{ fontFamily: 'Raleway' }}>
              <span className="text-[#815FB3] font-bold text-lg">{selectedPet.name}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span>{selectedPet.animal_type}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {pets.length > 1 && (
            <select
              value={selectedPetId}
              onChange={(e) => handlePetSelect(parseInt(e.target.value))}
              className="px-4 py-2.5 border-2 border-[#E0E0E0] rounded-lg bg-white text-[#34113F] font-bold focus:outline-none focus:border-[#815FB3] cursor-pointer"
              style={{ fontFamily: 'Raleway' }}
            >
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          )}
          {/* Log Symptoms Button - Primary Action - Navigates to Chat */}
          <button
            onClick={() => navigate('/chat/new')}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-[#815FB3] text-white rounded-lg hover:bg-[#6D4C9A] font-bold transition-all shadow-md active:transform active:scale-95"
            style={{ fontFamily: 'Raleway' }}
            title="Log symptoms via chat"
          >
            📝 Log Symptoms
          </button>
        </div>
      </div>

      {/* AI Insight Header - Main Focus */}
      {latestTrend && (
        <div className="mb-8 bg-[#FFFFF2] rounded-xl shadow-sm p-6 border border-[#E0E0E0]">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
            <div className="flex items-center gap-5">
              {/* Risk Score Badge */}
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-md transform rotate-3"
                style={{ backgroundColor: getRiskColor(latestTrend.risk_score) }}
              >
                {latestTrend.risk_score}
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#34113F] mb-1" style={{ fontFamily: 'Raleway' }}>AI Health Analysis</h3>
                <p className="text-sm text-gray-500 font-medium" style={{ fontFamily: 'Raleway' }}>
                  Last updated: {new Date(latestTrend.analysis_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span 
              className={`px-4 py-1.5 rounded-full border-2 font-bold text-sm uppercase tracking-wide ${getUrgencyColor(latestTrend.urgency_level)}`} 
              style={{ fontFamily: 'Raleway' }}
            >
              {latestTrend.urgency_level} Risk
            </span>
          </div>

          {/* Alert Indicator (Smaller, since we have prominent banner above) */}
          {latestTrend.alert_needed && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚨</span>
                <div>
                  <strong className="text-red-900 block font-bold" style={{ fontFamily: 'Raleway' }}>Alert Status Active</strong>
                  <p className="text-red-700 text-sm mt-0.5" style={{ fontFamily: 'Raleway' }}>
                    See the alert banner above for recommended action.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trend Analysis */}
            <div className="bg-white p-4 rounded-xl border border-[#F0F0F0]">
              <h4 className="font-bold text-[#815FB3] mb-2 flex items-center gap-2" style={{ fontFamily: 'Raleway' }}>
                <span className="text-lg">📈</span> Trend Analysis
              </h4>
              <p className="text-gray-700 leading-relaxed text-sm" style={{ fontFamily: 'Raleway' }}>{latestTrend.trend_analysis}</p>
            </div>

            {/* Prediction */}
            <div className="bg-white p-4 rounded-xl border border-[#F0F0F0]">
              <h4 className="font-bold text-[#815FB3] mb-2 flex items-center gap-2" style={{ fontFamily: 'Raleway' }}>
                <span className="text-lg">🔮</span> 24-Hour Forecast
              </h4>
              <p className="text-gray-700 leading-relaxed text-sm" style={{ fontFamily: 'Raleway' }}>{latestTrend.prediction}</p>
            </div>
          </div>
        </div>
      )}

      {/* Trend Chart - Main Focus */}
      {chartData.length > 0 && (
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-[#E0E0E0]">
          <h3 className="text-lg font-bold text-[#34113F] mb-6 pl-2 border-l-4 border-[#815FB3]" style={{ fontFamily: 'Raleway' }}>
            Severity Progression
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#666' }}
                stroke="#ccc"
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 12, fill: '#666' }}
                stroke="#ccc"
                tickLine={false}
                axisLine={false}
                label={{ value: 'Severity (1-10)', angle: -90, position: 'insideLeft', fill: '#999', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: '#815FB3', strokeWidth: 1, strokeDasharray: '5 5' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border-none rounded-xl shadow-xl p-4 ring-1 ring-black/5">
                        <p className="font-bold text-[#34113F] mb-3 border-b pb-2">{data.fullDate}</p>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 flex justify-between gap-4">
                            <span>Max Severity:</span>
                            <strong className="text-[#815FB3]">{data.maxSeverity}/10</strong>
                          </p>
                          {data.symptoms && data.symptoms.length > 0 && (
                            <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg">
                              <span className="font-semibold block mb-1">Active Symptoms:</span>
                              {data.symptoms.map(s => formatSymptomName(s)).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line
                type="monotone"
                dataKey="maxSeverity"
                stroke="#815FB3"
                strokeWidth={4}
                name="Overall Severity"
                dot={{ r: 4, fill: '#815FB3', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#815FB3' }}
              />
              {chartData[0]?.symptom_1 && (
                <Line
                  type="monotone"
                  dataKey="symptom_1"
                  stroke="#10b981"
                  strokeWidth={2}
                  name={chartData[0]?.symptom_1_name || 'Top Symptom 1'}
                  dot={{ r: 3, fill: '#10b981' }}
                  strokeDasharray="5 5"
                />
              )}
              {chartData[0]?.symptom_2 && (
                <Line
                  type="monotone"
                  dataKey="symptom_2"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name={chartData[0]?.symptom_2_name || 'Top Symptom 2'}
                  dot={{ r: 3, fill: '#f59e0b' }}
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log History */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-[#E0E0E0]">
        <h3 className="text-lg font-bold text-[#34113F] mb-6 pl-2 border-l-4 border-[#F5E9B8]" style={{ fontFamily: 'Raleway' }}>
          Detailed Log History
        </h3>
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className="border border-[#F0F0F0] rounded-xl p-5 hover:border-[#815FB3]/30 hover:shadow-md transition-all duration-200 bg-[#FAFAFA]"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFE9F5] flex items-center justify-center text-lg">
                    📅
                  </div>
                  <div>
                    <h4 className="font-bold text-[#34113F]" style={{ fontFamily: 'Raleway' }}>
                      {new Date(log.log_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium" style={{ fontFamily: 'Raleway' }}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Symptoms */}
              {log.symptoms && log.symptoms.length > 0 && (
                <div className="ml-13 pl-13 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {log.symptoms.map((symptom, idx) => {
                      const severity = log.severity_scores?.[symptom] || 5;
                      let severityColor = 'bg-gray-100 text-gray-700';
                      if (severity >= 8) severityColor = 'bg-red-100 text-red-800 border border-red-200';
                      else if (severity >= 5) severityColor = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
                      else severityColor = 'bg-green-50 text-green-800 border border-green-200';

                      return (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${severityColor}`}
                          style={{ fontFamily: 'Raleway' }}
                        >
                          {formatSymptomName(symptom)}
                          {log.severity_scores && (
                            <span className="font-bold px-1.5 py-0.5 bg-white/50 rounded-md">
                              {severity}/10
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {log.notes && (
                <div className="mt-4 pt-3 border-t border-gray-200 text-sm">
                  <div className="flex gap-2">
                    <span className="font-bold text-[#815FB3]">📝 Note:</span>
                    <p className="text-gray-600 italic" style={{ fontFamily: 'Raleway' }}>
                      &quot;{log.notes}&quot;
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Manual Log Option - Shown as Modal */}
      {showLogger && selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#FFFFF2] border-b border-[#E0E0E0] p-5 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-[#34113F]" style={{ fontFamily: 'Raleway' }}>Manual Symptom Log Entry</h3>
              <button
                onClick={() => setShowLogger(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[#34113F] font-bold text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 bg-white">
              {location.state?.fromDiagnosis && (
                <div className="mb-6 p-4 bg-[#F0F7FF] border border-[#815FB3]/30 rounded-xl flex gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <strong className="text-[#34113F] block mb-1">Pre-filled from diagnosis</strong>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Raleway' }}>
                      Symptoms from your recent assessment have been pre-selected. 
                      Adjust severity and add any additional observations.
                    </p>
                  </div>
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
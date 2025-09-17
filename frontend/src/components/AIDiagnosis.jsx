import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import useConversations from '../hooks/useConversations';

const AIDiagnosis = () => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    severity: '',
    species: '',
    dateRange: ''
  });
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

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const fetchDiagnoses = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
        ...filters
      });

      const response = await axios.get(
        `http://localhost:8000/api/chatbot/diagnoses/?${params}`,
        {
          headers: {
            'Authorization': token ? `Token ${token}` : '',
          }
        }
      );

      setDiagnoses(response.data.diagnoses || []);
      setTotalPages(response.data.total_pages || 1);
      setCurrentPage(response.data.current_page || 1);
    } catch (error) {
      console.error('Error fetching diagnoses:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnoses();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchDiagnoses(page);
  };

  return (
    <div className="min-h-screen bg-[#f0f1f1] flex">
      {/* Left Sidebar */}
      <Sidebar 
        sidebarVisible={sidebarVisible}
        currentPage="ai-diagnosis" 
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
        <div className="bg-[#f0f1f1] border-b p-4 flex items-center justify-between">
          {/* Page Title */}
          <div className="flex items-center">
            <h2 className="text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
              AI Diagnosis
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

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#f0f1f1]">
          {/* Filters */}
          <div className="bg-[#f0f1f1] rounded-lg p-3 mb-3">
            <div className="flex flex-wrap gap-4 items-center justify-center">
              {/* Severity Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
              >
                <option value="">Severity</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              {/* Species Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                value={filters.species}
                onChange={(e) => handleFilterChange('species', e.target.value)}
              >
                <option value="">Species</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="rabbit">Rabbit</option>
                <option value="hamster">Hamster</option>
                <option value="fish">Fish</option>
              </select>

              {/* Date Range Filter */}
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
                style={{ fontFamily: 'Raleway', fontWeight: 'bold' }}
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <option value="">Date Range</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          {/* Diagnoses List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {diagnoses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500" style={{ fontFamily: 'Raleway' }}>
                    No diagnoses found. Start a conversation with the AI to get diagnoses.
                  </p>
                </div>
              ) : (
                diagnoses.map((diagnosis) => (
                  <div key={diagnosis.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Raleway' }}>
                          {diagnosis.condition_name}
                        </h3>
                        <div className="flex items-center space-x-4 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${severityColors[diagnosis.severity?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                            {diagnosis.severity}
                          </span>
                          <span className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                            {diagnosis.species} • {new Date(diagnosis.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1" style={{ fontFamily: 'Raleway' }}>Symptoms:</h4>
                        <p className="text-gray-600 text-sm" style={{ fontFamily: 'Raleway' }}>
                          {diagnosis.symptoms}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1" style={{ fontFamily: 'Raleway' }}>Diagnosis:</h4>
                        <p className="text-gray-600 text-sm" style={{ fontFamily: 'Raleway' }}>
                          {diagnosis.diagnosis}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1" style={{ fontFamily: 'Raleway' }}>Recommendations:</h4>
                        <p className="text-gray-600 text-sm" style={{ fontFamily: 'Raleway' }}>
                          {diagnosis.recommendations}
                        </p>
                      </div>
                      
                      {diagnosis.confidence_score && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <span className="text-sm text-gray-500" style={{ fontFamily: 'Raleway' }}>
                            Confidence: {Math.round(diagnosis.confidence_score * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Raleway' }}
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm border rounded-lg ${
                      currentPage === page
                        ? 'border-[#815FB3] bg-[#815FB3] text-white'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{ fontFamily: 'Raleway' }}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Raleway' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDiagnosis;

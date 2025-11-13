import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useConversations from '../hooks/useConversations';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import LogoutModal from './LogoutModal';
import SOAPReportViewer from './SOAPReportViewer';

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  
  // Use conversations hook
  const {
    conversations,
    loadingConversations,
    handleLoadConversation,
    handleCreateNewConversation,
    handlePinConversation,
    handleRenameConversation,
    handleArchiveConversation,
    handleDeleteConversation
  } = useConversations();

  const severityColors = {
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const fetchDiagnoses = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      // Map frontend values to backend API values
      const dateRangeMap = {
        '': 'all_time',
        'last_24_hours': 'today',
        'last_7_days': 'last_7_days',
        'last_30_days': 'last_30_days'
      };
      const apiDateRange = dateRangeMap[filters.dateRange] || 'all_time';

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
        search: filters.search,
        severity: filters.severity,
        species: filters.species,
        dateRange: apiDateRange // Use mapped value for API
      });

      const response = await axios.get(
        `http://localhost:8000/api/chatbot/diagnoses/?${params}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
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
  navigate('/petowner/login');
      }
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, token, logout, navigate]);

  useEffect(() => {
    fetchDiagnoses();
  }, [filters, fetchDiagnoses]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchDiagnoses(page);
  };

  // Logout modal handlers
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setLoading(true);
  await logout();
  navigate('/petowner/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
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
        onRenameConversation={handleRenameConversation}
        onArchiveConversation={handleArchiveConversation}
        onDeleteConversation={handleDeleteConversation}
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
            <ProfileButton onLogoutClick={handleLogoutClick} />
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
                <option value="">All Severity</option>
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
                <option value="">All Animals</option>
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
                <option value="">All Time</option>
                <option value="last_24_hours">Last 24 hours</option>
                <option value="last_7_days">Last 1 week</option>
                <option value="last_30_days">Last month</option>
              </select>
            </div>
          </div>

          {/* Diagnoses List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#815FB3]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="min-w-full bg-[#fffde7] rounded-xl shadow border text-[15px]"
                style={{ fontFamily: 'Raleway', tableLayout: 'fixed' }}
              >
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '26%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-[#fffde7] text-gray-700">
                    <th className="px-4 py-3 text-left font-semibold">Pet Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Animal</th>
                    <th className="px-4 py-3 text-left font-semibold">Breed</th>
                    <th className="px-4 py-3 text-left font-semibold">Severity</th>
                    <th className="px-4 py-3 text-left font-semibold">Case ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Date Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnoses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400" style={{ fontFamily: 'Raleway', fontSize: '16px' }}>
                        There are no data yet.
                      </td>
                    </tr>
                  ) : (
                    diagnoses.map((diagnosis) => (
                      <tr
                        key={diagnosis.id}
                        className="border-b last:border-b-0 hover:bg-[#f7f6fa] cursor-pointer"
                        onClick={() => diagnosis.case_id && setSelectedCaseId(diagnosis.case_id)}
                      >
                        <td className="px-4 py-3 flex items-center gap-2">
                          {diagnosis.pet_photo_url && (
                            <img src={diagnosis.pet_photo_url} alt={diagnosis.pet_name} className="w-8 h-8 rounded-full object-cover" />
                          )}
                          <span className="font-semibold">{diagnosis.pet_name || 'Pet Diagnosis'}</span>
                        </td>
                        <td className="px-4 py-3">{diagnosis.animal_type || diagnosis.species}</td>
                        <td className="px-4 py-3">{diagnosis.breed || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${severityColors[diagnosis.severity?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                            {diagnosis.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-700">{diagnosis.case_id || '-'}</td>
                        <td className="px-4 py-3">{diagnosis.created_at ? new Date(diagnosis.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        loading={loading}
      />

      {/* SOAP Report Viewer */}
      {selectedCaseId && (
        <SOAPReportViewer
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
        />
      )}
    </div>
  );
};

export default AIDiagnosis;

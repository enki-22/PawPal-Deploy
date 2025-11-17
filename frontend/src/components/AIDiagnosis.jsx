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
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    severity: '',
    species: '',
    dateRange: ''
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  // Responsive mobile sidebar overlay
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
        page_size: pageSize.toString(),
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
  }, [filters, token, logout, navigate, pageSize]);

  useEffect(() => {
    fetchDiagnoses(currentPage);
  }, [filters, fetchDiagnoses, currentPage, pageSize]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
    <div className="min-h-screen bg-[#f0f1f1] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block sticky top-0 h-screen z-30">
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
          isMobileOverlay={false}
        />
      </div>

      {/* --- MODIFIED BLOCK --- */}
      {/* Mobile Sidebar Overlay with Transitions */}
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
            currentPage="ai-diagnosis"
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

      {/* Main Content Area - flex-1 */}
      <div className="flex-1 flex flex-col bg-white h-screen w-full">
        {/* Header - Stationary - Responsive */}
        {/* Header - Mobile: logo, sidebar toggle, profile. Desktop: unchanged. */}
        <div className="border-b p-4 flex items-center justify-between sticky top-0 z-20 bg-[#DCCEF1] md:bg-[#f0f1f1]">
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
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between w-full">
            <div className="flex items-center gap-2 md:gap-4">
              <h2 className="text-lg md:text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                AI Diagnosis
              </h2>
            </div>
            {/* Search Bar - Hidden on mobile, flex on desktop */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
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
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
        </div>
        {/* Page name below header for mobile */}
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#fff' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            AI Diagnosis
          </h2>
        </div>

        {/* Main Content - Diagnoses (Scrollable) */}
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
            <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Raleway' }}
              >
                First
              </button>
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
                // Only show first, last, current, and neighbors for large page sets
                if (
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
                ) {
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
                }
                // Show ellipsis for skipped pages
                if (
                  (page === currentPage - 3 && page > 1) ||
                  (page === currentPage + 3 && page < totalPages)
                ) {
                  return (
                    <span key={page} className="px-2">...</span>
                  );
                }
                return null;
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Raleway' }}
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Raleway' }}
              >
                Last
              </button>
              {/* Page size selector */}
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="ml-4 px-2 py-1 border rounded-lg text-sm"
                style={{ fontFamily: 'Raleway' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="ml-2 text-xs text-gray-500">per page</span>
            </div>
          )}
        </div>

        {/* Modals are outside the main layout */}
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
    </div>
  );
};

export default AIDiagnosis;

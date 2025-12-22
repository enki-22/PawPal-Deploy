import { useEffect, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useConversations from '../hooks/useConversations';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import LogoutModal from './LogoutModal';
import SOAPReportViewer from './SOAPReportViewer';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const AIDiagnosis = () => {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(8);
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
    // Existing
    low: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
    
    // Add these missing mappings
    routine: 'bg-green-100 text-green-800',     // Map routine to low (green)
    urgent: 'bg-orange-100 text-orange-800',    // Map urgent to high (orange)
    immediate: 'bg-red-100 text-red-800',       // Map immediate to critical (red)
    emergency: 'bg-red-100 text-red-800',       // Map emergency to critical (red)
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
        `${API_BASE_URL}/api/chatbot/diagnoses/?${params}`,
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
          currentPage="ai-assessments"
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
            currentPage="ai-assessments"
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
              <img src="/pat-removebg-preview 1.png" alt="PawPal Logo" className="w-8 h-8" />
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
              <h2 className="text-lg md:text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                AI Assessments
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
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#F2F4F7', paddingTop: '56px' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            AI Assessments
          </h2>
        </div>

        {/* Mobile search bar - only visible on mobile, above filters */}
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#F2F4F7' }}>
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

        {/* Main Content - Diagnoses (Scrollable) */}
        <div className="flex-1 p-4 overflow-y-auto bg-[#f0f1f1]" style={{ paddingTop: '20px' }}>
          {/* Filters */}
          <div className="bg-[#f0f1f1] rounded-lg p-3 mb-3">
            <div className="flex flex-wrap gap-2 items-center justify-center">
              {/* Severity Filter */}
              <select
                className="px-1 py-1 text-xs md:px-4 md:py-2 md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
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
                className="px-1 py-1 text-xs md:px-4 md:py-2 md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
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
                className="px-1 py-1 text-xs md:px-4 md:py-2 md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] bg-[#F0E4B3]"
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
            <div className="overflow-x-auto w-full flex justify-center">
              <table
                className="w-full md:w-[1100px] rounded-xl shadow border text-[10px] md:text-[15px] md:table-fixed mx-auto"
                style={{ fontFamily: 'Raleway', background: '#FFFFF2', tableLayout: 'fixed' }}
              >
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                </colgroup>
                <thead>
                  <tr className="text-gray-700" style={{ background: '#FFFFF2' }}>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-[10px] md:text-[15px]">Pet Name</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-[10px] md:text-[15px]">Animal</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-[10px] md:text-[15px]">Breed</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-[10px] md:text-[15px]">Severity</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-[10px] md:text-[15px]">Case ID</th>
                    <th className="px-2 py-2 md:px-4 md:py-3 text-left font-semibold text-[10px] md:text-[15px]">Date Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {diagnoses.length === 0 ? (
                    <tr>
                      <td colSpan={6} 
                        className="px-4 py-8 text-center text-gray-400 text-sm md:text-base" 
                        style={{ fontFamily: 'Raleway' }}
                      >
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
                        <td className="px-2 py-2 md:px-4 md:py-3 flex items-center gap-1 md:gap-2 text-[10px] md:text-[15px]">
                          {diagnosis.pet_photo_url && (
                            <img src={diagnosis.pet_photo_url} alt={diagnosis.pet_name} className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover" />
                          )}
                          <span className="font-semibold break-words">{diagnosis.pet_name || 'Pet Diagnosis'}</span>
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-[15px]">{diagnosis.animal_type || diagnosis.species}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 break-words text-[10px] md:text-[15px]">{diagnosis.breed || '-'}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-[15px]">
                          <span
                            className={`px-1 py-0.5 md:px-3 md:py-1 rounded-[10px] md:rounded-full text-[8px] md:text-xs font-medium ${severityColors[diagnosis.severity?.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}
                            style={{ minWidth: '32px', display: 'inline-block', textAlign: 'center' }}
                          >
                            {diagnosis.severity}
                          </span>
                        </td>
                        <td className="px-2 py-2 md:px-4 md:py-3 font-mono text-[8px] md:text-sm text-gray-700 break-all">{diagnosis.case_id || '-'}</td>
                        <td className="px-2 py-2 md:px-4 md:py-3 text-[10px] md:text-[15px]">{diagnosis.created_at ? new Date(diagnosis.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination - always visible, even if only one page */}
          <div className="flex items-center justify-center gap-2 mt-6 pb-2">
            <button
              className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black"
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronDown className="w-[11px] h-[21px] rotate-90" />
            </button>
            <div className="bg-[#815fb3] w-[27px] h-[27px] rounded-[5px] flex items-center justify-center">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-white">{currentPage}</span>
            </div>
            <span className="text-[#888888] text-[12px]">/ {Math.max(1, totalPages)}</span>
            <button
              className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black"
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              <ChevronDown className="w-[11px] h-[21px] -rotate-90" />
            </button>
          </div>
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

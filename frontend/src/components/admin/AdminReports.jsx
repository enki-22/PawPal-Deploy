import React, { useState, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import AdminTopNav from './AdminTopNav';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminSOAPReportViewer from './AdminSOAPReportViewer';
import CustomDropdown from '../common/CustomDropdown'; // Added for consistency

const AdminReports = () => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });
  const [filteredReports, setFilteredReports] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  // Consistent species filter options
  const speciesOptions = ['All Species', 'Cat', 'Dog', 'Hamster', 'Bird', 'Rabbit', 'Fish', 'Other'];
  const [speciesFilter, setSpeciesFilter] = useState('All Species');

  const dateRangeOptions = ['Last 24 Hours', 'Last 7 Days', 'Last Month', 'All Time'];
  const [dateRange, setDateRange] = useState('All Time');

  const { adminAxios } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'none') return { key, direction: 'asc' };
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'none' };
      }
      return { key, direction: 'asc' };
    });
  };

  useEffect(() => {
    let filtered = reportsData;

    if (speciesFilter !== 'All Species') {
      filtered = filtered.filter(report => report.species?.toLowerCase() === speciesFilter.toLowerCase());
    }

    if (dateRange !== 'All Time') {
      const now = new Date();
      filtered = filtered.filter(report => {
        if (!report.date_generated) return true;
        const reportDate = new Date(report.date_generated);
        let diff = (now - reportDate) / (1000 * 60 * 60 * 24);
        if (dateRange === 'Last 24 Hours' && diff > 1) return false;
        if (dateRange === 'Last 7 Days' && diff > 7) return false;
        if (dateRange === 'Last Month' && diff > 30) return false;
        return true;
      });
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(report => (
        report.pet_name?.toLowerCase().includes(term) ||
        report.species?.toLowerCase().includes(term) ||
        report.breed?.toLowerCase().includes(term) ||
        report.owner_name?.toLowerCase().includes(term) ||
        String(report.case_id).toLowerCase().includes(term)
      ));
    }

    let sorted = [...filtered];
    if (sortConfig.key && sortConfig.direction !== 'none') {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredReports(sorted);
    setCurrentPage(1);
  }, [reportsData, speciesFilter, dateRange, searchTerm, sortConfig]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await adminAxios.get('/admin/reports');
        const reports = response.data.results || response.data.data || [];
        setReportsData(reports.map(report => ({
          id: report.case_id || report.id,
          pet_name: report.pet_name,
          species: report.species,
          breed: report.breed,
          owner_name: report.owner_name,
          case_id: report.case_id,
          date_generated: report.date_generated,
          pet_image: report.pet_image || null
        })));
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        setReportsData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [adminAxios]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-xl">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] relative">
      <AdminTopNav activePage="Reports" />
      
      <div className="pt-[80px]">
        {/* Controls Bar - Title, Search, Filters matches AdminPets */}
        <div className="flex items-center justify-between px-[129px] py-[28px]">
          <h1 className="font-['Raleway:Bold',sans-serif] font-bold text-[20px] text-black tracking-[1px]">AI Triage Summaries</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-[465px] h-[31px] border border-[#888888] rounded-[5px] flex items-center px-3">
                <Search className="w-[18px] h-[18px] text-[#888888] mr-2" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 text-[12px] text-[#888888] bg-transparent outline-none font-['Inter:Regular',sans-serif]"
                />
              </div>
            </div>
            
            <CustomDropdown
              options={dateRangeOptions}
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              width="125px"
            />
            
            <CustomDropdown
              options={speciesOptions}
              value={speciesFilter}
              onChange={(val) => setSpeciesFilter(val)}
              width="122px"
            />
          </div>
        </div>

        {/* Data Table - Column widths matched to AdminPets */}
        <div className="mx-[100px] bg-[#fffff2] rounded-t-[10px] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#fffff2] h-[40px] border-b border-[#888888] flex items-center px-[31px]">
            <div className="flex items-center gap-4 flex-1">
              {/* Spacer for consistency with AdminPets checkbox logic */}
            </div>
            <div className="w-[216px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('pet_name')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Pet Name</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ 
                width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'pet_name' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform: sortConfig.key !== 'pet_name' || sortConfig.direction === 'none' ? 'rotate(0deg)' : sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[190px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('species')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Species</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ 
                width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'species' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform: sortConfig.key !== 'species' || sortConfig.direction === 'none' ? 'rotate(0deg)' : sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[215px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('breed')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Breed</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ 
                width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'breed' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform: sortConfig.key !== 'breed' || sortConfig.direction === 'none' ? 'rotate(0deg)' : sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[216px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('owner_name')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">User</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ 
                width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'owner_name' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform: sortConfig.key !== 'owner_name' || sortConfig.direction === 'none' ? 'rotate(0deg)' : sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[216px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('case_id')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Case ID</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ 
                width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'case_id' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform: sortConfig.key !== 'case_id' || sortConfig.direction === 'none' ? 'rotate(0deg)' : sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[172px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('date_generated')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Date Generated</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ 
                width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'date_generated' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform: sortConfig.key !== 'date_generated' || sortConfig.direction === 'none' ? 'rotate(0deg)' : sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
          </div>

          {/* Table Rows */}
          {filteredReports.length === 0 ? (
            <div className="h-[80px] flex items-center justify-center text-[#888888] text-[16px] font-['Inter:Regular',sans-serif]">
              No reports found
            </div>
          ) : (
            filteredReports
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((report) => (
                <div 
                  key={report.id} 
                  className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[31px] hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCaseId(report.case_id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Spacer for consistency */}
                  </div>
                  <div className="w-[216px] flex items-center gap-3">
                    <div className="w-[35px] h-[35px] rounded-full overflow-hidden">
                      <img 
                        src={report.pet_image || "/pat-removebg-preview 1.png"} 
                        alt={report.pet_name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <span className="font-['Inter:Bold',sans-serif] font-bold text-[12px] text-black">{report.pet_name}</span>
                  </div>
                  <div className="w-[190px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{report.species}</span>
                  </div>
                  <div className="w-[215px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{report.breed}</span>
                  </div>
                  <div className="w-[216px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{report.owner_name}</span>
                  </div>
                  <div className="w-[216px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{report.case_id}</span>
                  </div>
                  <div className="w-[172px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                      {new Date(report.date_generated).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-12 pb-2">
          <button
            className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronDown className="w-[11px] h-[21px] rotate-90" />
          </button>
          <div className="bg-[#815fb3] w-[27px] h-[27px] rounded-[5px] flex items-center justify-center">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-white">{currentPage}</span>
          </div>
          <span className="text-[#888888] text-[12px]">/ {Math.max(1, Math.ceil(filteredReports.length / rowsPerPage))}</span>
          <button
            className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black"
            onClick={() => setCurrentPage((prev) => (prev < Math.ceil(filteredReports.length / rowsPerPage) ? prev + 1 : prev))}
            disabled={currentPage >= Math.ceil(filteredReports.length / rowsPerPage)}
          >
            <ChevronDown className="w-[11px] h-[21px] -rotate-90" />
          </button>
        </div>
      </div>

      {selectedCaseId && (
        <AdminSOAPReportViewer
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
        />
      )}
    </div>
  );
}

export default AdminReports;
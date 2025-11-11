import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, ArrowUpDown } from 'lucide-react';
import AdminTopNav from './AdminTopNav';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminSOAPReportViewer from './AdminSOAPReportViewer';

const AdminReports = () => {
  // Species filter options (same as AddPet)
  const speciesOptions = [
    { value: '', label: 'All Species' },
    { value: 'cat', label: 'Cat' },
    { value: 'dog', label: 'Dog' },
    { value: 'hamster', label: 'Hamster' },
    { value: 'bird', label: 'Bird' },
    { value: 'rabbit', label: 'Rabbit' },
    { value: 'fish', label: 'Fish' },
    { value: 'other', label: 'Other' }
  ];
  const [speciesFilter, setSpeciesFilter] = useState('');
  // Date range filter options (same as other admin dropdowns)
  const dateRangeOptions = [
    'Last 24 Hours',
    'Last 7 Days',
    'Last Month',
    'All Time'
  ];
  const [dateRange, setDateRange] = useState('All Time');

  const { adminAxios } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReports, setSelectedReports] = useState([]);
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  // Filter reports by search term
  const filteredReports = reportsData.filter(report => {
  // Filter by species
  if (speciesFilter && report.species && report.species.toLowerCase() !== speciesFilter) return false;
    // Filter by date range
    if (dateRange !== 'All Time' && report.date_generated) {
      const now = new Date();
      const reportDate = new Date(report.date_generated);
      let diff = (now - reportDate) / (1000 * 60 * 60 * 24); // difference in days
      if (dateRange === 'Last 24 Hours' && diff > 1) return false;
      if (dateRange === 'Last 7 Days' && diff > 7) return false;
      if (dateRange === 'Last Month' && diff > 30) return false;
    }
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      (report.pet_name && report.pet_name.toLowerCase().includes(term)) ||
      (report.species && report.species.toLowerCase().includes(term)) ||
      (report.breed && report.breed.toLowerCase().includes(term)) ||
      (report.owner_name && report.owner_name.toLowerCase().includes(term)) ||
      (report.case_id && String(report.case_id).toLowerCase().includes(term))
    );
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await adminAxios.get('/admin/reports')
          .catch((err) => {
            console.error('❌ /admin/reports error:', err);
            if (err.response) {
              console.error('❌ Error response data:', err.response.data);
              console.error('❌ Error response status:', err.response.status);
            }
            return { data: { results: [] } };
          });
        // Backend returns 'results' array
        const reports = response.data.results || response.data.data || [];
        setReportsData(reports.map(report => ({
          id: report.case_id || report.id,
          pet_name: report.pet_name,
          species: report.species,
          breed: report.breed,
          owner_name: report.owner_name,
          case_id: report.case_id,
          date_generated: report.date_generated,
          pet_image: null // Pet image not included in reports endpoint response
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

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedReports(filteredReports.map(report => report.id));
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectReport = (reportId, checked) => {
    if (checked) {
      setSelectedReports([...selectedReports, reportId]);
    } else {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    }
  };



  return (
  <div className="min-h-screen bg-[#f0f0f0] relative pt-[80px]">
      <AdminTopNav activePage="Reports" />
      {/* Controls Bar - Title, Search centered, Filters right */}
      <div className="px-[129px] pt-[28px] pb-0 bg-transparent">
        <div className="flex items-center justify-between w-full mb-2">
          <h1 className="font-['Raleway:Bold',sans-serif] font-bold text-[20px] text-black tracking-[1px]">AI Diagnosis</h1>
          <div className="flex items-center gap-4">
            {/* Search Bar */}
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
            {/* Date Range Filter */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="bg-[#f0e4b3] h-[31px] w-[125px] rounded-[5px] px-3 pr-8 text-[12px] text-black font-['Inter:Regular',sans-serif] border-none outline-none cursor-pointer"
                style={{ appearance: 'none' }}
              >
                {dateRangeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
                <ChevronDown className="w-[12px] h-[12px] text-black" />
              </span>
            </div>
            {/* Species Filter */}
            <div className="relative">
              <select
                value={speciesFilter}
                onChange={e => setSpeciesFilter(e.target.value)}
                className="bg-[#f0e4b3] h-[31px] w-[122px] rounded-[5px] px-3 pr-8 text-[12px] text-black font-['Inter:Regular',sans-serif] border-none outline-none cursor-pointer"
                style={{ appearance: 'none' }}
              >
                {speciesOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
                <ChevronDown className="w-[12px] h-[12px] text-black" />
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Data Table */}
  <div className="mx-[100px] bg-[#fffff2] rounded-t-[10px] overflow-hidden mt-[18px]">
        {/* Table Header */}
        <div className="bg-[#fffff2] h-[40px] border-b border-[#888888] flex items-center px-[31px]">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="checkbox"
              checked={selectedReports.length === reportsData.length && reportsData.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-[12px] h-[12px] border border-[#888888] rounded-[1px]"
            />
            <div className="flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Pet Name</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
          </div>
          <div className="w-[200px] flex items-center gap-1">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Species</span>
            <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
          </div>
          <div className="w-[190px] flex items-center gap-1">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Breed</span>
            <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
          </div>
          <div className="w-[216px] flex items-center gap-1">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">User</span>
            <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
          </div>
          <div className="w-[216px] flex items-center gap-1">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Case ID</span>
            <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
          </div>
          <div className="w-[172px] flex items-center gap-1">
            <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Date Generated</span>
            <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
          </div>
        </div>
        {/* Table Rows */}
        {filteredReports.length === 0 ? (
          <div className="h-[80px] flex items-center justify-center text-[#888888] text-[16px] font-['Inter:Regular',sans-serif]">
            No reports found
          </div>
        ) : (
          filteredReports.map((report) => (
            <div 
              key={report.id} 
              className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[31px] hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedCaseId(report.case_id)}
            >
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={selectedReports.includes(report.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectReport(report.id, e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-[12px] h-[12px] border border-[#888888] rounded-[1px]"
                />
                <div className="flex items-center gap-3">
                  <div className="w-[35px] h-[35px] rounded-full overflow-hidden">
                    <img 
                      src={report.pet_image || "/pat-removebg-preview 2.png"} 
                      alt={report.pet_name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span className="font-['Inter:Bold',sans-serif] font-bold text-[12px] text-black">{report.pet_name}</span>
                </div>
              </div>
              <div className="w-[200px]">
                <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{report.species}</span>
              </div>
              <div className="w-[190px]">
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
      {/* Pagination at the bottom, outside the table */}
      <div className="flex items-center justify-center gap-2 mt-12 pb-2">
        <button className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black">
          <ChevronDown className="w-[11px] h-[21px] rotate-90" />
        </button>
        <div className="bg-[#815fb3] w-[27px] h-[27px] rounded-[5px] flex items-center justify-center">
          <span className="font-['Inter:Regular',sans-serif] text-[12px] text-white">1</span>
        </div>
        <button className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black">
          <ChevronDown className="w-[11px] h-[21px] -rotate-90" />
        </button>
      </div>

      {/* Admin SOAP Report Viewer */}
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

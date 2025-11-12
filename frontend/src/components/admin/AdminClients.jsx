import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminTopNav from './AdminTopNav';
import { ChevronDown, Search } from 'lucide-react';
import AdminClientDetailsModal from './AdminClientDetailsModal';

const AdminClients = () => {
  // Sorting state with neutral 'none' direction
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'none' });

  // Sorting logic
  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        // Cycle: none -> asc -> desc -> none
        if (prev.direction === 'none') return { key, direction: 'asc' };
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'none' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Remove sorting effect on filteredClients to avoid infinite loop
  // Status filter options
  const statusOptions = ['All', 'Active', 'Deactivated'];
  const [status, setStatus] = useState('All');
  // Date range filter options (same as other admin dropdowns)
  const dateRangeOptions = [
    'Last 24 Hours',
    'Last 7 Days',
    'Last Month',
    'All Time'
  ];
  const [dateRange, setDateRange] = useState('All Time');
  const { adminAxios } = useAdminAuth();
  const [clientsData, setClientsData] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Removed selectedClients state (checkboxes no longer used)
  const [selectedClientId, setSelectedClientId] = useState(null);

  const fetchClientsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAxios.get('/admin/clients').catch((err) => {
        console.error('❌ /admin/clients error:', err);
        if (err.response) {
          console.error('❌ Error response data:', err.response.data);
          console.error('❌ Error response status:', err.response.status);
        }
        return { data: { results: [] } };
      });
      // Backend returns 'results' not 'data'
      setClientsData(response.data.results || []);
      setFilteredClients(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch clients data:', error);
      setClientsData([]);
    } finally {
      setLoading(false);
    }
  }, [adminAxios]);

  useEffect(() => {
    fetchClientsData();
  }, [fetchClientsData]);

  useEffect(() => {
    let filtered = clientsData;
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        client =>
          client.name?.toLowerCase().includes(term) ||
          client.email?.toLowerCase().includes(term)
      );
    }
    // Filter by date range
    if (dateRange !== 'All Time') {
      const now = new Date();
      filtered = filtered.filter(client => {
        if (!client.date_joined) return true;
        const joinedDate = new Date(client.date_joined);
        let diff = (now - joinedDate) / (1000 * 60 * 60 * 24); // difference in days
        if (dateRange === 'Last 24 Hours' && diff > 1) return false;
        if (dateRange === 'Last 7 Days' && diff > 7) return false;
        if (dateRange === 'Last Month' && diff > 30) return false;
        return true;
      });
    }
    // Filter by status
    if (status !== 'All') {
      filtered = filtered.filter(client => {
        // Case-insensitive, trims spaces
        return client.status?.trim().toLowerCase() === status.toLowerCase();
      });
    }
    // Apply sorting after all filters
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
    setFilteredClients(sorted);
  setCurrentPage(1); // Reset to first page on filter/sort change
  }, [searchTerm, clientsData, dateRange, status, sortConfig.key, sortConfig.direction]);

  // Removed handleSelectAll and handleSelectClient (checkboxes no longer used)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-xl">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] relative">
      <AdminTopNav activePage="Clients" />

      {/* Main Content */}
      <div className="pt-[80px]">
        {/* Page Title and Controls */}
        <div className="flex items-center justify-between px-[129px] py-[28px]">
          <h1 className="font-['Raleway:Bold',sans-serif] font-bold text-[20px] text-black tracking-[1px]">Accounts</h1>
          
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
            
            {/* Status Filter */}
            <div className="relative">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="bg-[#f0e4b3] h-[31px] w-[125px] rounded-[5px] px-3 pr-8 text-[12px] text-black font-['Inter:Regular',sans-serif] border-none outline-none cursor-pointer"
                style={{ appearance: 'none' }}
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
                <ChevronDown className="w-[12px] h-[12px] text-black" />
              </span>
            </div>
          </div>
        </div>


        {/* --- Data Table (FIXED LAYOUT) --- */}
        <div className="mx-[118px] bg-[#fffff2] rounded-t-[10px] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#fffff2] h-[40px] border-b border-[#888888] flex items-center px-[32px] gap-4">
            {/* Removed checkbox column from table header */}
            {/* Col 2: Registered User */}
            <div className="flex-1 flex items-center gap-1 cursor-pointer" onClick={() => handleSort('name')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Registered User</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'name' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'name' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            {/* Col 3: Pets Owned */}
            <div className="w-48 flex items-center gap-1 cursor-pointer" onClick={() => handleSort('pet_count')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Number of Pets Owned</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'pet_count' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'pet_count' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            {/* Col 4: Email */}
            <div className="flex-1 flex items-center gap-1 cursor-pointer" onClick={() => handleSort('email')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Email</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'email' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'email' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            {/* Col 5: Status */}
            <div className="w-48 flex items-center gap-1 cursor-pointer" onClick={() => handleSort('status')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Account Status</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'status' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'status' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            {/* Col 6: Date Created */}
            <div className="w-56 flex items-center gap-1 cursor-pointer" onClick={() => handleSort('date_created')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Date Account Created</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'date_created' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'date_created' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
          </div>

          {/* Table Rows or Empty State - paginated */}
          {filteredClients.length === 0 ? (
            <div className="h-[80px] flex items-center justify-center text-[#888888] text-[16px] font-['Inter:Regular',sans-serif]">
              There are no clients found
            </div>
          ) : (
            filteredClients
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((client, idx) => (
                <div
                  key={client.id ? `client-row-${client.id}` : `client-row-${idx}`}
                  className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[32px] gap-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedClientId(client.id);
                  }}
                >
                  {/* Removed checkbox cell from table row */}
                  {/* Col 2: Registered User */}
                  <div className="flex-1 truncate">
                    <span className="font-['Inter:Bold',sans-serif] font-bold text-[12px] text-black">{client.name}</span>
                  </div>
                  {/* Col 3: Pets Owned */}
                  <div className="w-48">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{client.pet_count}</span>
                  </div>
                  {/* Col 4: Email */}
                  <div className="flex-1 truncate">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{client.email}</span>
                  </div>
                  {/* Col 5: Status */}
                  <div className="w-48 flex items-center">
                    <div className={`h-[30px] w-auto px-3 rounded-[5px] flex items-center justify-center ${client.status?.trim().toLowerCase() === 'active' ? 'bg-[#c2f0b3]' : 'bg-[#f0b3b3]'}`}>
                      <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{client.status}</span>
                    </div>
                  </div>
                  {/* Col 6: Date Created */}
                  <div className="w-56">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                      {new Date(client.date_created).toLocaleDateString('en-US', { 
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

        {/* Pagination at the bottom */}
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
          <span className="text-[#888888] text-[12px]">/ {Math.max(1, Math.ceil(filteredClients.length / rowsPerPage))}</span>
          <button
            className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black"
            onClick={() => setCurrentPage((prev) => (prev < Math.ceil(filteredClients.length / rowsPerPage) ? prev + 1 : prev))}
            disabled={currentPage >= Math.ceil(filteredClients.length / rowsPerPage)}
          >
            <ChevronDown className="w-[11px] h-[21px] -rotate-90" />
          </button>
        </div>
      </div>
      {selectedClientId && (
        <>
          {console.log('Rendering AdminClientDetailsModal for clientId:', selectedClientId)}
          <AdminClientDetailsModal
            clientId={selectedClientId}
            onClose={() => setSelectedClientId(null)}
            adminAxios={adminAxios}
          />
        </>
      )}
    </div>
  );
}

export default AdminClients;
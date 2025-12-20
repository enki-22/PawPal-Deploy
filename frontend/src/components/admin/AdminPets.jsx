import { useAdminAuth } from '../../context/AdminAuthContext';
import React, { useState, useEffect, useCallback } from 'react';
import AdminTopNav from './AdminTopNav';
import { ChevronDown, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomDropdown from '../common/CustomDropdown';

const AdminPets = () => {
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

  // Status filter options
  const statusOptions = ['All', 'Active', 'Deceased'];
  const [status, setStatus] = useState('All');
  // Date range filter options (same as other admin dropdowns)
  const dateRangeOptions = [
    'Last 24 Hours',
    'Last 7 Days',
    'Last Month',
    'All Time'
  ];
  const [dateRange, setDateRange] = useState('All Time');
  const [filteredPets, setFilteredPets] = useState([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;
  const { adminAxios } = useAdminAuth();
  const [petsData, setPetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Removed selectedPets state (checkboxes no longer used)
  const navigate = useNavigate();

  const fetchPetsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAxios.get('/admin/pets?limit=1000')
        .catch((err) => {
          console.error('❌ /admin/pets error:', err);
          if (err.response) {
            console.error('❌ Error response data:', err.response.data);
            console.error('❌ Error response status:', err.response.status);
          }
          return { data: { results: [] } };
        });
      // Backend returns 'results' not 'data'
      // Map the response format to match frontend expectations
      const pets = response.data.results || [];
      setPetsData(pets.map(pet => ({
        id: pet.pet_id || pet.id,
        pet_name: pet.name,
        species: pet.species,
        breed: pet.breed,
        owner_name: pet.owner_name,
        status: pet.status || 'Active',
        date_registered: pet.registered_date || pet.created_at,
        pet_image: pet.photo
      })));
    } catch (error) {
      console.error('Failed to fetch pets data:', error);
      setPetsData([]);
    } finally {
      setLoading(false);
    }
  }, [adminAxios]);

  useEffect(() => {
    fetchPetsData();
  }, [fetchPetsData]);

  useEffect(() => {
    // Filter pets by search term, date range, and status
    let filtered = petsData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        pet =>
          pet.pet_name?.toLowerCase().includes(term) ||
          pet.species?.toLowerCase().includes(term) ||
          pet.breed?.toLowerCase().includes(term) ||
          pet.owner_name?.toLowerCase().includes(term)
      );
    }
    // Filter by date range
    if (dateRange !== 'All Time') {
      const now = new Date();
      filtered = filtered.filter(pet => {
        if (!pet.date_registered) return true;
        const registeredDate = new Date(pet.date_registered);
        let diff = (now - registeredDate) / (1000 * 60 * 60 * 24); // difference in days
        if (dateRange === 'Last 24 Hours' && diff > 1) return false;
        if (dateRange === 'Last 7 Days' && diff > 7) return false;
        if (dateRange === 'Last Month' && diff > 30) return false;
        return true;
      });
    }
    // Filter by status
    if (status !== 'All') {
      filtered = filtered.filter(pet => {
        // Case-insensitive, trims spaces
        return pet.status?.trim().toLowerCase() === status.toLowerCase();
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
    setFilteredPets(sorted);
  setCurrentPage(1); // Reset to first page on filter/sort change
  }, [searchTerm, petsData, dateRange, status, sortConfig.key, sortConfig.direction]);

  // Removed handleSelectAll and handleSelectPet (checkboxes no longer used)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-xl">Loading pets...</div>
      </div>
    );
  }

  const handleRowClick = (petId) => {
    navigate(`/admin/pets/${petId}`);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] relative">
      <AdminTopNav activePage="Pets" />

      {/* Main Content */}
      <div className="pt-[80px]">
        {/* Page Title and Controls */}
        <div className="flex items-center justify-between px-[129px] py-[28px]">
          <h1 className="font-['Raleway:Bold',sans-serif] font-bold text-[20px] text-black tracking-[1px]">Existing Pets</h1>
          
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
            <CustomDropdown
              options={dateRangeOptions}
              value={dateRange}
              onChange={(val) => setDateRange(val)}
              width="125px"
            />
            
            {/* Status Filter */}
            <CustomDropdown
              options={statusOptions}
              value={status}
              onChange={(val) => setStatus(val)}
              width="122px"
            />
          </div>
        </div>


        {/* Data Table */}
        <div className="mx-[100px] bg-[#fffff2] rounded-t-[10px] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#fffff2] h-[40px] border-b border-[#888888] flex items-center px-[31px]">
            <div className="flex items-center gap-4 flex-1">
              {/* Removed checkbox from table header */}
            </div>
            <div className="w-[216px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('pet_name')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Pet Name</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'pet_name' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'pet_name' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[190px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('species')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Species</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'species' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'species' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[215px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('breed')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Breed</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'breed' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'breed' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[216px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('owner_name')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">User</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'owner_name' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'owner_name' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[216px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('status')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Status</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'status' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'status' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
            <div className="w-[172px] flex items-center gap-1 cursor-pointer" onClick={() => handleSort('date_registered')}>
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Registered Date</span>
              <img src="/fa6-solid_sort.png" alt="Sort" style={{ width: 10, height: 16, marginLeft: 4, transition: 'transform 0.2s',
                filter: sortConfig.key === 'date_registered' && sortConfig.direction !== 'none' ? 'brightness(1.2)' : 'brightness(0.7)',
                transform:
                  sortConfig.key !== 'date_registered' || sortConfig.direction === 'none' ? 'rotate(0deg)' :
                  sortConfig.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
              }} />
            </div>
          </div>

          {/* Table Rows or Empty State - paginated */}
          {filteredPets.length === 0 ? (
            <div className="h-[80px] flex items-center justify-center text-[#888888] text-[16px] font-['Inter:Regular',sans-serif]">
              There are no pets found
            </div>
          ) : (
            filteredPets
              .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
              .map((pet) => (
                <div
                  key={pet.id}
                  className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[31px] hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(pet.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Removed checkbox from table row */}
                  </div>
                  <div className="w-[216px] flex items-center gap-3">
                    <div className="w-[35px] h-[35px] rounded-full overflow-hidden">
                      <img 
                        src={pet.pet_image || "/pat-removebg-preview 1.png"} 
                        alt={pet.pet_name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <span className="font-['Inter:Bold',sans-serif] font-bold text-[12px] text-black">{pet.pet_name}</span>
                  </div>
                  <div className="w-[190px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{pet.species}</span>
                  </div>
                  <div className="w-[215px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{pet.breed}</span>
                  </div>
                  <div className="w-[216px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{pet.owner_name}</span>
                  </div>
                  <div className="w-[216px]">
                    <div className="bg-[#c2f0b3] h-[30px] w-[66px] rounded-[5px] flex items-center justify-center">
                      <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                        {pet.status || (pet.is_active ? 'Active' : 'Inactive')}
                      </span>
                    </div>
                  </div>
                  <div className="w-[172px]">
                    <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                      {new Date(pet.date_registered).toLocaleDateString('en-US', { 
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
          <span className="text-[#888888] text-[12px]">/ {Math.max(1, Math.ceil(filteredPets.length / rowsPerPage))}</span>
          <button
            className="w-[24px] h-[24px] flex items-center justify-center text-[#888888] hover:text-black"
            onClick={() => setCurrentPage((prev) => (prev < Math.ceil(filteredPets.length / rowsPerPage) ? prev + 1 : prev))}
            disabled={currentPage >= Math.ceil(filteredPets.length / rowsPerPage)}
          >
            <ChevronDown className="w-[11px] h-[21px] -rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPets;
import { useAdminAuth } from '../../context/AdminAuthContext';
import React, { useState, useEffect, useCallback } from 'react';
import AdminTopNav from './AdminTopNav';
import { ChevronDown, Search, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPets = () => {
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
  const { adminAxios } = useAdminAuth();
  const [petsData, setPetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPets, setSelectedPets] = useState([]);
  const navigate = useNavigate();

  const fetchPetsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAxios.get('/admin/pets')
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
    setFilteredPets(filtered);
  }, [searchTerm, petsData, dateRange, status]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedPets(petsData.map(pet => pet.id));
    } else {
      setSelectedPets([]);
    }
  };

  const handleSelectPet = (petId, checked) => {
    if (checked) {
      setSelectedPets([...selectedPets, petId]);
    } else {
      setSelectedPets(selectedPets.filter(id => id !== petId));
    }
  };

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
                className="bg-[#f0e4b3] h-[31px] w-[122px] rounded-[5px] px-3 pr-8 text-[12px] text-black font-['Inter:Regular',sans-serif] border-none outline-none cursor-pointer"
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


        {/* Data Table */}
        <div className="mx-[100px] bg-[#fffff2] rounded-t-[10px] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#fffff2] h-[40px] border-b border-[#888888] flex items-center px-[31px]">
            <div className="flex items-center gap-4 flex-1">
              <input
                type="checkbox"
                checked={selectedPets.length === petsData.length && petsData.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-[12px] h-[12px] border border-[#888888] rounded-[1px]"
              />
            </div>
            <div className="w-[216px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Pet Name</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[190px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Species</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[215px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Breed</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[216px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">User</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[216px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Status</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[172px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Registered Date</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
          </div>

          {/* Table Rows or Empty State */}
          {filteredPets.length === 0 ? (
            <div className="h-[80px] flex items-center justify-center text-[#888888] text-[16px] font-['Inter:Regular',sans-serif]">
              There are no pets found
            </div>
          ) : (
            filteredPets.map((pet) => (
              <div
                key={pet.id}
                className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[31px] hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(pet.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedPets.includes(pet.id)}
                    onClick={e => e.stopPropagation()}
                    onChange={(e) => handleSelectPet(pet.id, e.target.checked)}
                    className="w-[12px] h-[12px] border border-[#888888] rounded-[1px]"
                  />
                </div>
                <div className="w-[216px] flex items-center gap-3">
                  <div className="w-[35px] h-[35px] rounded-full overflow-hidden">
                    <img 
                      src={pet.pet_image || "/pat-removebg-preview 2.png"} 
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
      </div>
    </div>
  );
};

export default AdminPets;
import { useAdminAuth } from '../../context/AdminAuthContext';
import React, { useState, useEffect, useCallback } from 'react';
import AdminTopNav from './AdminTopNav';
import { ChevronDown, Search, ArrowUpDown } from 'lucide-react';

const AdminPets = () => {
  const { adminAxios } = useAdminAuth();
  const [petsData, setPetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPets, setSelectedPets] = useState([]);

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
          return { data: { data: [] } };
        });
      setPetsData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch pets data:', error);
      setPetsData([
        {
          id: 1,
          pet_name: "Bruno",
          species: "Dog",
          breed: "Pitbull",
          owner_name: "Maria Garcia",
          status: "Active",
          date_registered: "2025-06-15",
          pet_image: "/pat-removebg-preview 2.png",
          is_active: true
        },
        {
          id: 2,
          pet_name: "Charlie",
          species: "Cat",
          breed: "Domestic Shorthair", 
          owner_name: "Mal Beausoleil",
          status: "Active",
          date_registered: "2025-06-04",
          pet_image: "/pat-removebg-preview 2.png",
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [adminAxios]);

  useEffect(() => {
    fetchPetsData();
  }, [fetchPetsData]);

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
              <div className="bg-[#f0e4b3] h-[31px] w-[125px] rounded-[5px] flex items-center justify-between px-3 cursor-pointer">
                <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">Date Range</span>
                <ChevronDown className="w-[12px] h-[12px] text-black" />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <div className="bg-[#f0e4b3] h-[31px] w-[122px] rounded-[5px] flex items-center justify-between px-3 cursor-pointer">
                <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">Status</span>
                <ChevronDown className="w-[12px] h-[12px] text-black" />
              </div>
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

          {/* Table Rows */}
          {petsData.map((pet) => (
            <div key={pet.id} className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[31px] hover:bg-gray-50">
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={selectedPets.includes(pet.id)}
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
          ))}
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
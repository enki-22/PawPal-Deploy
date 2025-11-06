import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminTopNav from './AdminTopNav';
import { ChevronDown, Search, ArrowUpDown } from 'lucide-react';

const AdminClients = () => {
  const { adminAxios } = useAdminAuth();
  const [clientsData, setClientsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClients, setSelectedClients] = useState([]);

  const fetchClientsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAxios.get('/admin/clients')
        .catch((err) => {
          console.error('❌ /admin/clients error:', err);
          if (err.response) {
            console.error('❌ Error response data:', err.response.data);
            console.error('❌ Error response status:', err.response.status);
          }
          return { data: { data: [] } };
        });
      setClientsData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch clients data:', error);
      setClientsData([
        {
          id: 1,
          name: "Maria Garcia",
          email: "mariagarcia@gmail.com",
          pet_count: 1,
          status: "Active",
          date_created: "2025-06-04",
          is_active: true
        },
        {
          id: 2,
          name: "Mal Beausoleil",
          email: "mal@gmail.com",
          pet_count: 3,
          status: "Active",
          date_created: "2025-06-04",
          is_active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [adminAxios]);

  useEffect(() => {
    fetchClientsData();
  }, [fetchClientsData]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedClients(clientsData.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleSelectClient = (clientId, checked) => {
    if (checked) {
      setSelectedClients([...selectedClients, clientId]);
    } else {
      setSelectedClients(selectedClients.filter(id => id !== clientId));
    }
  };

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
        <div className="mx-[118px] bg-[#fffff2] rounded-t-[10px] overflow-hidden">
          {/* Table Header */}
          <div className="bg-[#fffff2] h-[40px] border-b border-[#888888] flex items-center px-[32px]">
            <div className="flex items-center gap-4 flex-1">
              <input
                type="checkbox"
                checked={selectedClients.length === clientsData.length && clientsData.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-[12px] h-[12px] border border-[#888888] rounded-[1px]"
              />
            </div>
            <div className="w-[250px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Registered User</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[250px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Number of Pets Owned</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[250px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Email</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[250px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Account Status</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
            <div className="w-[250px] flex items-center gap-1">
              <span className="font-['Inter:Regular',sans-serif] text-[12px] text-[#888888]">Date Account Created</span>
              <ArrowUpDown className="w-[10px] h-[16px] text-[#888888]" />
            </div>
          </div>

          {/* Table Rows */}
          {clientsData.map((client) => (
            <div key={client.id} className="bg-[#fffff2] h-[50px] border-b border-[#888888] flex items-center px-[32px] hover:bg-gray-50">
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={selectedClients.includes(client.id)}
                  onChange={(e) => handleSelectClient(client.id, e.target.checked)}
                  className="w-[12px] h-[12px] border border-[#888888] rounded-[1px]"
                />
              </div>
              <div className="w-[250px]">
                <span className="font-['Inter:Bold',sans-serif] font-bold text-[12px] text-black">{client.name}</span>
              </div>
              <div className="w-[250px]">
                <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{client.pet_count}</span>
              </div>
              <div className="w-[250px]">
                <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">{client.email}</span>
              </div>
              <div className="w-[250px]">
                <div className="bg-[#c2f0b3] h-[30px] w-[66px] rounded-[5px] flex items-center justify-center">
                  <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                    {client.status || (client.is_active ? 'Active' : 'Inactive')}
                  </span>
                </div>
              </div>
              <div className="w-[250px]">
                <span className="font-['Inter:Regular',sans-serif] text-[12px] text-black">
                  {new Date(client.date_created).toLocaleDateString('en-US', { 
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

export default AdminClients;
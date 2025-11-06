import { useAdminAuth } from '../../context/AdminAuthContext';
import React, { useState, useEffect, useCallback } from 'react';
import AdminTopNav from './AdminTopNav';
import { ChevronDown, ArrowUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { adminAxios } = useAdminAuth();
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState("Dogs");

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching dashboard data...');
      const [stats, recentPets, flaggedCases, charts, faqs, announcements] = await Promise.all([
        adminAxios.get('/admin/dashboard/stats').catch((err) => {
          console.error('❌ /admin/dashboard/stats error:', err);
          if (err.response) {
            console.error('❌ Error response data:', err.response.data);
            console.error('❌ Error response status:', err.response.status);
          }
          return { data: { data: {} } };
        }),
        adminAxios.get('/admin/dashboard/recent-pets').catch((err) => {
          console.error('❌ /admin/dashboard/recent-pets error:', err);
          if (err.response) {
            console.error('❌ Error response data:', err.response.data);
            console.error('❌ Error response status:', err.response.status);
          }
          return { data: { data: [] } };
        }),
        adminAxios.get('/admin/dashboard/flagged-cases').catch((err) => {
          console.error('❌ /admin/dashboard/flagged-cases error:', err);
          if (err.response) {
            console.error('❌ Error response data:', err.response.data);
            console.error('❌ Error response status:', err.response.status);
          }
          return { data: { data: [] } };
        }),
        adminAxios.get('/admin/dashboard/charts').catch((err) => {
          console.error('❌ /admin/dashboard/charts error:', err);
          if (err.response) {
            console.error('❌ Error response data:', err.response.data);
            console.error('❌ Error response status:', err.response.status);
          }
          return { data: { data: {} } };
        }),
        adminAxios.get('/admin/dashboard/faqs').catch((err) => {
          console.error('❌ /admin/dashboard/faqs error:', err);
          if (err.response) {
            console.error('❌ Error response data:', err.response.data);
            console.error('❌ Error response status:', err.response.status);
          }
          return { data: { data: [] } };
        }),
        adminAxios.get('/admin/dashboard/announcements').catch((err) => {
          console.error('❌ /admin/dashboard/announcements error:', err);
          if (err.response) {
            console.error('❌ Error response data:', err.response.data);
            console.error('❌ Error response status:', err.response.status);
          }
          return { data: { data: [] } };
        })
      ]);
      setDashboardData({
        stats: stats.data.data,
        recentPets: recentPets.data.data,
        flaggedCases: flaggedCases.data.data,
        charts: charts.data.data,
        faqs: faqs.data.data,
        announcements: announcements.data.data
      });
    } catch (err) {
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [adminAxios]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = [
    {
      icon: "💬",
      value: dashboardData.stats?.total_conversations || "100",
      label: "Conversations",
      badge: "This Month"
    },
    {
      icon: "👥",
      value: dashboardData.stats?.total_users || "50",
      label: "Users"
    },
    {
      icon: "🐾",
      value: dashboardData.stats?.total_pets || "100",
      label: "Pets"
    },
    {
      icon: "📊",
      value: dashboardData.stats?.total_reports || "100",
      label: "SOAP Reports",
      badge: "Last 7 Days"
    }
  ];

  const symptoms = [
    { symptom: "Vomiting", count: 21 },
    { symptom: "Eye Discharge", count: 16 },
    { symptom: "Appetite Loss", count: 14 },
  ];

  const symptomsBySpecies = dashboardData.charts?.symptoms_by_species || {
    Dogs: ["Vomiting", "Diarrhea"],
    Cats: ["Allergies"],
    Rabbits: ["Loss of Appetite"],
    Birds: ["Feather Plucking"],
  };

  const pets = dashboardData.recentPets?.slice(0, 2) || [
    {
      pet_name: "Luna",
      species: "Cat",
      breed: "Persian",
      owner_name: "Maria Garcia",
      registration_date: "2025-06-05"
    },
    {
      pet_name: "Mocih",
      species: "Dog", 
      breed: "Shih Tzu",
      owner_name: "Jonald Kiel",
      registration_date: "2025-07-05"
    }
  ];

  const cases = dashboardData.flaggedCases?.slice(0, 3) || [
    {
      pet_name: "Charlie",
      species: "Cat",
      condition: "Upper Respiratory Infection",
      likelihood: "89%",
      urgency: "Urgent",
      owner_name: "Mal Beausoleil",
      date_flagged: "June 4"
    }
  ];

  const announcements = dashboardData.announcements || [
    {
      title: "Summer Vaccination Special",
      validity: "July 30, 2025",
      description: "Get 20% off all vaccinations during June and July. Keep your pets protected for less!"
    },
    {
      title: "New Client Welcome Package", 
      validity: "Ongoing",
      description: "First-time clients receive 15% off their initial consultation and a free pet care kit."
    }
  ];

  const faqs = dashboardData.faqs?.length > 0 ? dashboardData.faqs : [
    {
      question: "What services do you offer?",
      answer: "We offer consultations, vaccinations, deworming, surgery, diagnostics, dental care, and pet wellness programs."
    },
    {
      question: "How often should I bring my pet for a check-up?",
      answer: "Annual check-ups are recommended for healthy pets. Puppies, kittens, and senior pets may need more frequent visits."
    },
    {
      question: "What should I bring to my pet's first visit?",
      answer: "Please bring any previous medical records, vaccination history, and a stool sample if possible."
    }
  ];

  const speciesData = dashboardData.charts?.species_breakdown
    ? Object.entries(dashboardData.charts.species_breakdown).map(([name, value]) => ({ name, value }))
    : [
        { name: "Cat", value: 40 },
        { name: "Dog", value: 60 },
      ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <AdminTopNav activePage="Dashboard" />

      {/* Main Content */}
      <div className="px-[100px] pt-[114px] pb-[50px]">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-[30px] mb-[34px]">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-[10px] p-[24px]">
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{stat.icon}</div>
                {stat.badge && (
                  <div className="bg-[#efe8be] rounded-[5px] px-2 py-1 text-xs">
                    {stat.badge}
                  </div>
                )}
              </div>
              <div className="font-['Raleway:Bold',sans-serif] text-3xl mb-1">{stat.value}</div>
              <div className="font-['Raleway:Regular',sans-serif] text-[#666666]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* FAQs Section */}
        <div className="bg-white rounded-[10px] p-[31px] mb-[34px]">
          <h2 className="font-['Raleway:Bold',sans-serif] tracking-[1.1px] mb-[24px]">Frequently Asked Questions</h2>
          <div className="space-y-[10px]">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-[#666666] rounded-[5px]">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-[17px] py-[13px] flex items-center justify-between font-['Poppins:SemiBold',sans-serif] tracking-[0.9px] text-left"
                >
                  {faq.question}
                  <ChevronDown className={`size-5 transition-transform ${openFAQ === index ? 'rotate-180' : ''}`} />
                </button>
                {openFAQ === index && (
                  <div className="px-[17px] pb-[13px] font-['Poppins:Light',sans-serif] tracking-[0.75px]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex gap-[33px]">
          {/* Recently Added Pets */}
          <div className="flex-1 bg-white rounded-[10px] p-[31px]">
            <div className="flex items-center justify-between mb-[52px]">
              <h2 className="font-['Raleway:Bold',sans-serif] tracking-[1.1px]">Recently Added Pets</h2>
              <button className="bg-[#f0e4b3] rounded-[10px] px-[41px] py-2 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-['Raleway:ExtraBold',sans-serif] text-[#34113f] tracking-[0.6px]">
                Show All Pets
              </button>
            </div>
            
            <div className="space-y-[39px]">
              {pets.map((pet, index) => (
                <div key={index} className="bg-[#ebe2f7] rounded-[5px] p-[21px_25px]">
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Pet Name</div>
                      <div className="font-['Raleway:Regular',sans-serif] text-black">{pet.pet_name || pet.name}</div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Species</div>
                      <div className="font-['Raleway:Regular',sans-serif] text-black">{pet.species}</div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Breed</div>
                      <div className="font-['Raleway:Regular',sans-serif] text-black">{pet.breed}</div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Pet Owner</div>
                      <div className="font-['Raleway:Regular',sans-serif] text-black">{pet.owner_name || pet.owner}</div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Registered On</div>
                      <div className="font-['Raleway:Regular',sans-serif] text-black">
                        {pet.registration_date ? new Date(pet.registration_date).toLocaleDateString() : pet.registeredOn}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <div className="w-[300px] space-y-[22px]">
            {/* Checks by Species */}
            <div className="bg-white rounded-[10px] p-[18px]">
              <div className="flex items-center justify-between mb-4">
                <p className="font-['Raleway:Regular',sans-serif] tracking-[0.6px]">
                  <span>Checks by </span>
                  <span className="font-['Raleway:Bold',sans-serif] text-[#34113f]">Species</span>
                </p>
                <div className="bg-[#efe8be] rounded-[5px] px-2 py-1 flex items-center gap-1">
                  <span className="tracking-[0.45px]">Last 7 Days</span>
                  <ArrowUp className="size-3 rotate-180 scale-y-[-100%]" />
                </div>
              </div>
              <div className="h-[98px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={speciesData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={40} />
                    <Bar dataKey="value" fill="#815FB3" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Most Common Symptoms */}
            <div className="bg-white rounded-[10px] p-[18px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-['Raleway:Bold',sans-serif] tracking-[0.6px]">Most Common Symptoms</h3>
                <div className="bg-[#efe8be] rounded-[5px] px-2 py-1 flex items-center gap-1">
                  <span className="tracking-[0.45px]">Last 7 Days</span>
                  <ArrowUp className="size-3 rotate-180 scale-y-[-100%]" />
                </div>
              </div>
              <div className="space-y-3">
                {symptoms.map((symptom, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-[#815FB3]" />
                    <span className="font-['Raleway:Regular',sans-serif] tracking-[0.6px] flex-1">{symptom.symptom || symptom.name}</span>
                    <span className="font-['Raleway:Bold',sans-serif] tracking-[0.6px]">{symptom.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Symptoms in Species */}
            <div className="bg-white rounded-[10px] p-[18px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-['Raleway:Bold',sans-serif] tracking-[0.6px]">Common Symptoms in Species</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.keys(symptomsBySpecies).map((species) => (
                  <button
                    key={species}
                    onClick={() => setSelectedSpecies(species)}
                    className={`py-2 rounded-[5px] transition-colors ${
                      selectedSpecies === species
                        ? 'bg-[#815FB3] text-white'
                        : 'bg-[#ebe2f7] text-black'
                    }`}
                  >
                    {species}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {symptomsBySpecies[selectedSpecies]?.map((symptom, index) => (
                  <div key={index} className="bg-[#ebe2f7] rounded-[5px] p-3 text-center">
                    <p className="font-['Raleway:Regular',sans-serif]">{symptom}</p>
                  </div>
                ))}
              </div>
              <button className="w-full bg-[#f0e4b3] rounded-[10px] py-2 mt-3 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-['Raleway:ExtraBold',sans-serif] text-[#34113f] tracking-[0.6px]">
                View All Common Symptoms in Species
              </button>
            </div>

            {/* Latest SOAP Report */}
            <div className="bg-white rounded-[10px] p-[18px]">
              <h3 className="font-['Raleway:Bold',sans-serif] tracking-[0.75px] mb-4">Latest SOAP Report Generated</h3>
              <div className="space-y-2 mb-4">
                {pets.slice(0, 2).map((pet, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-[#815FB3]" />
                    <span className="font-['Inter:Regular',sans-serif]">{pet.pet_name || pet.name}</span>
                    <span className="font-['Inter:Regular',sans-serif] ml-auto">#PDX-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}{String(new Date().getDate()).padStart(2, '0')}-00{index + 1}</span>
                  </div>
                ))}
              </div>
              <button className="w-full bg-[#f0e4b3] rounded-[10px] py-2 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-['Raleway:ExtraBold',sans-serif] text-[#34113f] tracking-[0.6px]">
                View All SOAP Reports
              </button>
            </div>
          </div>
        </div>

        {/* Flagged Cases and Announcements */}
        <div className="mt-[34px] flex gap-[33px]">
          {/* Flagged Cases */}
          <div className="flex-1 bg-white rounded-[10px] p-[36px]">
            <div className="flex items-center justify-between mb-[87px]">
              <h2 className="font-['Raleway:Bold',sans-serif] tracking-[1px]">Flagged Cases</h2>
              <button className="bg-[#f0e4b3] rounded-[10px] px-[78px] py-2 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-['Raleway:ExtraBold',sans-serif] text-[#34113f] tracking-[0.6px]">
                View All Flagged SOAP Reports
              </button>
            </div>
            
            <div className="space-y-[1px]">
              {cases.map((caseItem, index) => (
                <div key={index} className="bg-[#ebe2f7] rounded-[5px] p-[23px] mb-[1px]">
                  <div className="grid grid-cols-6 gap-4 items-center">
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Pet Name</div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-black">{caseItem.pet_name}</div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Species</div>
                      <div className="font-['Raleway:Regular',sans-serif]">{caseItem.species}</div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Condition</div>
                      <div className="font-['Raleway:Regular',sans-serif]">{caseItem.condition || 'Under Review'}</div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Likelihood</div>
                      <div className="font-['Raleway:Regular',sans-serif]">{caseItem.likelihood || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Urgency</div>
                      <div className="bg-[#ffd2a8] rounded-[5px] px-2 py-1 inline-block">
                        <span className="font-['Raleway:Regular',sans-serif]">{caseItem.urgency || caseItem.flag_level}</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666] mb-2">Pet Owner</div>
                      <div className="font-['Raleway:Regular',sans-serif]">{caseItem.owner_name}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#666666]/50">
                    <div className="font-['Raleway:SemiBold',sans-serif] text-[#666666]">Date Flagged</div>
                    <div className="font-['Raleway:Regular',sans-serif]">
                      {caseItem.date_flagged || (caseItem.date_created ? new Date(caseItem.date_created).toLocaleDateString() : 'Recent')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="w-[300px] bg-white rounded-[10px] p-[18px]">
            <h3 className="font-['Raleway:Bold',sans-serif] text-center tracking-[0.8px] mb-[28px]">Announcement Management</h3>
            
            <div className="space-y-[25px]">
              {announcements.map((announcement, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="size-[40px] flex-shrink-0 flex items-center justify-center bg-[#57166B] text-white text-xl rounded">
                      📢
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-['Raleway:Bold',sans-serif] tracking-[0.75px] mb-2">{announcement.title}</h4>
                      <p className="font-['Raleway:Light',sans-serif] tracking-[0.75px] mb-2">
                        Valid until: {announcement.validity || (announcement.valid_until ? new Date(announcement.valid_until).toLocaleDateString() : 'Ongoing')}
                      </p>
                      <p className="font-['Raleway:Regular',sans-serif] tracking-[0.65px]">{announcement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full bg-[#f0e4b3] rounded-[10px] py-2 mt-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-['Raleway:ExtraBold',sans-serif] text-[#34113f] tracking-[0.6px]">
              View All Announcements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
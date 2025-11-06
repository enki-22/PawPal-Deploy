import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminTopNav from './AdminTopNav';

import { BarChart, XAxis, YAxis, Bar } from 'recharts';
import { ChevronDown } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  // --- State and Data Definitions ---
  const { adminAxios } = useAdminAuth();
  const [userCount, setUserCount] = useState(0);
  const [petCount, setPetCount] = useState(0);
  const [soapCount, setSoapCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  
  // Filters for SOAP Reports and Conversations (declared before useEffect)
  const [conversationFilter, setConversationFilter] = useState('This Month');
  const [soapFilter, setSoapFilter] = useState('This Month');
  
  // Stat cards in correct order with imported SVGs
  const stats = [
  { label: 'Users', value: userCount, icon: '/Group 129.png' },
  { label: 'Pets', value: petCount, icon: '/pets logo.png' },
  { label: 'SOAP Reports', value: soapCount, icon: '/soap reports.png' },
  { label: 'Conversations', value: conversationCount, icon: '/conversations.png' },
  ];

  useEffect(() => {
    // Fetch dashboard stats from the correct endpoint
    const fetchDashboardCounts = async () => {
      try {
        // Map frontend filter values to backend filter values
        const reportsFilterMap = {
          'Last 24 Hours': 'last_7_days', // Backend doesn't have last_24_hours, use last_7_days
          'Last 7 Days': 'last_7_days',
          'Last Month': 'last_30_days',
          'All Time': 'all_time'
        };
        const conversationsFilterMap = {
          'Last 24 Hours': 'this_week', // Backend doesn't have last_24_hours, use this_week
          'This Week': 'this_week',
          'This Month': 'this_month',
          'All Time': 'all_time'
        };
        
        const reportsFilter = reportsFilterMap[soapFilter] || 'all_time';
        const conversationsFilterValue = conversationsFilterMap[conversationFilter] || 'all_time';
        
        // Use the dashboard/stats endpoint which returns all counts
        const statsRes = await adminAxios.get(`/admin/dashboard/stats?reports_filter=${reportsFilter}&conversations_filter=${conversationsFilterValue}`);
        if (statsRes.data.success && statsRes.data.data) {
          setUserCount(statsRes.data.data.total_users || 0);
          setPetCount(statsRes.data.data.total_pets || 0);
          setSoapCount(statsRes.data.data.total_reports || 0);
          setConversationCount(statsRes.data.data.total_conversations || 0);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setUserCount(0);
        setPetCount(0);
        setSoapCount(0);
        setConversationCount(0);
      }
    };
    fetchDashboardCounts();
  }, [adminAxios, soapFilter, conversationFilter]);

  // FAQ state
  const [faqs, setFaqs] = useState([]);
  const [openFAQ, setOpenFAQ] = useState(null);

  useEffect(() => {
    // Fetch FAQs from correct endpoint
    const fetchFaqs = async () => {
      try {
        const response = await adminAxios.get('/admin/dashboard/faqs');
        setFaqs(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
        setFaqs([]);
      }
    };
    fetchFaqs();
  }, [adminAxios]);

  // Pets data
  const [pets, setPets] = useState([]);

  useEffect(() => {
    // Fetch recently added pets from correct endpoint
    const fetchPets = async () => {
      try {
        const response = await adminAxios.get('/admin/dashboard/recent-pets');
        setPets(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (error) {
        console.error('Failed to fetch recent pets:', error);
        setPets([]);
      }
    };
    fetchPets();
  }, [adminAxios]);

  // Flagged cases data
  const [cases, setCases] = useState([]);

  useEffect(() => {
    // Fetch flagged cases from correct endpoint
    const fetchFlaggedCases = async () => {
      try {
        const response = await adminAxios.get('/admin/dashboard/flagged-cases?filter=all');
        setCases(Array.isArray(response.data.data) ? response.data.data.slice(0, 5) : []);
      } catch (error) {
        console.error('Failed to fetch flagged cases:', error);
        setCases([]);
      }
    };
    fetchFlaggedCases();
  }, [adminAxios]);

  // Species chart data
  const [speciesFilter, setSpeciesFilter] = useState('Last 7 Days');
  const [speciesData, setSpeciesData] = useState([]);

  useEffect(() => {
    // Fetch species chart data from dashboard/charts endpoint
    const fetchSpeciesData = async () => {
      try {
        const response = await adminAxios.get('/admin/dashboard/charts');
        if (response.data.success && response.data.data) {
          const speciesBreakdown = response.data.data.species_breakdown || {};
          // Convert to array format for chart
          const speciesArray = Object.entries(speciesBreakdown).map(([name, value]) => ({
            name,
            value: value || 0
          }));
          setSpeciesData(speciesArray);
        }
      } catch (error) {
        console.error('Failed to fetch species data:', error);
        setSpeciesData([]);
      }
    };
    fetchSpeciesData();
  }, [adminAxios]);

  // Symptoms data
  const [symptoms, setSymptoms] = useState([]);
  // Symptoms by species
  const [symptomsBySpecies, setSymptomsBySpecies] = useState({});
  // Latest SOAP reports
  const [latestSoapReports, setLatestSoapReports] = useState([]);
  // Announcements data
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // Fetch symptoms data from dashboard/charts endpoint
    const fetchSymptoms = async () => {
      try {
        const response = await adminAxios.get('/admin/dashboard/charts');
        if (response.data.success && response.data.data) {
          setSymptoms(Array.isArray(response.data.data.common_symptoms) ? response.data.data.common_symptoms : []);
          setSymptomsBySpecies(response.data.data.symptoms_by_species || {});
        }
      } catch (error) {
        console.error('Failed to fetch symptoms:', error);
        setSymptoms([]);
        setSymptomsBySpecies({});
      }
    };
    // Fetch latest SOAP reports from reports endpoint
    const fetchLatestSoapReports = async () => {
      try {
        const response = await adminAxios.get('/admin/reports?limit=5');
        // Backend returns results array
        const reports = response.data.results || response.data.data || [];
        setLatestSoapReports(reports.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch latest SOAP reports:', error);
        setLatestSoapReports([]);
      }
    };
    // Fetch announcements from dashboard/announcements endpoint
    const fetchAnnouncements = async () => {
      try {
        const response = await adminAxios.get('/admin/dashboard/announcements');
        setAnnouncements(Array.isArray(response.data.data) ? response.data.data : []);
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
        setAnnouncements([]);
      }
    };
    fetchSymptoms();
    fetchLatestSoapReports();
    fetchAnnouncements();
  }, [adminAxios]);

  // ...existing code...

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <AdminTopNav activePage="Dashboard" />
      <div className="px-[100px] pt-[114px] pb-[50px]">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-[30px] mb-[34px]">
          {stats.map((stat, index) => {
            // ...existing stat card code...
            return (
              <div key={index} style={{position: 'relative', width: 300, height: 110, background: '#FFFFFF', borderRadius: 10}}>
                {/* For Users stat, show only the logo without circle */}
                <div style={{position: 'absolute', width: 76.5, height: 76.5, left: 29, top: 17, background: '#EFE8BE', borderRadius: '100px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <img src={stat.icon} alt={stat.label} style={{width: 57.375, height: 57.375, objectFit: 'contain'}} />
                </div>
                  {/* Dropdown for SOAP Reports and Conversations */}
                  {(stat.label === 'SOAP Reports' || stat.label === 'Conversations') && (
                    <div style={{position: 'absolute', width: 85, height: 20, right: 15, top: 15, background: '#EFE8BE', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', cursor: 'pointer'}}>
                      <select
                        value={stat.label === 'SOAP Reports' ? soapFilter : conversationFilter}
                        onChange={stat.label === 'SOAP Reports'
                          ? (e) => setSoapFilter(e.target.value)
                          : (e) => setConversationFilter(e.target.value)
                        }
                        style={{background: 'transparent', border: 'none', fontFamily: 'Raleway', fontWeight: 400, fontSize: 11, color: '#000', outline: 'none', width: '110px', cursor: 'pointer'}}
                      >
                        <option value="Last 24 Hours">Last 24 Hours</option>
                        <option value="Last 7 Days">Last 7 Days</option>
                        <option value="Last Month">Last Month</option>
                        <option value="All Time">All Time</option>
                      </select>
                    </div>
                  )}
                  {/* Centered value and label */}
                  <div style={{position: 'absolute', left: 122, top: '50%', transform: 'translateY(-50%)', textAlign: 'left'}}>
                    <div style={{width: 99, height: 35, fontFamily: 'Raleway', fontWeight: 700, fontSize: 30, lineHeight: '35px', letterSpacing: '0.05em', color: '#34113F'}}>{stat.value}</div>
                    <div style={{width: 99, height: 16, fontFamily: 'Raleway', fontWeight: 400, fontSize: 14, lineHeight: '16px', letterSpacing: '0.05em', color: '#000000'}}>{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Main Content Grid: Left (FAQ, Pets, Flagged Cases) and Right (Charts, Symptoms, Announcements) */}
          <div className="grid grid-cols-3 gap-[30px] mb-[34px]">
            {/* Left Column */}
            <div className="col-span-2 flex flex-col gap-[30px]">
              {/* FAQ */}
              <div className="bg-white rounded-[10px] p-[28px]">
                <h2 className="font-['Raleway:Bold',sans-serif] tracking-[1.1px] mb-[24px]">Frequently Asked Questions</h2>
                <div className="space-y-[10px]">
                  {faqs.length > 0 ? (
                    faqs.map((faq, index) => (
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
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">There are no chats yet.</div>
                  )}
                </div>
              </div>
              {/* Recently Added Pets */}
              <div className="bg-white rounded-[10px] p-[28px]">
                <div className="flex items-center justify-between mb-[28px]">
                  <h2 className="font-['Raleway:Bold',sans-serif] tracking-[1.1px]">Recently Added Pets</h2>
                  <button 
                    onClick={() => navigate('/admin/pets')}
                    className="bg-[#f0e4b3] rounded-[10px] px-[41px] py-2 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-['Raleway:ExtraBold',sans-serif] text-[#34113f] tracking-[0.6px] cursor-pointer hover:bg-[#e8d9a0] transition-colors"
                  >
                    Show All Pets
                  </button>
                </div>
                <div className="space-y-[18px]">
                  {pets.length > 0 ? (
                    pets.map((pet, index) => (
                      <div key={index} className="bg-[#ebe2f7] rounded-[5px] p-[12px_18px]">
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
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">There are no pets yet.</div>
                  )}
                </div>
              </div>
              {/* Flagged Cases */}
              <div className="bg-white rounded-[10px] p-[28px]">
                <div className="flex items-center justify-between mb-[28px]">
                  <h2 className="font-['Raleway:Bold',sans-serif] tracking-[1.1px]">Flagged Cases</h2>
                  <button 
                    onClick={() => navigate('/admin/reports')}
                    className="bg-[#f0e4b3] rounded-[10px] px-[41px] py-2 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-['Raleway:ExtraBold',sans-serif] text-[#34113f] tracking-[0.6px] cursor-pointer hover:bg-[#e8d9a0] transition-colors"
                  >
                    View All Flagged SOAP Reports
                  </button>
                </div>
                <div className="space-y-[18px]">
                  {cases.map((caseItem, index) => (
                    <div key={index} className="bg-[#ebe2f7] rounded-[5px] p-[12px_18px]">
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
            </div>
            {/* Right Column: Charts, Symptoms, Announcements */}
            <div className="flex flex-col gap-[30px]">
              {/* Checks by Species Chart */}
              <div className="bg-white rounded-[10px] p-[18px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-['Raleway:Bold',sans-serif]">Checks by <span className="text-[#57166B]">Species</span></span>
                  <select
                    value={speciesFilter}
                    onChange={e => setSpeciesFilter(e.target.value)}
                    className="bg-[#efe8be] rounded-[5px] px-2 py-1 text-xs font-semibold text-[#57166B] border-none outline-none cursor-pointer"
                    style={{ minWidth: 110 }}
                  >
                    <option value="Last 24 Hours">Last 24 Hours</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last Month">Last Month</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>
                <BarChart
                  width={300}
                  height={200}
                  data={speciesData}
                  layout="vertical"
                  margin={{ left: 60, right: 20, top: 10, bottom: 30 }}
                >
                  <YAxis type="category" dataKey="name" fontSize={16} tick={{ fill: '#34113F', fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <XAxis type="number" domain={[0, 100]} fontSize={16} tick={{ fill: '#000', fontWeight: 700 }} axisLine={false} tickLine={false} label={{ value: 'Percentage', position: 'bottom', fontSize: 16, fontWeight: 700 }} />
                  <Bar dataKey="value" fill="#efe8be" barSize={24} radius={[0, 10, 10, 0]} />
                </BarChart>
              </div>
              {/* Most Common Symptoms */}
              <div className="bg-white rounded-[10px] p-[18px]">
                <div className="font-['Raleway:Bold',sans-serif] mb-2">Most Common Symptoms</div>
                <ul className="space-y-1">
                  {symptoms.map((s, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span>{s.symptom}</span>
                      <span className="font-bold text-[#57166B]">{s.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Common Symptoms in Species */}
              <div className="bg-white rounded-[10px] p-[18px]">
                <div className="font-['Raleway:Bold',sans-serif] mb-2">Common Symptoms in Species</div>
                <ul className="space-y-1">
                  {Object.entries(symptomsBySpecies).map(([species, symptoms], i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="font-bold text-[#57166B]">{species}</span>
                      <span>{Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="mt-2 w-full bg-[#efe8be] rounded-[5px] py-1 text-xs font-bold text-[#57166B] cursor-pointer hover:bg-[#e5dba8] transition-colors"
                >
                  View All Common Symptoms in Species
                </button>
              </div>
              {/* Latest SOAP Report Generated */}
              <div className="bg-white rounded-[10px] p-[18px]">
                <div className="font-['Raleway:Bold',sans-serif] mb-2">Latest SOAP Report Generated</div>
                <ul className="space-y-1 text-xs">
                  {latestSoapReports.length > 0 ? (
                    latestSoapReports.map((report, i) => (
                      <li key={i}>
                        {report.pet_name || report.pet?.name || 'Unknown Pet'} <span className="ml-2 text-[#57166B]">{report.report_id || report.id || ''}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No SOAP reports found.</li>
                  )}
                </ul>
                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="mt-2 w-full bg-[#efe8be] rounded-[5px] py-1 text-xs font-bold text-[#57166B] cursor-pointer hover:bg-[#e5dba8] transition-colors"
                >
                  View All SOAP Reports
                </button>
              </div>
              {/* Announcement Management */}
              <div className="bg-white rounded-[10px] p-[18px]">
                <h3 className="font-['Raleway:Bold',sans-serif] text-center tracking-[0.8px] mb-[18px]">Announcement Management</h3>
                <div className="space-y-[18px]">
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
                <button 
                  onClick={() => navigate('/admin/announcements')}
                  className="w-full bg-[#f0e4b3] rounded-[10px] py-2 mt-4 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] font-['Raleway:ExtraBold',sans-serif] text-[#34113f] tracking-[0.6px] cursor-pointer hover:bg-[#e8d9a0] transition-colors"
                >
                  View All Announcements
                </button>
              </div>
            </div>
          </div>
        </div>
  {/* ...existing code... */}
    </div>
  );
}

export default AdminDashboard;
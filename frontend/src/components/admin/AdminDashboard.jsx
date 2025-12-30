import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer } from 'recharts';
import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminTopNav from './AdminTopNav';

import { ChevronDown, X } from 'lucide-react';

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
  { label: 'Users', value: userCount, icon: '/group-129.png' },
  { label: 'Pets', value: petCount, icon: '/pets logo.png' },
  { label: 'Triage Summaries', value: soapCount, icon: '/soap reports.png' },
  { label: 'Conversations', value: conversationCount, icon: '/conversations.png' },
  ];

  useEffect(() => {
    // Fetch dashboard stats from the correct endpoint
    const fetchDashboardCounts = async () => {
      try {
        // Map frontend filter values to backend filter values
        const reportsFilterMap = {
          'Last 24 Hours': 'last_24_hours',
          'Last 7 Days': 'last_7_days',
          'Last Month': 'last_30_days',
          'All Time': 'all_time'
        };
        const conversationsFilterMap = {
          'Last 24 Hours': 'last_24_hours',
          'Last 7 Days': 'last_7_days',
          'Last Month': 'last_30_days',
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
  const [selectedFaq, setSelectedFaq] = useState(null);

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
        // Map frontend filter to backend filter
        const dateFilterMap = {
          'Last 24 Hours': 'last_24_hours',
          'Last 7 Days': 'last_7_days',
          'Last Month': 'last_30_days',
          'All Time': 'all_time'
        };
        const dateFilter = dateFilterMap[speciesFilter] || 'all_time';
        
        const response = await adminAxios.get(`/admin/dashboard/charts?date_filter=${dateFilter}`);
        if (response.data.success && response.data.data) {
          const speciesBreakdown = response.data.data.species_breakdown || {};
          // Convert to array format for chart and filter out species with value 0
          const speciesArray = Object.entries(speciesBreakdown)
            .map(([name, value]) => ({ name, value: value || 0 }))
            .filter(species => species.value > 0);
          setSpeciesData(speciesArray);
        }
      } catch (error) {
        console.error('Failed to fetch species data:', error);
        setSpeciesData([]);
      }
    };
    fetchSpeciesData();
  }, [adminAxios, speciesFilter]);

  // Symptoms data
  const [symptoms, setSymptoms] = useState([]);
  // Symptoms by species
  const [symptomsBySpecies, setSymptomsBySpecies] = useState({});
  // Latest SOAP reports
  const [latestSoapReports, setLatestSoapReports] = useState([]);
  // Announcements data
  // Announcements data (sync with AdminAnnouncements page)

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
    fetchSymptoms();
    fetchLatestSoapReports();
  }, [adminAxios]);


  // ...existing code...

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <AdminTopNav activePage="Dashboard" />
      <div className="px-2 pt-20 pb-8 md:px-12 lg:px-24 xl:px-[100px] md:pt-[114px] md:pb-[50px]">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-[30px] mb-6 md:mb-[34px]">
          {stats.map((stat, index) => (
            <div key={index} className="relative bg-white rounded-lg w-full max-w-xs md:max-w-[300px] h-[110px] mx-auto flex items-center">
              <div className="absolute left-4 top-4 w-16 h-16 bg-[#EFE8BE] rounded-full shadow flex items-center justify-center">
                <img src={stat.icon} alt={stat.label} className="w-12 h-12 object-contain" />
              </div>
              {(stat.label === 'Triage Summaries' || stat.label === 'Conversations') && (
                <div className="absolute right-4 top-4 bg-[#EFE8BE] rounded px-2 py-1 flex items-center justify-center cursor-pointer">
                  <select
                    value={stat.label === 'Triage Summaries' ? soapFilter : conversationFilter}
                    onChange={stat.label === 'Triage Summaries'
                      ? (e) => setSoapFilter(e.target.value)
                      : (e) => setConversationFilter(e.target.value)
                    }
                    className="bg-transparent border-none font-inter font-normal text-xs text-black outline-none w-[90px] cursor-pointer"
                  >
                    <option value="Last 24 Hours">Last 24 Hours</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last Month">Last Month</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>
              )}
              <div className="absolute left-24 top-1/2 -translate-y-1/2 text-left">
                <div className="font-raleway font-bold text-2xl text-[#34113F]">{stat.value}</div>
                <div className="font-raleway font-normal text-base text-black">{stat.label}</div>
              </div>
            </div>
          ))}
          </div>
          {/* Main Content Grid: Left (FAQ, Pets, Flagged Cases) and Right (Charts, Symptoms, Announcements) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-[30px] mb-6 md:mb-[34px]">
            {/* Left Column */}
            <div className="col-span-1 md:col-span-2 flex flex-col gap-4 md:gap-[30px]">
              {/* FAQ */}
              <div className="bg-white rounded-lg p-4 md:p-[28px]">
                <h2 className="font-raleway font-bold tracking-wide mb-4 md:mb-[24px]">Frequently Asked Questions</h2>
                <div className="space-y-2 md:space-y-[10px]">
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
                            <div className="mb-2 text-sm font-semibold text-gray-500">
                               Asked {faq.count} times
                            </div>
                            <div 
                              className="cursor-pointer bg-gray-50 hover:bg-gray-100 p-3 rounded transition-colors"
                              onClick={() => setSelectedFaq(faq)}
                            >
                              <span className="font-semibold text-[#34113F]">Response Summary:</span>
                              <p className="mt-1 text-sm">{faq.answer_summary || faq.answer}</p>
                              <p className="mt-2 text-xs text-[#57166B] font-bold text-right">View Full Response &rarr;</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">There are no frequently asked questions yet.</div>
                  )}
                </div>
              </div>
              {/* Recently Added Pets - Fixed Header */}
              <div className="bg-white rounded-lg p-4 md:p-[28px] max-h-[350px] flex flex-col">
                <div className="flex-none flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-4 md:mb-[28px]">
                  <h2 className="font-raleway font-bold tracking-wide">Recently Added Pets</h2>
                  <button 
                    onClick={() => navigate('/admin/pets')}
                    className="bg-[#f0e4b3] rounded-lg px-6 py-2 shadow font-raleway font-extrabold text-[#34113f] tracking-wide cursor-pointer hover:bg-[#e8d9a0] transition-colors"
                  >
                    Show All Pets
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="space-y-3 md:space-y-[18px]">
                    {pets.length > 0 ? (
                      pets.map((pet, index) => (
                        <div key={index} className="bg-[#ebe2f7] rounded-md p-3 md:p-[12px_18px]">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
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
              </div>
              {/* Flagged Cases - Fixed Header */}
              <div className="bg-white rounded-lg p-4 md:p-[28px] max-h-[350px] flex flex-col">
                <div className="flex-none flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-4 md:mb-[28px]">
                  <h2 className="font-raleway font-bold tracking-wide">Flagged Cases</h2>
                  <button 
                    onClick={() => navigate('/admin/reports')}
                    className="bg-[#f0e4b3] rounded-lg px-6 py-2 shadow font-raleway font-extrabold text-[#34113f] tracking-wide cursor-pointer hover:bg-[#e8d9a0] transition-colors"
                  >
                    View All Triage Summaries
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="space-y-3 md:space-y-[18px]">
                    {cases.map((caseItem, index) => (
                      <div key={index} className="bg-[#ebe2f7] rounded-md p-3 md:p-[12px_18px]">
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-4 items-center">
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
            </div>
            {/* Right Column: Charts, Symptoms, Announcements */}
            <div className="flex flex-col gap-4 md:gap-[30px]">
              {/* Checks by Species Chart */}
              <div className="bg-white rounded-lg p-3 md:p-[18px]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-2">
                  <span className="font-raleway font-bold">Checks by <span className="text-[#57166B]">Species</span></span>
                  <select
                    value={speciesFilter}
                    onChange={e => setSpeciesFilter(e.target.value)}
                    className="bg-[#efe8be] rounded px-2 py-1 text-xs font-inter text-[#57166B] border-none outline-none cursor-pointer min-w-[110px]"
                  >
                    <option value="Last 24 Hours">Last 24 Hours</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last Month">Last Month</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>
                <div className="w-full h-[200px] md:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={speciesData}
                      layout="vertical"
                      margin={{ left: 60, right: 20, top: 10, bottom: 40 }}
                    >
                      {/* CartesianGrid removed */}
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        fontSize={14} 
                        tick={{ fill: '#34113F', fontWeight: 700 }} 
                        axisLine={true}
                        tickLine={true}
                        width={50}
                        label={{ value: 'Species', angle: -90, position: 'left', fontSize: 12, fontWeight: 700, offset: 10 }}
                      />
                      <XAxis 
                        type="number" 
                        domain={[0, 'dataMax']}
                        fontSize={12} 
                        tick={{ fill: '#000', fontWeight: 700 }} 
                        axisLine={true}
                        tickLine={true}
                        label={{ value: 'Percentage', position: 'bottom', fontSize: 12, fontWeight: 700 }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#efe8be" 
                        barSize={24} 
                        radius={0}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Most Common Symptoms */}
              <div className="bg-white rounded-lg p-3 md:p-[18px]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0 mb-4">
                  <span className="font-raleway font-bold text-base md:text-lg">Most Common Symptoms</span>
                  <select
                    value={soapFilter}
                    onChange={e => setSoapFilter(e.target.value)}
                    className="bg-[#efe8be] rounded px-2 py-1 text-xs font-semibold text-[#57166B] border-none outline-none cursor-pointer min-w-[110px]"
                  >
                    <option value="Last 24 Hours">Last 24 Hours</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last Month">Last Month</option>
                    <option value="All Time">All Time</option>
                  </select>
                </div>
                <ul className="space-y-2 md:space-y-4">
                  {symptoms.map((s, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 rounded-full" style={{ background: '#815FB3', display: 'inline-block' }} />
                        <span className="text-base text-[#111111] font-normal">{s.symptom}</span>
                      </div>
                      <span className="font-bold text-base text-[#111111]">{s.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Common Symptoms in Species */}
              <div className="bg-white rounded-lg p-3 md:p-[18px]">
                <div className="font-raleway font-bold mb-2 md:mb-4 text-base md:text-lg">Common Symptoms in Species</div>
                <div className="flex flex-col gap-2 md:gap-3">
                  {Object.entries(symptomsBySpecies).map(([species, symptoms], i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 items-center rounded-lg bg-[#f3eafd] px-2 py-2 md:px-4 md:py-3">
                      <div className="font-bold text-[#34113F] text-base bg-white rounded px-2 py-1 md:px-4 md:py-2 flex items-center justify-center mr-0 md:mr-3">{species}</div>
                      <div className="text-base text-[#34113F] bg-white rounded px-2 py-1 md:px-4 md:py-2 flex items-center">{Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}</div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="mt-3 w-full bg-[#f0e4b3] rounded-lg py-2 shadow font-raleway font-extrabold text-[#34113f] text-base tracking-wide cursor-pointer hover:bg-[#e8d9a0] transition-colors"
                >
                  View ALL Common Symptoms in Species
                </button>
              </div>
              {/* Latest SOAP Report Generated */}
              <div className="bg-white rounded-lg p-3 md:p-[18px]">
                <div className="font-raleway font-bold mb-1 md:mb-2">Latest SOAP Report Generated</div>
                <ul className="space-y-2 text-xs">
                  {latestSoapReports.length > 0 ? (
                    latestSoapReports.map((report, i) => (
                      <li key={i} className="flex justify-between items-center bg-gray-50 rounded p-2">
                        <span className="font-bold text-gray-700 truncate pr-2">
                            {report.pet_name || report.pet?.name || 'Unknown Pet'}
                        </span>
                        <span className="text-[#57166B] font-mono font-bold whitespace-nowrap">
                            {report.case_id || report.report_id || report.id || ''}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No SOAP reports found.</li>
                  )}
                </ul>
                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="mt-2 w-full bg-[#efe8be] rounded py-1 text-xs font-bold text-[#57166B] cursor-pointer hover:bg-[#e5dba8] transition-colors"
                >
                  View All Triage Summaries
                </button>
              </div>
              {/* Announcement Management */}
            </div>
          </div>
        </div>
        
        {/* Full Response Modal */}
        {selectedFaq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col relative overflow-hidden">
              <div className="bg-[#f0e4b3] p-4 flex justify-between items-center sticky top-0 z-10">
                <h3 className="font-raleway font-bold text-lg text-[#34113F] pr-8 truncate">
                  {selectedFaq.question}
                </h3>
                <button 
                  onClick={() => setSelectedFaq(null)}
                  className="text-[#34113F] hover:text-black transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="mb-4 inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-bold text-gray-600">
                  Asked {selectedFaq.count} times
                </div>
                <div className="prose max-w-none font-inter text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedFaq.full_answer || "No response content available."}
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 text-right">
                <button
                  onClick={() => setSelectedFaq(null)}
                  className="px-4 py-2 bg-[#34113F] text-white rounded hover:bg-[#57166B] transition-colors font-semibold text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default AdminDashboard;
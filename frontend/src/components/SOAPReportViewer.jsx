import React from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function MaterialSymbolsFlagRounded({ className }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#815fb3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <line x1="5" y1="21" x2="5" y2="5" />
    </svg>
  );
}

const SOAPReportViewer = ({ caseId, onClose }) => {
  const [report, setReport] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isNotesExpanded, setIsNotesExpanded] = React.useState(false);
  const { token } = useAuth();
  const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = `${API_ROOT}/api`;

  const fetchSOAPReport = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanCaseId = caseId.replace('#', '');
      const response = await axios.get(`${API_BASE_URL}/chatbot/diagnosis/soap/${cleanCaseId}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      }); 
      // Handle both response structures: response.data.data OR response.data.soap_report
      const reportData = response.data.data || response.data.soap_report;
      if (response.data.success && reportData) {
        setReport(reportData);
      } else {
        setError('Failed to load SOAP report');
      }
    } catch (err) {
      console.error('Error fetching SOAP report:', err);
      setError(err.response?.data?.error || 'Failed to load SOAP report');
    } finally {
      setLoading(false);
    }
  }, [caseId, token]);

  React.useEffect(() => { if (caseId) fetchSOAPReport(); }, [caseId, fetchSOAPReport]);
  React.useEffect(() => { document.body.classList.add('overflow-hidden'); return () => document.body.classList.remove('overflow-hidden'); }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getLikelihoodColor = (likelihood) => {
    if (likelihood >= 70) return 'bg-[rgba(231,90,90,0.77)]';
    if (likelihood >= 40) return 'bg-[#fff07b]';
    return 'bg-[rgba(137,254,114,0.56)]';
  };

  if (loading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#815fb3] mx-auto mb-4"></div><p className="text-gray-600">Loading SOAP report...</p></div></div>;
  if (error) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg p-6 text-center"><h3 className="text-xl text-red-600 mb-2">Error</h3><p className="text-gray-600 mb-4">{error}</p><button onClick={onClose} className="px-6 py-2 bg-[#815fb3] text-white rounded-lg">Close</button></div></div>;
  if (!report) return null;

  const diagnoses = Array.isArray(report.assessment) ? report.assessment : (report.assessment?.diagnoses || []);
  const verificationStatus = report.verification?.status || 'pending';
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50"
      onClick={(e) => {
        // Close when clicking on the overlay (not the content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-[#fffff2] rounded-[10px] w-full max-w-5xl my-4 md:my-8 relative max-h-[95vh] overflow-y-auto px-2 md:px-0">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }} 
          className="absolute right-4 top-4 text-3xl font-bold text-gray-600 hover:text-gray-800 z-10 cursor-pointer"
          aria-label="Close"
        >×</button>


        {/* HEADER */}
        {/* === VET NOTES (With Truncation & Wrapping Fix) === */}
        {report.verification?.note && (
            <div className="px-2 md:px-8 mt-4"> {/* Added container for proper alignment */}
                <div className={`p-4 rounded-md text-sm border break-words whitespace-pre-wrap ${
                    verificationStatus === 'verified' ? 'bg-green-50 border-green-200 text-green-800' : 
                    verificationStatus === 'flagged' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}>
                    <span className="font-bold">Vet Notes: </span>
                    <span>
                        {isNotesExpanded || report.verification.note.length <= 100
                            ? report.verification.note
                            : `${report.verification.note.substring(0, 100)}...`
                        }
                    </span>
                    
                    {/* Only show button if text is long */}
                    {report.verification.note.length > 100 && (
                        <button 
                            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                            className="ml-2 underline font-bold cursor-pointer hover:opacity-75 focus:outline-none"
                        >
                            {isNotesExpanded ? 'Show Less' : 'Read More'}
                        </button>
                    )}
                </div>
            </div>
        )}
        {/* =================================== */}
        <div className="relative pt-6 px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="w-[60px] h-[60px] relative z-10">
            <img src="/pawpalicon.png" alt="PawPal" className="w-full h-full object-contain" />
            <span className="absolute left-[50px] top-1/2 -translate-y-1/2 font-black text-[#815FB3] text-[30px] whitespace-nowrap">PAWPAL</span>
          </div>

          {/* === INSERT STAMPS HERE (Middle of Header) === */}
          {verificationStatus === 'verified' && (
            <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 transform -rotate-12 border-4 border-green-600 text-green-600 px-6 py-2 rounded-lg font-black text-2xl tracking-widest opacity-90 select-none z-0 mt-4 md:mt-0">
              VET VERIFIED
            </div>
          )}
          {verificationStatus === 'flagged' && (
            <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 transform -rotate-12 border-4 border-red-600 text-red-600 px-6 py-2 rounded-lg font-black text-2xl tracking-widest opacity-90 select-none z-0 mt-4 md:mt-0">
              REJECTED / FLAGGED
            </div>
          )}
          {verificationStatus === 'pending' && (
            <div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 transform -rotate-12 border-4 border-gray-400 text-gray-400 px-6 py-2 rounded-lg font-black text-2xl tracking-widest opacity-30 select-none z-0 mt-4 md:mt-0">
              PENDING REVIEW
            </div>
          )}
          {/* ============================================= */}

          <div className="md:absolute md:top-6 md:right-12 text-right mt-4 md:mt-0 z-10">
            <p className="text-sm text-gray-500">Date Generated: <span className="text-black">{formatDate(report.date_generated)}</span></p>
            <p className="text-sm text-gray-500">Case ID: <span className="text-black">#{report.case_id}</span></p>
          </div>
        </div>

        {/* PET & OWNER INFO */}
        <div className="px-2 md:px-8 mt-6">
          <div className="bg-[rgba(187,159,228,0.3)] rounded-[10px] p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 relative">
            <div className="space-y-2">
              <p><span className="text-gray-500 text-sm">Pet Owner Name: </span><span className="text-black text-sm">{report.owner?.name || 'N/A'}</span></p>
              <p><span className="text-gray-500 text-sm">City/Province: </span><span className="text-black text-sm">{report.owner?.city || 'N/A'}</span></p>
              <p><span className="text-gray-500 text-sm">Contact Number: </span><span className="text-black text-sm">{report.owner?.contact_number || 'N/A'}</span></p>
              <p><span className="text-gray-500 text-sm">Pet Name: </span><span className="font-bold text-black text-sm">{report.pet?.name || 'N/A'}</span></p>
              <p><span className="text-gray-500 text-sm">Animal Type: </span><span className="font-bold text-black text-sm">{report.pet?.animal_type || 'N/A'}</span></p>
              <p><span className="text-gray-500 text-sm">Breed: </span><span className="font-bold text-black text-sm">{report.pet?.breed || 'N/A'}</span></p>
            </div>
            <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-[1px] bg-black opacity-30"></div>
            <div className="space-y-2">
              <p><span className="text-gray-500 text-sm">Sex: </span><span className="font-bold text-black text-sm">{report.pet?.sex || 'N/A'}</span></p>
              <p><span className="text-gray-500 text-sm">Blood Type: </span><span className="font-bold text-black text-sm">{report.pet?.blood_type || 'N/A'}</span></p>
              <p><span className="text-gray-500 text-sm">Spayed/Neutered: </span><span className="font-bold text-black text-sm">{report.pet?.spayed_neutered || 'N/A'}</span></p>
              
              {/* FIXED AGE LOGIC */}
              {(() => {
                const ageVal = report.pet?.age;
                let displayAge = 'N/A';
                if (ageVal !== null && ageVal !== undefined) {
                  if (ageVal == 0) displayAge = 'Under 1 year';
                  else if (ageVal == 1) displayAge = '1 year';
                  else displayAge = `${ageVal} years`;
                }
                return (
                  <p><span className="text-gray-500 text-sm">Age: </span><span className="font-bold text-black text-sm">{displayAge}</span></p>
                );
              })()}
              
              <p><span className="text-gray-500 text-sm">Allergies: </span><span className="font-bold text-black text-sm">{report.pet?.allergies || 'N/A'}</span></p>
              <p><span className="text-gray-500 text-sm">Chronic Disease: </span><span className="font-bold text-black text-sm">{report.pet?.chronic_disease || 'N/A'}</span></p>
            </div>
          </div>
        </div>

        {/* 1. CLINICAL SUMMARY - Plain Text Style */}
        {(report.clinical_summary || report.ai_explanation) && (
          <div className="px-2 md:px-8 mt-6">
            <p className="font-['Inter'] text-sm md:text-base text-black leading-relaxed">
              {report.clinical_summary || report.ai_explanation}
            </p>
            
            {/* Dynamic Symptoms Sentence */}
            <p className="font-['Inter'] text-sm md:text-base text-black leading-relaxed mt-4">
              The symptoms noted include: <span className="font-semibold">{Array.isArray(report.objective?.symptoms) ? report.objective.symptoms.join(', ') : (report.objective?.symptoms || 'N/A')}</span>.
            </p>
          </div>
        )}

        {/* DIAGNOSES SECTION */}
        {diagnoses.length > 0 && (
          <div className="px-2 md:px-8 mt-6 space-y-4">
            {diagnoses.map((d, i) => {
              // Handle matched_symptoms being an array or string
              const symptomsText = (Array.isArray(d.matched_symptoms) && d.matched_symptoms.length > 0) 
                ? d.matched_symptoms.join(', ') 
                : (typeof d.matched_symptoms === 'string' && d.matched_symptoms.length > 0)
                  ? d.matched_symptoms
                  : 'None specified';

              // Determine Color
              const score = d.likelihood_percentage || 0;
              let badgeColor = 'bg-[#89FE72]'; // Green
              if (score >= 80) badgeColor = 'bg-[#E75A5A] text-white'; // Red
              else if (score >= 40) badgeColor = 'bg-[#FFF07B]'; // Yellow

              return (
                <div key={i} className="bg-[#f4f4f4] rounded-lg p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-[#815FB3] font-bold text-lg">{d.condition || d.name}</h3>
                    <span className={`${badgeColor} px-3 py-1 rounded-md text-sm font-bold shadow-sm`}>
                      Likelihood: {Math.round(score)}%
                    </span>
                  </div>
                  
                  {/* Generic Description (Fallback) */}
                  <p className="text-gray-700 text-sm mb-3">{d.description}</p>
                  
                  {/* Metadata List */}
                  <ul className="list-disc ml-5 text-sm space-y-1 text-gray-800 mb-4">
                    <li><span className="font-semibold">Matched Symptoms:</span> {symptomsText}</li>
                    <li><span className="font-semibold">Urgency:</span> {d.urgency}</li>
                    <li><span className="font-semibold">Contagious:</span> {d.contagious ? 'Yes' : 'No'}</li>
                  </ul>

                  {/* === FIX: RENDER THE SPECIFIC ADVICE === */}
                  
                  {/* What To Do Section */}
                  {d.care_guidelines && (
                    <div className="mt-3 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                      <p className="text-sm font-bold text-[#815FB3] mb-1 flex items-center gap-2">
                        <img src="/f7_lightbulb-fill.png" alt="Tip" className="w-4 h-4" />
                        What to do:
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {d.care_guidelines}
                      </p>
                    </div>
                  )}

                  {/* See Vet If Section */}
                  {d.when_to_see_vet && (
                    <div className="mt-2 bg-white p-3 rounded-md border border-gray-200 shadow-sm">
                      <p className="text-sm font-bold text-red-600 mb-1 flex items-center gap-2">
                        <img src="/mingcute_alert-line.png" alt="Alert" className="w-4 h-4" />
                        See a vet if:
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {d.when_to_see_vet}
                      </p>
                    </div>
                  )}
                  {/* ======================================== */}

                </div>
              );
            })}
          </div>
        )}

        {/* PLAN & ADVICE SECTION */}
        {report.plan && (
          <div className="px-2 md:px-8 mt-8 mb-10">
            <div className="flex items-start mb-4">
              {/* Severity Flag */}
              <div className="flex-shrink-0 mr-4 text-3xl">🚩</div>
              <div>
                <h4 className="font-bold text-black text-lg">Severity Level: {report.plan.severityLevel}</h4>
                <p className="text-sm text-gray-700 mt-1">{report.plan.aiExplanation}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-bold text-black mb-2">Care Advice:</h4>
              <ul className="list-disc ml-6 space-y-2 text-sm text-gray-800">
                {/* Map through care advice array */}
                {Array.isArray(report.plan.careAdvice) ? (
                  report.plan.careAdvice.map((advice, idx) => (
                    <li key={idx}>{advice}</li>
                  ))
                ) : (
                  <li>{report.plan.careAdvice || "No specific advice available."}</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOAPReportViewer;
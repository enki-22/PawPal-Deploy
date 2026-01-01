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
    const { token } = useAuth();
    const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
    const API_BASE_URL = `${API_ROOT}/api`;

    const handlePrint = () => {
      // Dynamic Filename: [CaseID]_[PetName]_SOAP_Report
      const originalTitle = document.title;
      const petName = report?.pet?.name?.replace(/[^a-z0-9]/gi, '_') || 'Pet';
      const cleanCaseId = report?.case_id || 'Case';
      
      document.title = `${cleanCaseId}_${petName}_SOAP_Report`;
      window.print();
      document.title = originalTitle;
    };

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

    const getUrgencyBadgeColor = (urgency) => {
      switch (urgency?.toLowerCase()) {
        case 'critical':
        case 'immediate':
        case 'emergency':
          return 'bg-red-600 text-white'; // High Alert
        case 'high':
        case 'urgent':
          return 'bg-orange-500 text-white'; // Urgent
        case 'moderate':
          return 'bg-yellow-400 text-black'; // Moderate
        default:
          return 'bg-green-500 text-white'; // Routine
      }
    };

    if (loading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#815fb3] mx-auto mb-4"></div><p className="text-gray-600">Loading SOAP report...</p></div></div>;
    if (error) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-lg p-6 text-center"><h3 className="text-xl text-red-600 mb-2">Error</h3><p className="text-gray-600 mb-4">{error}</p><button onClick={onClose} className="px-6 py-2 bg-[#815fb3] text-white rounded-lg">Close</button></div></div>;
    if (!report) return null;

    const diagnoses = Array.isArray(report.assessment) ? report.assessment : (report.assessment?.diagnoses || []);
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50 no-print-overlay"
        onClick={(e) => {
          // Close when clicking on the overlay (not the content)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* FINALIZED PRINT CSS FOR UNIFORM MARGINS */}
        <style>{`
          @media print {
            @page { margin: 0mm; size: auto; }
            html, body { 
              height: auto !important; 
              overflow: visible !important; 
              background: white !important; 
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * { visibility: hidden; }
            .no-print-overlay { 
              position: static !important; 
              display: block !important; 
              background: none !important; 
              padding: 0 !important; 
              margin: 0 !important;
              overflow: visible !important;
              height: auto !important;
              width: 100% !important;
            }
            .soap-report-content { 
              visibility: visible !important; 
              position: absolute !important; 
              left: 0 !important;
              top: 0 !important;
              width: 100% !important; 
              max-height: none !important; 
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important; /* Managed by table spacers now */
              display: block !important;
              background-color: #fffff2 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .soap-report-content * { visibility: visible !important; }
            .no-print { display: none !important; }
            
            /* Table-based Page Spacing Logic */
            .print-table { width: 100%; border-collapse: collapse; }
            .print-spacer-header { height: 15mm; display: table-header-group; }
            .print-spacer-footer { height: 15mm; display: table-footer-group; }
            
            .report-section-group, .triage-banner, .differential-card { 
              break-inside: avoid !important; 
              page-break-inside: avoid !important;
              display: block !important;
            }
          }
        `}</style>

        <div className="soap-report-content bg-[#fffff2] rounded-[10px] w-full max-w-5xl my-4 md:my-8 relative max-h-[95vh] overflow-y-auto px-2 md:px-0 shadow-2xl">
          <table className="print-table">
            <thead className="print-spacer-header"><tr><td></td></tr></thead>
            <tbody>
              <tr>
                <td>
                  <div className="px-4 md:px-8">
                    <div className="report-section-group">

          {/* HEADER */}
          
          <div className="relative pt-6 flex flex-col md:flex-row items-center justify-center md:justify-between">
            <div className="flex items-center space-x-1 justify-center md:justify-start z-10">
              <img src="/pawpalicon.png" alt="PawPal" className="w-[60px] h-[60px] object-contain" style={{imageRendering: 'crisp-edges'}} />
              <span className="font-black text-[#815FB3] text-[30px] whitespace-nowrap">PAWPAL</span>
            </div>

            

            <div className="text-center md:text-right mt-4 md:mt-0 z-10">
              <p className="text-xs md:text-sm text-gray-500">Date Generated: <span className="text-black">{formatDate(report.date_generated)}</span></p>
              <p className="text-xs md:text-sm text-gray-500">Case ID: <span className="text-black">#{report.case_id}</span></p>
            </div>
          </div>

          {/* PET & OWNER INFO */}
          <div className="mt-6">
            <div className="info-block bg-[rgba(187,159,228,0.15)] rounded-lg p-4 md:p-6 border border-[#815FB3]/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 md:gap-x-16 gap-y-3 md:gap-y-4 text-sm text-gray-900">
                {/* Left Column */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Pet Owner Name:</span>
                    <span className="font-semibold text-gray-900 sm:font-medium">{report.owner?.name || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">City/Province:</span>
                    <span className="font-semibold text-gray-900 sm:font-medium">{report.owner?.city || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Contact Number:</span>
                    <span className="font-semibold text-gray-900 sm:font-medium">{report.owner?.contact_number || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Pet Name:</span>
                    <span className="font-bold text-black">{report.pet?.name || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Animal Type:</span>
                    <span className="font-bold text-black">{report.pet?.animal_type || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Breed:</span>
                    <span className="font-bold text-black">{report.pet?.breed || 'N/A'}</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Sex:</span>
                    <span className="font-bold text-black">{report.pet?.sex || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Blood Type:</span>
                    <span className="font-bold text-black">{report.pet?.blood_type || 'Unknown'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Spayed/Neutered:</span>
                    <span className="font-bold text-black">{report.pet?.spayed_neutered || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Age:</span>
                    <span className="font-bold text-black">{report.pet?.age} {report.pet?.age == 1 ? 'year' : 'years'} old</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Allergies:</span>
                    <span className="font-bold text-black">{report.pet?.allergies || 'None'}</span>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider sm:font-bold sm:text-sm sm:text-gray-600 sm:normal-case sm:tracking-normal">Chronic Disease:</span>
                    <span className="font-bold text-black">{report.pet?.chronic_disease || 'None'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
                    </div>

          {/* TRIAGE */}
          <div className="triage-banner mt-6">
            <div className={`${getUrgencyBadgeColor(report.plan?.severityLevel)} p-4 md:p-6 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-lg border-b-4 border-black/10`}>
              <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70 mb-1">Triage Priority</p>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none">{report.plan?.severityLevel?.toUpperCase()}</h2>
                  <p className="text-xs mt-2 opacity-80">Immediate attention recommended</p>
              </div>
              <div className="text-center md:border-l border-white/20 md:pl-6">
                  <p className="text-xs font-bold opacity-70 italic uppercase">Care Timeline</p>
                  <p className="text-sm md:text-base font-black">{report.plan?.action_timeline || "Consult Veterinarian"}</p>
              </div>
            </div>
          </div>

          {/* SYMPTOMS SUMMARY */}
          <div className="mt-6 border-l-4 border-[#815FB3] pl-4">
            {(report.clinical_summary || report.ai_explanation) && (
              <p className="text-sm md:text-base text-black leading-relaxed italic mb-2">
                {report.clinical_summary || report.ai_explanation}
              </p>
            )}
            {report.objective?.symptoms && (
              <p className="text-sm text-gray-700 font-medium">
                The symptoms noted include: <span className="text-black font-bold">{Array.isArray(report.objective.symptoms) ? report.objective.symptoms.join(', ') : report.objective.symptoms}</span>.
              </p>
            )}
          </div>

          {/* Rule #2: Severity Justification - NEW section */}
          {report.plan?.aiExplanation && (
            <div className="mb-6">
              <div className="bg-white border-2 border-gray-100 p-4 rounded-lg mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Triage Rationale:</p>
                  <p className="text-sm text-gray-700 italic">{report.plan.aiExplanation}</p>
              </div>
            </div>
          )}

          {/* DIFFERENTIALS */}
          <div className="mt-8 space-y-4 pb-12">
            <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-6 uppercase">Potential Considerations (Differentials)</h3>
              {diagnoses.map((d, i) => {
                // Handle matched_symptoms being an array or string
                const symptomsText = Array.isArray(d.matched_symptoms) 
                  ? d.matched_symptoms.join(', ') 
                  : (d.matched_symptoms || 'None specified');

                // Determine Color
                const score = d.likelihood_percentage || 0;
                let badgeColor = 'bg-[#89FE72]'; // Green
                if (score >= 80) badgeColor = 'bg-[#E75A5A] text-white'; // Red
                else if (score >= 40) badgeColor = 'bg-[#FFF07B]'; // Yellow

                return (
                  <div key={i} className="differential-card bg-[#f4f4f4] rounded-lg p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-[#815FB3] font-bold text-lg">{d.condition || d.name}</h3>
                      <span className="text-[10px] font-black text-gray-500 border border-gray-300 px-2 py-1 rounded uppercase  ">
                          {d.match_level || "Potential Consideration"}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed italic border-l-4 border-[#815FB3]/20 pl-4">
                        {d.description}
                    </p>
                    
                    {/* Generic Description (Fallback) */}
                    
                    
                    

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
          

          {/* PLAN & ADVICE SECTION */}
          {report.plan && (
            <div className="mt-8 mb-10">
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
                </td>
              </tr>
            </tbody>
            <tfoot className="print-spacer-footer"><tr><td></td></tr></tfoot>
          </table>

          {/* BUTTONS CONTAINER - BOTTOM RIGHT */}
          <div className="sticky bottom-4 right-4 flex justify-end items-center gap-4 no-print px-2 md:px-8 pb-4">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#815FB3] text-white rounded-md text-sm font-bold hover:bg-[#6b4e96] transition-colors shadow-lg"
            >
              <img src="/download.png" alt="" className="w-4 h-4 brightness-0 invert" />
              Download PDF
            </button>
            <button 
              onClick={onClose} 
              className="text-3xl font-bold text-gray-600 hover:text-gray-800 cursor-pointer bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-50"
              aria-label="Close"
            >×</button>
          </div>
        </div>
      </div>
    );
  };

  export default SOAPReportViewer;
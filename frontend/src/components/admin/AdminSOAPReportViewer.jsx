import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

function MaterialSymbolsFlagRounded({ className }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#815fb3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <line x1="5" y1="21" x2="5" y2="5" />
    </svg>
  );
}
// === NEW: SUCCESS/ERROR ICONS ===
function CheckCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

function AlertCircleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}
// ================================

const AdminSOAPReportViewer = ({ caseId, onClose }) => {
  const { adminAxios } = useAdminAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handlePrint = () => {
    // Dynamic Filename: Admin_[CaseID]_[PetName]_SOAP_Report
    const originalTitle = document.title;
    const petName = report?.pet?.name?.replace(/[^a-z0-9]/gi, '_') || 'Pet';
    const cleanCaseId = report?.case_id || 'Case';
    
    document.title = `Admin_${cleanCaseId}_${petName}_SOAP_Report`;
    window.print();
    document.title = originalTitle;
  };




  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const cleanCaseId = caseId.replace('#', '');
      
      const response = await adminAxios.get(`/chatbot/diagnosis/soap/${cleanCaseId}`);
      
      if (response.data.success) {
        const data = response.data.soap_report || response.data.data;
        setReport(data);
        console.log("Backend Verification Data:", data.verification);

      } else {
        setError('Failed to load SOAP report');
      }
    } catch (err) {
      console.error('Error fetching SOAP report:', err);
      setError(err.response?.data?.error || 'Failed to load SOAP report');
    } finally {
      setLoading(false);
    }
  }, [caseId, adminAxios]);

  useEffect(() => {
    if (caseId) fetchReport();
  }, [caseId, fetchReport]);

  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);





  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUrgencyBadgeColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical':
      case 'immediate':
      case 'emergency':
        return 'bg-red-600 text-white'; 
      case 'high':
      case 'urgent':
        return 'bg-orange-500 text-white'; 
      case 'moderate':
        return 'bg-yellow-400 text-black'; 
      default:
        return 'bg-green-500 text-white'; 
    }
  };

  if (loading) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded p-8">Loading...</div></div>;
  if (error) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded p-8 text-red-600">{error} <button onClick={onClose} className="ml-4 underline">Close</button></div></div>;
  if (!report) return null;

  const diagnoses = Array.isArray(report.assessment) ? report.assessment : (report.assessment?.diagnoses || []);
  const topDiagnosis = diagnoses.length > 0 ? diagnoses[0] : null;

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
          .admin-soap-content { 
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
            padding: 0 !important;
            display: block !important;
            background-color: #fffff2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .admin-soap-content * { visibility: visible !important; }
          .no-print { display: none !important; }

          /* Table-based Page Spacing Logic */
          .print-table { width: 100%; border-collapse: collapse; }
          .print-spacer-header { height: 20mm; display: table-header-group; }
          .print-spacer-footer { height: 20mm; display: table-footer-group; }

          .admin-header-group, .triage-banner, .differential-card { 
            break-inside: avoid !important; 
            page-break-inside: avoid !important;
            display: block !important;
          }
        }
      `}</style>

      <div className="admin-soap-content bg-[#fffff2] rounded-[10px] w-full max-w-5xl my-4 md:my-8 relative max-h-[95vh] overflow-y-auto px-2 md:px-0 shadow-2xl">
        <table className="print-table">
          <thead className="print-spacer-header"><tr><td></td></tr></thead>
          <tbody>
            <tr>
              <td>
                <div className="px-4 md:px-8">
                  <div className="admin-header-group">

        {/* === 1. HEADER (PAWPAL BRANDING & INFO) === */}
        <div className="p-4 md:p-8 bg-[#fffff2]">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-6">
                <div className="flex items-center space-x-1">
                    <img src="/pawpalicon.png" alt="PawPal" className="w-[60px] h-[60px] object-contain" style={{imageRendering: 'crisp-edges'}} />
                    <span className="font-black text-[#815FB3] text-[30px] whitespace-nowrap">PAWPAL</span>
                </div>
                
                <div className="text-center md:text-right mt-4 md:mt-0">
                    <p className="text-sm text-gray-500">Date Generated: <span className="text-black font-normal">{formatDate(report.date_generated)}</span></p>
                    <p className="text-sm text-gray-500 mt-2">Case ID: <span className="text-black font-normal">#{report.case_id}</span></p>
                </div>
            </div>

            {/* INFO GRID */}
            <div className="info-block bg-[rgba(187,159,228,0.15)] rounded-lg p-6 border border-[#815FB3]/20">
                <div className="grid grid-cols-2 gap-x-16 gap-y-4 text-sm text-gray-900">
                    {/* Left Column */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Pet Owner Name:</span>
                            <span className="font-medium">{report.owner?.name || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">City/Province:</span>
                            <span className="font-medium">{report.owner?.city || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Contact Number:</span>
                            <span className="font-medium">{report.owner?.contact_number || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Pet Name:</span>
                            <span className="font-bold text-black">{report.pet?.name || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Animal Type:</span>
                            <span className="font-bold text-black">{report.pet?.animal_type || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Breed:</span>
                            <span className="font-bold text-black">{report.pet?.breed || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Sex:</span>
                            <span className="font-bold text-black">{report.pet?.sex || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Blood Type:</span>
                            <span className="font-bold text-black">{report.pet?.blood_type || 'Unknown'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Spayed/Neutered:</span>
                            <span className="font-bold text-black">{report.pet?.spayed_neutered || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Age:</span>
                            <span className="font-bold text-black">{report.pet?.age} {report.pet?.age == 1 ? 'year' : 'years'} old</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Allergies:</span>
                            <span className="font-bold text-black">{report.pet?.allergies || 'None'}</span>
                        </div>
                        <div className="grid grid-cols-[140px_1fr]">
                            <span className="font-bold text-gray-600">Chronic Disease:</span>
                            <span className="font-bold text-black">{report.pet?.chronic_disease || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>

        {/* === S.O.A.P CONTENT === */}
        <div className="p-8 space-y-10 bg-white">
            
            {/* SUBJECTIVE */}
            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">A</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-3">DVISE</h3>
                    <div className="text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                        {report.clinical_summary || report.subjective || 'No subjective information available.'}
                    </div>
                </div>
            </div>

            {/* OBJECTIVE */}
            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">R</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-3">EPORTED SYMPTOMS</h3>
                    <p className="text-[#815FB3] font-bold mb-2">See Medical Information</p>
                    <div className="space-y-1 text-gray-800">
                        <p><strong>Symptoms Entered:</strong> {Array.isArray(report.objective?.symptoms) ? report.objective.symptoms.join(', ') : report.objective?.symptoms || 'N/A'}</p>
                        <p><strong>Symptom Duration:</strong> {report.objective?.duration || 'Unspecified'}</p>
                        {report.objective?.vitals?.temperature && <p><strong>Temperature:</strong> {report.objective.vitals.temperature}</p>}
                    </div>
                </div>
            </div>

            {/* ASSESSMENT */}
            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">C</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-4">ONSIDERATIONS</h3>
                    <div className="space-y-6">
                      {/* --- CHANGE: Add Hero Banner here too --- */}
                        <div className={`triage-banner ${getUrgencyBadgeColor(report.plan?.severityLevel)} p-4 md:p-6 rounded-xl mb-8 flex flex-col md:flex-row justify-between items-center md:items-center shadow-lg border-b-4 border-black/10 gap-4 md:gap-0`}>
                            <div className="text-center md:text-left">
                                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Triage Priority</p>
                                <h2 className="text-3xl font-black tracking-tight">{report.plan?.severityLevel?.toUpperCase()}</h2>
                            </div>
                            <div className="text-center md:text-right md:border-l border-white/20 md:pl-6">
                                <p className="text-xs font-bold opacity-70 italic uppercase">Care Timeline</p>
                                <p className="text-sm font-black">{report.plan?.action_timeline || "Consult Veterinarian"}</p>
                            </div>
                        </div>

                        <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-4 uppercase">Potential Considerations (Differentials)</h3>
                        {/* --- END HERO BANNER --- */}
                        {diagnoses.length > 0 ? (
                          
                            diagnoses.map((diag, i) => (
                                <div key={i} className="differential-card bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-lg text-black">{i + 1}. {diag.condition || diag.name}</p>
                                        <span className="text-[10px] font-black text-[#815FB3] uppercase tracking-widest">
                                            {diag.match_level || "Impression"}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm mb-4 italic leading-relaxed">
                                        {diag.description}
                                    </p>
                                    
                                    
                                </div>
                            ))
                        ) : (
                            <p>No clinical differentials identified.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* PLAN */}
            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">S</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-3 uppercase">UGGESTED ACTIONS</h3>
                    
                    {/* 1. SEVERITY & AI EXPLANATION */}
                    <div className="mb-6 p-4 bg-gray-50 rounded border-l-4 border-[#815FB3]">
                        <div className="flex items-center gap-2 mb-2">
                            <MaterialSymbolsFlagRounded className="w-6 h-6" />
                            <span className="font-bold text-lg text-black">Severity Level: {report.plan?.severityLevel || "Moderate"}</span>
                        </div>
                        <p className="text-gray-800 italic">
                            {report.plan?.aiExplanation || "Veterinary consultation recommended for confirmation and treatment."}
                        </p>
                    </div>

                    {/* 2. PRIMARY ACTION PLAN (From Top Diagnosis) */}
                    {topDiagnosis && (
                        <div className="mb-6 space-y-4">
                            <h4 className="font-bold text-lg text-black border-b border-gray-200 pb-2">
                                Primary Care Plan for: <span className="text-[#815FB3]">{topDiagnosis.condition || topDiagnosis.name}</span>
                            </h4>
                            
                            {topDiagnosis.care_guidelines && (
                                <div>
                                    <p className="font-bold text-sm text-[#815FB3] flex items-center gap-2 mb-1">
                                        <img src="/f7_lightbulb-fill.png" alt="Tip" className="w-4 h-4" /> 
                                        WHAT TO DO
                                    </p>
                                    <p className="text-gray-800 text-sm leading-relaxed pl-6">
                                        {topDiagnosis.care_guidelines}
                                    </p>
                                </div>
                            )}

                            {topDiagnosis.when_to_see_vet && (
                                <div>
                                    <p className="font-bold text-sm text-red-600 flex items-center gap-2 mb-1">
                                        <img src="/mingcute_alert-line.png" alt="Alert" className="w-4 h-4" /> 
                                        SEE A VET IF
                                    </p>
                                    <p className="text-gray-800 text-sm leading-relaxed pl-6">
                                        {topDiagnosis.when_to_see_vet}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. SUPPORTIVE CARE (General Advice) */}
                    {report.plan?.careAdvice && (
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2 underline decoration-gray-300">General Supportive Care:</h4>
                            <ul className="list-disc ml-5 space-y-1 text-gray-800">
                                {Array.isArray(report.plan.careAdvice) ? (
                                    report.plan.careAdvice.map((advice, i) => <li key={i}>{advice}</li>)
                                ) : (
                                    <li>{report.plan.careAdvice}</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

        </div>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot className="print-spacer-footer"><tr><td></td></tr></tfoot>
        </table>

        {/* BUTTONS CONTAINER - BOTTOM RIGHT */}
        <div className="sticky bottom-0 right-0 flex justify-end items-center gap-4 no-print p-4">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#815FB3] text-white rounded-md text-sm font-bold hover:bg-[#6b4e96] transition-colors shadow-lg"
          >
            <img src="/download.png" alt="" className="w-4 h-4 brightness-0 invert" />
            Download PDF
          </button>
          <button 
            onClick={onClose} 
            className="text-3xl font-bold text-gray-400 hover:text-gray-600 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-gray-100 border border-gray-300"
          >
            &times;
          </button>
        </div>

      </div>
      
    </div>
  );
};

export default AdminSOAPReportViewer;
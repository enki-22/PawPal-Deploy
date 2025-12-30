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
    /* FIX: Changed items-center to items-start and added padding-top.
       This prevents the top of the modal from being cut off on scroll.
    */
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto flex justify-center items-start pt-10 pb-10">
      
      <div className="bg-white w-full max-w-5xl shadow-2xl rounded-sm flex flex-col font-sans relative mx-4 mb-10">
        
        {/* CLOSE BUTTON */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-3xl font-bold text-gray-400 hover:text-gray-600 z-10"
        >
            &times;
        </button>

        {/* === 1. HEADER (PAWPAL BRANDING & INFO) === */}
        <div className="p-8 border-b-2 border-black bg-white rounded-t-sm">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <img src="/pawpalicon.png" alt="PawPal" className="w-[60px] h-[60px] object-contain" />
                    <h1 className="text-5xl font-black text-[#815FB3] tracking-widest">PAWPAL</h1>
                </div>
                
                <div className="text-right">
                    <div className="text-gray-800 font-bold space-y-1">
                        <p className="text-sm text-gray-500">Date Generated: <span className="text-black font-normal block">{formatDate(report.date_generated)}</span></p>
                        <p className="text-sm text-gray-500 mt-2">Case ID: <span className="text-black font-normal block">#{report.case_id}</span></p>
                    </div>
                    
                    
                </div>
            </div>

            {/* INFO GRID */}
            <div className="bg-[rgba(187,159,228,0.15)] rounded-lg p-6 border border-[#815FB3]/20">
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

        {/* === S.O.A.P CONTENT === */}
        <div className="p-8 space-y-10 bg-white">
            
            {/* SUBJECTIVE */}
            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">U</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-3">SER REPORTED SYMPTOMS</h3>
                    <div className="text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                        {report.clinical_summary || report.subjective || 'No subjective information available.'}
                    </div>
                </div>
            </div>

            {/* OBJECTIVE */}
            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">P</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-3">ET INFORMATION</h3>
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
                        <div className={`${getUrgencyBadgeColor(report.plan?.severityLevel)} p-6 rounded-sm mb-8 flex justify-between items-center shadow-md`}>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">AI Risk Classification</p>
                                <h2 className="text-2xl font-black">{report.plan?.severityLevel?.toUpperCase()}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold opacity-80 italic uppercase underline">Suggested Action</p>
                                <p className="text-sm font-bold">{report.plan?.action_timeline || "Urgent Review"}</p>
                            </div>
                        </div>

                        <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-4 uppercase">Potential Considerations (Differentials)</h3>
                        {/* --- END HERO BANNER --- */}
                        {diagnoses.length > 0 ? (
                          
                            diagnoses.map((diag, i) => (
                                <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
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
      
    </div>
  );
};

export default AdminSOAPReportViewer;
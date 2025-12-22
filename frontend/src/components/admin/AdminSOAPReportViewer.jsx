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

  // Vet Verification State
  const [verificationNote, setVerificationNote] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  // === NEW: MODAL STATE ===
  const [actionModal, setActionModal] = useState({
    show: false,
    type: 'success', // 'success' or 'error'
    title: '',
    message: ''
  });

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
        if (data.verification) {
            setVerificationStatus(data.verification.status || 'pending');
            setVerificationNote(data.verification.note || '');
        }
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

  const handleVerify = async (status, noteOverride = null) => {
    try {
      setIsSubmitting(true);
      const cleanId = caseId.replace('#', '');
      
      // Use the override (from modal) if provided, otherwise use the main textarea
      const finalNote = noteOverride !== null ? noteOverride : verificationNote;

      await adminAxios.post(`/chatbot/diagnosis/verify/${cleanId}/`, {
        status: status,
        notes: finalNote
      });
      setVerificationStatus(status);
      
      // Close reject modal if it was open
      setShowRejectModal(false);

      const isApproved = status === 'verified';
      setActionModal({
        show: true,
        type: isApproved ? 'success' : 'error', 
        title: isApproved ? 'Assessment Verified' : 'Assessment Flagged',
        message: isApproved 
          ? `Case #${report.case_id} has been successfully verified. The pet owner will see the verification stamp.` 
          : `Case #${report.case_id} has been flagged for review. The pet owner will be notified.`
      });

    } catch (err) {
      console.error(err);
      // If the error is specifically about the missing note
      const errorMsg = err.response?.data?.error || 'There was an error updating the report status.';
      alert(errorMsg); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeActionModal = () => {
    setActionModal({ ...actionModal, show: false });
  };

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
                    
                    {/* === INSERT STAMPS HERE (Below Date/ID) === */}
                    <div className="mt-4 flex justify-end"> 
                        {verificationStatus === 'verified' && (
                            <div className="border-4 border-green-600 text-green-600 font-black text-xl px-4 py-2 transform -rotate-12 opacity-80 uppercase tracking-widest inline-block">
                                VERIFIED
                            </div>
                        )}
                        {verificationStatus === 'flagged' && (
                            <div className="border-4 border-red-600 text-red-600 font-black text-xl px-4 py-2 transform -rotate-12 opacity-80 uppercase tracking-widest inline-block">
                                REJECTED
                            </div>
                        )}
                        {verificationStatus === 'pending' && (
                            <div className="border-4 border-gray-400 text-gray-400 font-black text-xl px-4 py-2 transform -rotate-12 opacity-50 uppercase tracking-widest inline-block">
                                PENDING
                            </div>
                        )}
                    </div>
                    {/* ========================================== */}
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
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">S</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-3">UBJECTIVE</h3>
                    <div className="text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                        {report.clinical_summary || report.subjective || 'No subjective information available.'}
                    </div>
                </div>
            </div>

            {/* OBJECTIVE */}
            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">O</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-3">BJECTIVE</h3>
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
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">A</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-4">SSESSMENT</h3>
                    <div className="space-y-6">
                      {/* --- CHANGE: Add Hero Banner here too --- */}
                        <div className={`${getUrgencyBadgeColor(report.plan?.severityLevel)} p-6 rounded-sm mb-8 flex justify-between items-center shadow-md`}>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">AI Triage Classification</p>
                                <h2 className="text-2xl font-black">{report.plan?.severityLevel?.toUpperCase()}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold opacity-80 italic uppercase underline">Suggested Timeline</p>
                                <p className="text-sm font-bold">{report.plan?.action_timeline || "Urgent Review"}</p>
                            </div>
                        </div>

                        <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-4 uppercase">Assessment (Differentials)</h3>
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
                                    
                                    <ul className="list-none space-y-1 text-sm text-gray-700">
                                        
                                        <li><span className="font-semibold text-gray-900">Matched Symptoms:</span> {Array.isArray(diag.matched_symptoms) ? diag.matched_symptoms.join(', ') : diag.matched_symptoms}</li>
                                        
                                        <li><span className="font-semibold text-gray-900">Contagious:</span> {diag.contagious ? 'Yes' : 'No'}</li>
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p>No assessment data available.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* PLAN */}
            <div className="flex gap-6">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[#815FB3] text-white font-black text-3xl flex items-center justify-center rounded">P</div>
                </div>
                <div className="flex-1">
                    <h3 className="text-gray-400 font-bold tracking-[0.2em] text-sm mb-3 uppercase">Plan & Advice</h3>
                    
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

        {/* === VET VERIFICATION FOOTER === */}
        <div className="bg-[#f8f9fa] p-6 border-t-2 border-gray-200 rounded-b-sm">
            <h3 className="font-bold text-[#815FB3] mb-3 text-sm uppercase tracking-wide">Veterinarian Review</h3>
            <div className="flex flex-col md:flex-row gap-4">
                <textarea 
                    className="flex-1 p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-[#815FB3]"
                    rows="3"
                    placeholder="Add professional notes, corrections, or approval remarks here..."
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                />
                <div className="flex flex-col gap-2 justify-center w-full md:w-48">
                    <button 
                        onClick={() => handleVerify('verified')}
                        disabled={isSubmitting}
                        className={`w-full py-2 rounded font-bold text-white text-sm transition-colors ${
                            verificationStatus === 'verified' ? 'bg-green-700' : 'bg-green-500 hover:bg-green-600'
                        }`}
                    >
                        {isSubmitting ? 'Saving...' : '✓ APPROVE'}
                    </button>
                    <button 
                        onClick={() => {
                            setRejectReason(verificationNote); // Pre-fill if they typed in the main box
                            setShowRejectModal(true);
                        }}
                        disabled={isSubmitting}
                        className={`w-full py-2 rounded font-bold text-white text-sm transition-colors ${
                            verificationStatus === 'flagged' ? 'bg-red-700' : 'bg-red-500 hover:bg-red-600'
                        }`}
                    >
                        {isSubmitting ? 'Saving...' : '✕ FLAG / REJECT'}
                    </button>
                </div>
            </div>
        </div>
        {/* === ACTION STATUS MODAL === */}
      {actionModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" onClick={closeActionModal}></div>
          
          {/* Modal Content */}
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full text-center relative z-10 animate-in fade-in zoom-in duration-200 border-t-8 border-[#815FB3]">
            <div className="flex justify-center mb-4">
              {actionModal.type === 'success' ? (
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircleIcon className="w-10 h-10 text-green-600" />
                </div>
              ) : (
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircleIcon className="w-10 h-10 text-red-600" />
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-black text-gray-900 mb-2 font-['Inter']">
              {actionModal.title}
            </h3>
            
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {actionModal.message}
            </p>
            
            <button
              onClick={closeActionModal}
              className="w-full py-2.5 bg-[#815FB3] text-white rounded-lg font-bold hover:bg-[#6d4c96] transition-colors shadow-md"
            >
              OKAY
            </button>
          </div>
        </div>
      )}

      </div>
      {/* === REJECTION REASON MODAL === */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setShowRejectModal(false)}></div>
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full relative z-10 border-t-8 border-red-500">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Assessment</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Please provide a reason for rejecting this assessment. This note will be visible to the pet owner.
            </p>
            
            <textarea 
                className="w-full p-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-red-500 mb-4"
                rows="4"
                placeholder="e.g., Image is blurry, Symptoms unclear, Not a medical issue..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex justify-end gap-3">
                <button 
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => handleVerify('flagged', rejectReason)}
                    disabled={!rejectReason.trim()}
                    className={`px-4 py-2 text-white font-bold rounded transition-colors ${
                        !rejectReason.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                    Confirm Rejection
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSOAPReportViewer;

import React from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * Flag icon component
 */
function MaterialSymbolsFlagRounded({ className }) {
  // Simple flag icon SVG, smaller size, purple color
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#815fb3"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
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

  const fetchSOAPReport = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Remove # if present in caseId
      const cleanCaseId = caseId.replace('#', '');
      const response = await axios.get(
        `http://localhost:8000/api/chatbot/diagnosis/soap/${cleanCaseId}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          }
        }
      );
      if (response.data.success && response.data.soap_report) {
        setReport(response.data.soap_report);
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

  React.useEffect(() => {
    if (caseId) {
      fetchSOAPReport();
    }
  }, [caseId, fetchSOAPReport]);


  // Prevent main page from scrolling when modal is open
  React.useEffect(() => {
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
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

  const getLikelihoodColor = (likelihood) => {
    if (likelihood >= 70) return 'bg-[rgba(231,90,90,0.77)]';
    if (likelihood >= 40) return 'bg-[#fff07b]';
    return 'bg-[rgba(137,254,114,0.56)]';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#815fb3] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading SOAP report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#815fb3] text-white rounded-lg hover:bg-[#6d4d9a] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  // Parse diagnoses - assessment is an array, not an object with diagnoses property
  const diagnoses = Array.isArray(report.assessment) ? report.assessment : (report.assessment?.diagnoses || []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#fffff2] rounded-[10px] max-w-5xl min-w-[600px] w-full my-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-600 hover:text-gray-800 text-3xl z-10 font-bold"
        >
          ×
        </button>

        {/* Header with logo */}
        <div className="relative pt-6 px-8">
          <div className="flex items-start">
            <div className="w-[60px] h-[60px] flex-shrink-0 relative">
              <img src="/pawpalicon.png" alt="PawPal" className="w-full h-full object-contain" />
              <span
                style={{
                  position: 'absolute',
                  left: '65px', // 5px right of logo
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'MuseoModerno, sans-serif',
                  fontStyle: 'normal',
                  fontWeight: 900,
                  fontSize: '30px', // 50% larger than 20px
                  lineHeight: '44px',
                  textAlign: 'left',
                  color: '#815FB3',
                  letterSpacing: '0.02em',
                  zIndex: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                PAWPAL
              </span>
            </div>
            {/* Absolute position the right-aligned info to avoid flex restrictions */}
            <div style={{position: 'absolute', top: 24, right: 48, textAlign: 'right'}}>
              <p className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)] whitespace-nowrap">
                Date Generated: <span className="text-black">{formatDate(report.date_generated)}</span>
              </p>
              <p className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)] whitespace-nowrap">
                Case ID: <span className="text-black">#{report.case_id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Pet and Owner Information Section */}
        <div className="px-8 mt-6">
          <div className="bg-[rgba(187,159,228,0.3)] rounded-[10px] p-8 relative">
            <div className="grid grid-cols-2 gap-x-12">
              {/* Left Column */}
              <div className="space-y-3">
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Pet Owner Name: </span>
                  <span className="font-['Inter'] text-sm text-black">{report.owner?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">City/Province: </span>
                  <span className="font-['Inter'] text-sm text-black">{report.owner?.location || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Contact Number: </span>
                  <span className="font-['Inter'] text-sm text-black">{report.owner?.contact || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Pet Name: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Animal Type: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.animal_type || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Breed: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.breed || 'N/A'}</span>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="absolute left-1/2 top-6 bottom-6 w-[1px] bg-black opacity-70"></div>

              {/* Right Column */}
              <div className="space-y-3">
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Sex: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.sex || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Blood Type: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.blood_type || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Spayed/Neutered: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.spayed_neutered || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Age: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.age || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Allergies: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.allergies || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-['Inter'] text-sm text-[rgba(0,0,0,0.7)]">Chronic Disease: </span>
                  <span className="font-['Inter'] text-sm text-black font-bold">{report.pet?.chronic_disease || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subjective Section */}
        <div className="px-8 mt-6">
          <div className="font-['Inter'] text-sm text-black leading-relaxed">
            <p className="mb-4">{report.subjective || 'No subjective information available.'}</p>
            {report.objective && (
              <p>
                The symptoms noted include: {Array.isArray(report.objective.symptoms) 
                  ? report.objective.symptoms.join(', ') 
                  : report.objective.symptoms || 'N/A'}
                {report.objective.duration && `. These have persisted for approximately ${report.objective.duration}.`}
              </p>
            )}
          </div>
        </div>

        {/* Diagnoses Section */}
        {diagnoses.length > 0 && (
          <div className="px-8 mt-6 space-y-4">
            {diagnoses.map((diagnosis, index) => {
              // Handle different field name formats (condition vs name, likelihood as decimal vs percentage)
              const conditionName = diagnosis.condition || diagnosis.name || diagnosis.condition_name || 'Unknown Diagnosis';
              const likelihood = diagnosis.likelihood_percentage !== undefined 
                ? diagnosis.likelihood_percentage 
                : (typeof diagnosis.likelihood === 'number' 
                    ? (diagnosis.likelihood <= 1 ? diagnosis.likelihood * 100 : diagnosis.likelihood)
                    : 0);
              const matchedSymptoms = Array.isArray(diagnosis.matched_symptoms) 
                ? diagnosis.matched_symptoms.join(', ') 
                : (diagnosis.matched_symptoms || '');
              
              return (
                <div key={index} className="bg-[#f0f0f0] rounded-[10px] p-6 relative">
                  <div className="absolute top-6 right-6">
                    <div className={`${getLikelihoodColor(likelihood)} rounded-[5px] px-4 py-2`}>
                      <span className="font-['Inter'] text-sm text-black font-medium">
                        Likelihood: {Math.round(likelihood)}%
                      </span>
                    </div>
                  </div>
                  <p className="font-['Inter'] font-medium text-[#815fb3] text-base mb-3 pr-32">
                    {conditionName}
                  </p>
                  <div className="font-['Inter'] text-sm text-black">
                    <p className="mb-3 leading-relaxed">{diagnosis.description || ''}</p>
                    <ul className="list-disc ml-6 space-y-2">
                      {matchedSymptoms && (
                        <li>Matched Symptoms: {matchedSymptoms}</li>
                      )}
                      {diagnosis.urgency && (
                        <li>Urgency: {diagnosis.urgency}</li>
                      )}
                      {diagnosis.contagious !== undefined && (
                        <li>Contagious: {diagnosis.contagious ? 'Yes' : 'No'}</li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Severity Level Section */}
        {report.plan?.severityLevel && (
          <div className="px-8 mt-6">
            <div className="flex items-start">
              <MaterialSymbolsFlagRounded className="size-[60px] flex-shrink-0" />
              <div className="ml-4 font-['Inter'] text-sm text-black">
                <p className="mb-2">
                  <span className="font-bold text-base">Severity Level: {report.plan.severityLevel}</span>
                </p>
                <p className="leading-relaxed">{report.plan.aiExplanation || ''}</p>
              </div>
            </div>
          </div>
        )}

        {/* Care Advice Section */}
        {report.plan?.careAdvice && report.plan.careAdvice.length > 0 && (
          <div className="px-8 mt-6">
            <div className="font-['Inter'] text-sm text-black" style={{marginLeft: '64px'}}>
              <p className="font-bold mb-3 text-base">Care Advice:</p>
              <ul className="list-disc ml-6 space-y-2 leading-relaxed">
                {report.plan.careAdvice.map((advice, index) => (
                  <li key={index}>{advice}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Footer spacing */}
  <div className="h-10"></div>
      </div>
    </div>
  );
};

export default SOAPReportViewer;


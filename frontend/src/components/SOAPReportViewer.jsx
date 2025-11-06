import React from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SOAPReportViewer = ({ caseId, onClose }) => {
  const [report, setReport] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const { token } = useAuth();

  React.useEffect(() => {
    if (caseId) {
      fetchSOAPReport();
    }
  }, [caseId]);

  const fetchSOAPReport = async () => {
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
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFlagLevelColor = (flagLevel) => {
    const level = flagLevel?.toLowerCase();
    switch (level) {
      case 'emergency': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'routine': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">SOAP Report</h2>
              <p className="text-blue-100 mt-1">Case ID: {report.case_id}</p>
              <p className="text-blue-100 text-sm">Generated: {formatDate(report.date_generated)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Pet Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Pet Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <p className="text-gray-900">{report.pet.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Animal Type:</span>
                <p className="text-gray-900">{report.pet.animal_type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Breed:</span>
                <p className="text-gray-900">{report.pet.breed}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Age:</span>
                <p className="text-gray-900">{report.pet.age}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Sex:</span>
                <p className="text-gray-900">{report.pet.sex}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Weight:</span>
                <p className="text-gray-900">{report.pet.weight ? `${report.pet.weight} kg` : 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">Name:</span>
                <p className="text-gray-900">{report.owner.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="text-gray-900">{report.owner.email}</p>
              </div>
            </div>
          </div>

          {/* Subjective */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Subjective</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{report.subjective}</p>
          </div>

          {/* Objective */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-3">Objective</h3>
            <div className="space-y-2">
              {report.objective?.symptoms && (
                <div>
                  <span className="font-medium">Symptoms:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Array.isArray(report.objective.symptoms) ? (
                      report.objective.symptoms.map((symptom, idx) => (
                        <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm border border-green-300">
                          {symptom}
                        </span>
                      ))
                    ) : (
                      <span className="bg-white px-3 py-1 rounded-full text-sm border border-green-300">
                        {report.objective.symptoms}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {report.objective?.duration && (
                <div>
                  <span className="font-medium">Duration:</span> {report.objective.duration}
                </div>
              )}
            </div>
          </div>

          {/* Plan */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">Plan</h3>
            <div className="space-y-3">
              {report.plan?.severityLevel && (
                <div className={`p-3 rounded-lg border-2 ${getFlagLevelColor(report.plan.severityLevel)}`}>
                  <span className="font-medium">Severity Level:</span> {report.plan.severityLevel}
                </div>
              )}
              {report.plan?.careAdvice && Array.isArray(report.plan.careAdvice) && report.plan.careAdvice.length > 0 && (
                <div>
                  <span className="font-medium mb-2 block">Care Advice:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {report.plan.careAdvice.map((advice, idx) => (
                      <li key={idx} className="text-gray-700">{advice}</li>
                    ))}
                  </ul>
                </div>
              )}
              {report.plan?.aiExplanation && (
                <div>
                  <span className="font-medium mb-2 block">AI Explanation:</span>
                  <p className="text-gray-700 whitespace-pre-wrap">{report.plan.aiExplanation}</p>
                </div>
              )}
              {report.plan?.recommendedActions && Array.isArray(report.plan.recommendedActions) && report.plan.recommendedActions.length > 0 && (
                <div>
                  <span className="font-medium mb-2 block">Recommended Actions:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {report.plan.recommendedActions.map((action, idx) => (
                      <li key={idx} className="text-gray-700">{action}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Flag Level */}
          {report.flag_level && (
            <div className={`p-4 rounded-lg border-2 ${getFlagLevelColor(report.flag_level)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Flag Level</h4>
                  <p className="text-lg font-bold">{report.flag_level}</p>
                </div>
                {report.date_flagged && (
                  <div className="text-sm">
                    Flagged: {formatDate(report.date_flagged)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimer</h4>
            <p className="text-yellow-700 text-sm">
              This SOAP report is for informational purposes only and should not replace professional veterinary care. 
              Always consult with a licensed veterinarian for proper diagnosis and treatment of your pet&apos;s health concerns.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-200 sticky bottom-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Generated by PawPal AI System
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOAPReportViewer;


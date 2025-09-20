import React from 'react';

const DiagnosisReport = ({ report, onClose }) => {
  if (!report) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'emergency': return '🚨';
      case 'immediate': return '⚡';
      case 'soon': return '⏰';
      case 'routine': return '📅';
      default: return 'ℹ️';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">AI Diagnosis Report</h2>
              <p className="text-blue-100 mt-1">Case ID: {report.case_id}</p>
              <p className="text-blue-100">Generated: {formatDate(report.generated_at)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Pet Owner Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Pet Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Name:</span> {report.pet_owner_info.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {report.pet_owner_info.email}
              </div>
            </div>
          </div>

          {/* Pet Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Pet Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-medium">Name:</span> {report.pet_info.name}
              </div>
              <div>
                <span className="font-medium">Species:</span> {report.pet_info.species}
              </div>
              <div>
                <span className="font-medium">Breed:</span> {report.pet_info.breed}
              </div>
              <div>
                <span className="font-medium">Age:</span> {report.pet_info.age} years
              </div>
              <div>
                <span className="font-medium">Sex:</span> {report.pet_info.sex}
              </div>
              <div>
                <span className="font-medium">Weight:</span> {report.pet_info.weight ? `${report.pet_info.weight} kg` : 'Not specified'}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Medical Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Blood Type:</span> {report.medical_info.blood_type}
              </div>
              <div>
                <span className="font-medium">Spayed/Neutered:</span> {report.medical_info.spayed_neutered}
              </div>
              <div>
                <span className="font-medium">Allergies:</span> {report.medical_info.allergies}
              </div>
              <div>
                <span className="font-medium">Chronic Diseases:</span> {report.medical_info.chronic_diseases}
              </div>
            </div>
          </div>

          {/* Symptom Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Symptom Summary</h3>
            <p className="text-gray-700">{report.symptom_summary}</p>
          </div>

          {/* Severity and Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-2 ${getSeverityColor(report.overall_severity)}`}>
              <h4 className="font-semibold mb-2">Overall Severity</h4>
              <div className="text-xl font-bold">{report.overall_severity.toUpperCase()}</div>
              <div className="text-sm mt-1">Confidence: {(report.confidence_score * 100).toFixed(1)}%</div>
            </div>
            <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
              <h4 className="font-semibold mb-2 text-blue-800">Recommended Action</h4>
              <div className="text-xl font-bold text-blue-800 flex items-center">
                {getUrgencyIcon(report.urgency_level)} {report.urgency_level.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>

          {/* AI Suggested Diagnoses */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-200">
              AI Suggested Diagnoses
            </h3>
            <div className="p-4 space-y-4">
              {report.ai_suggested_diagnoses.map((diagnosis, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800">{diagnosis.condition_name}</h4>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {diagnosis.likelihood_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Likelihood</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{diagnosis.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Urgency:</span> {diagnosis.urgency_level.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Contagious:</span> {diagnosis.contagious ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {(diagnosis.confidence_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  
                  {diagnosis.matched_symptoms && diagnosis.matched_symptoms.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Matched Symptoms:</span>
                      <div className="mt-1">
                        {diagnosis.matched_symptoms.map((symptom, idx) => (
                          <span key={idx} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm mr-2 mb-1">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Explanation */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-3">AI Explanation</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{report.ai_explanation}</p>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimer</h4>
            <p className="text-yellow-700 text-sm">
              This AI diagnosis is for informational purposes only and should not replace professional veterinary care. 
              Always consult with a licensed veterinarian for proper diagnosis and treatment of your pet's health concerns.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 rounded-b-lg border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Generated by PawPal AI System for Southvalley Veterinary Clinic
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

export default DiagnosisReport;

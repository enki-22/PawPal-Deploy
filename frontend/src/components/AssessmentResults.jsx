import React from 'react';
import PropTypes from 'prop-types';

const AssessmentResults = ({ assessmentData, onSaveToAIDiagnosis, onStartNewAssessment, onAskFollowUp }) => {
  const { pet_name, predictions = [], overall_recommendation, urgency_level, symptoms_text } = assessmentData;

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical':
      case 'immediate':
      case 'emergency':
        return '🔴';
      case 'high':
      case 'soon':
      case 'urgent':
        return '🟡';
      case 'moderate':
        return '🟠';
      default:
        return '🟢';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical':
      case 'immediate':
      case 'emergency':
        return 'CRITICAL';
      case 'high':
      case 'soon':
      case 'urgent':
        return 'HIGH';
      case 'moderate':
        return 'MODERATE';
      default:
        return 'LOW';
    }
  };

  const getTimelineText = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical':
      case 'immediate':
      case 'emergency':
        return 'Seek veterinary care immediately';
      case 'high':
      case 'soon':
      case 'urgent':
        return 'Schedule vet visit within 2-6 hours';
      case 'moderate':
        return 'Schedule vet visit within 24-48 hours';
      default:
        return 'Monitor and schedule routine check-up if symptoms persist';
    }
  };

  return (
    <div className="max-w-2xl w-full">
      <div 
        className="border-2 border-gray-300 rounded-lg p-4 bg-white"
        style={{ fontFamily: 'Raleway' }}
      >
        {/* Header */}
        <div className="border-b border-gray-300 pb-2 mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            🔍 Assessment Results for {pet_name}
          </h3>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Based on the symptoms you described, here are the most likely conditions:
          </p>

          {/* Predictions - Top 3 */}
          {predictions.slice(0, 3).map((prediction, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
              <div className="mb-2">
                <h4 className="font-bold text-gray-800 text-base">
                  {index + 1}. {prediction.disease || prediction.label}
                </h4>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <div>
                    <span className="font-semibold">Confidence:</span> {Math.round((prediction.confidence || prediction.likelihood || 0) * 100)}% match
                  </div>
                  <div>
                    <span className="font-semibold">Urgency:</span> {getUrgencyColor(prediction.urgency)} {getUrgencyText(prediction.urgency)}
                  </div>
                  {prediction.timeline && (
                    <div>
                      <span className="font-semibold">Timeline:</span> {prediction.timeline}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Contagious:</span> {prediction.contagious ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              {prediction.red_flags && prediction.red_flags.length > 0 && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Red Flags Detected:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {prediction.red_flags.map((flag, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendation */}
              {prediction.recommendation && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs font-semibold text-blue-700 mb-1">💡 Recommendation:</p>
                  <p className="text-xs text-blue-600">{prediction.recommendation}</p>
                </div>
              )}

              {prediction.care_guidelines && (
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">💡 What to do:</span>
                  <br />
                  {prediction.care_guidelines}
                </div>
              )}

              {prediction.when_to_see_vet && (
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">⚠️ See a vet if:</span>
                  <br />
                  {prediction.when_to_see_vet}
                </div>
              )}
            </div>
          ))}

          {/* Overall Recommendation */}
          <div className="border-t border-gray-300 pt-3">
            <div className="mb-3">
              <span className="font-bold text-gray-800">📋 Overall Recommendation:</span>
              <br />
              <span className="text-sm text-gray-700">
                {overall_recommendation || 'Monitor your pet closely and consult with a veterinarian if symptoms worsen or persist.'}
              </span>
            </div>

            <div>
              <span className="font-bold text-gray-800">⏰ Action Timeline:</span>
              <br />
              <span className="text-sm text-gray-700">
                {getTimelineText(urgency_level)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-300 pt-4 mt-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => onSaveToAIDiagnosis(assessmentData)}
              className="px-4 py-2 bg-[#815FB3] text-white rounded-lg text-sm font-semibold hover:bg-[#6d4c96] transition-colors"
            >
              Save to AI Diagnosis
            </button>
            <button
              onClick={onStartNewAssessment}
              className="px-4 py-2 bg-[#F4D06F] text-gray-800 rounded-lg text-sm font-semibold hover:bg-[#f0c659] transition-colors"
            >
              Start New Assessment
            </button>
            <button
              onClick={onAskFollowUp}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
            >
              Ask Follow-up Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

AssessmentResults.propTypes = {
  assessmentData: PropTypes.object.isRequired,
  onSaveToAIDiagnosis: PropTypes.func.isRequired,
  onStartNewAssessment: PropTypes.func.isRequired,
  onAskFollowUp: PropTypes.func.isRequired,
};

export default AssessmentResults;

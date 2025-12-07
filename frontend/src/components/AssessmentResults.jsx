import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const AssessmentResults = ({ assessmentData, onSaveToAIDiagnosis, onStartNewAssessment, onAskFollowUp, onLogSymptoms }) => {
  const navigate = useNavigate();
  const { pet_name, predictions = [], overall_recommendation, urgency_level, triage_assessment } = assessmentData;

  // --- HELPER FUNCTIONS (Must be defined BEFORE they are used) ---
  
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

  // === SAFETY OVERRIDE: Check if backend triggered emergency override ===
  const safetyOverride = triage_assessment?.safety_override_applied || false;
  const overallUrgency = triage_assessment?.overall_urgency || urgency_level?.toLowerCase() || 'low';
  const isCritical = overallUrgency === 'critical' || safetyOverride;
  
  // Check if we can show "Monitor These Symptoms" button (only for routine, low, or moderate)
  const canStartTracking = !isCritical && 
                           overallUrgency !== 'high' && 
                           overallUrgency !== 'urgent' &&
                           (overallUrgency === 'routine' || 
                            overallUrgency === 'low' || 
                            overallUrgency === 'moderate');
  
  // Get matched symptoms from top prediction for tracking
  const topPrediction = predictions?.[0];
  const matchedSymptoms = topPrediction?.matched_symptoms || 
                         topPrediction?.symptoms || 
                         [];
  
  // Handle "Start Tracking" navigation
  const handleStartTracking = () => {
    if (matchedSymptoms.length > 0) {
      navigate('/symptom-tracker', {
        state: {
          prefillSymptoms: matchedSymptoms,
          fromDiagnosis: true,
          petName: pet_name
        }
      });
    } else {
      // If no matched symptoms, just navigate to tracker
      navigate('/symptom-tracker');
    }
  };
  
  // Use triage_assessment fields if available (takes precedence)
  const finalUrgency = isCritical ? 'critical' : overallUrgency;
  const finalTimeline = triage_assessment?.requires_care_within || getTimelineText(urgency_level);
  
  // Use the specific message from the backend if available (try every possible source)
  const finalRecommendation = triage_assessment?.urgency_reasoning?.[0] || 
                              overall_recommendation || 
                              predictions?.[0]?.recommendation ||
                              'Monitor your pet closely and consult with a veterinarian if symptoms worsen or persist.';
  
  const triageRedFlags = triage_assessment?.red_flags || [];

  return (
    <div className="max-w-2xl w-full">
      <div 
        className={`border-2 rounded-lg p-4 ${
          isCritical ? 'border-red-600 bg-red-50' : 'border-gray-300 bg-white'
        }`}
        style={{ fontFamily: 'Raleway' }}
      >
        {/* Header with Status Banner */}
        <div className={`border-b pb-2 mb-4 ${
          isCritical ? 'border-red-400' : 'border-gray-300'
        }`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${
            isCritical ? 'text-red-800' : 'text-gray-800'
          }`}>
            {isCritical ? '🚨' : (
              <img 
                src="/mingcute_search-fill.png" 
                alt="Assessment" 
                className="w-5 h-5 object-contain" 
              />
            )} 
            Assessment Results for {pet_name}
          </h3>
          {isCritical && (
            <div className="mt-2 text-sm font-bold text-red-700">
              🔴 CRITICAL - IMMEDIATE VETERINARY CARE REQUIRED
            </div>
          )}
        </div>

        {/* Safety Override Alert */}
        {safetyOverride && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-600 rounded-lg">
            <p className="text-sm font-bold text-red-900 mb-2">
              🚨 EMERGENCY SYMPTOMS DETECTED
            </p>
            <p className="text-xs text-red-800">
              The user reported symptoms that require immediate veterinary attention, 
              regardless of the matched conditions below. Please seek emergency care immediately.
            </p>
            {triageRedFlags.length > 0 && (
              <div className="mt-2 pt-2 border-t border-red-300">
                <p className="text-xs font-semibold text-red-900 mb-1">Detected Issues:</p>
                <ul className="text-xs text-red-800 space-y-1">
                  {triageRedFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

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

              {/* Low Confidence Warning */}
              {prediction.low_confidence_warning && (
                <div className="mb-2 p-3 bg-orange-50 border-2 border-orange-400 rounded">
                  <p className="text-xs font-bold text-orange-800 mb-1">⚠️ IMPORTANT NOTICE:</p>
                  <p className="text-xs text-orange-700">{prediction.low_confidence_warning}</p>
                </div>
              )}

              {/* Recommendation */}
              {prediction.recommendation && (
                <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                    <img 
                      src="/f7_lightbulb-fill.png" 
                      alt="Tip" 
                      className="w-3 h-3 object-contain" 
                    />
                    Recommendation:
                  </p>
                  <p className="text-xs text-blue-600">{prediction.recommendation}</p>
                </div>
              )}

              {prediction.care_guidelines && (
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <img 
                      src="/f7_lightbulb-fill.png" 
                      alt="Tip" 
                      className="w-3 h-3 object-contain" 
                    />
                    What to do:
                  </span>
                  <br />
                  {prediction.care_guidelines}
                </div>
              )}

              {prediction.when_to_see_vet && (
                <div className="text-sm text-gray-700">
                  <span className="font-semibold flex items-center gap-1.5">
                    <img 
                      src="/mingcute_alert-line.png" 
                      alt="Warning" 
                      className="w-3 h-3 object-contain" 
                    />
                    See a vet if:
                  </span>
                  <br />
                  {prediction.when_to_see_vet}
                </div>
              )}
            </div>
          ))}

          {/* Overall Recommendation - Respects Safety Override */}
          <div className={`border-t pt-3 ${
            isCritical ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}>
            <div className="mb-3">
              <span className={`font-bold flex items-center gap-2 ${
                isCritical ? 'text-red-800' : 'text-gray-800'
              }`}>
                {isCritical ? '🚨' : (
                  <img 
                    src="/gg_notes.png" 
                    alt="Recommendation" 
                    className="w-5 h-5 object-contain" 
                  />
                )} 
                Overall Recommendation:
              </span>
              <span className={`text-sm font-semibold block mt-1 ${
                isCritical ? 'text-red-900' : 'text-gray-700'
              }`}>
                {finalRecommendation}
              </span>
            </div>

            <div>
              <span className={`font-bold flex items-center gap-2 ${
                isCritical ? 'text-red-800' : 'text-gray-800'
              }`}>
                {isCritical ? '🚨' : (
                  <img 
                    src="/mingcute_time-fill.png" 
                    alt="Timeline" 
                    className="w-5 h-5 object-contain" 
                    style={{ filter: 'brightness(0) saturate(100%) invert(47%) sepia(32%) saturate(1188%) hue-rotate(237deg) brightness(92%) contrast(87%)' }}
                  />
                )} 
                Action Timeline:
              </span>
              <span className={`text-sm font-bold block mt-1 ${
                isCritical ? 'text-red-900' : 'text-gray-700'
              }`}>
                {finalTimeline}
              </span>
            </div>

            {/* Show original urgency for debugging if override applied */}
            {safetyOverride && triage_assessment?.original_urgency && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
                <span className="font-semibold text-yellow-800">ℹ️ Note:</span>
                <span className="text-yellow-700">
                  {' '}RAP assessment indicated &quot;{triage_assessment.original_urgency}&quot; urgency, 
                  but was overridden due to emergency symptoms typed by user.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* "Monitor These Symptoms" Button - Only for non-critical cases */}
        {canStartTracking && matchedSymptoms.length > 0 && (
          <div className="border-t border-gray-300 pt-4 mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-3">
                💡 <strong>Want to track these symptoms over time?</strong> Start monitoring to see how your pet's condition changes.
              </p>
              <button
                onClick={handleStartTracking}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>📊</span>
                Monitor These Symptoms
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t border-gray-300 pt-4 mt-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => onSaveToAIDiagnosis(assessmentData)}
              className="px-4 py-2 bg-[#815FB3] text-white rounded-lg text-sm font-semibold hover:bg-[#6d4c96] transition-colors flex items-center gap-2"
            >
              <img 
                src="/material-symbols_save.png" 
                alt="Save" 
                className="w-4 h-4 object-contain" 
                style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(14%) saturate(865%) hue-rotate(314deg) brightness(105%) contrast(100%)' }}
              />
              Save to AI Diagnosis
            </button>
            <button
              onClick={onLogSymptoms}
              className="px-4 py-2 bg-[#3498db] text-white rounded-lg text-sm font-semibold hover:bg-[#2980b9] transition-colors flex items-center gap-2"
            >
              <img 
                src="/icon-park-solid_notebook-and-pen.png" 
                alt="Log" 
                className="w-4 h-4 object-contain" 
                style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(14%) saturate(865%) hue-rotate(314deg) brightness(105%) contrast(100%)' }}
              />
              Log Daily Symptoms
            </button>
            <button
              onClick={onStartNewAssessment}
              className="px-4 py-2 bg-[#F4D06F] text-gray-800 rounded-lg text-sm font-semibold hover:bg-[#f0c659] transition-colors flex items-center gap-2"
            >
              <img 
                src="/codicon_new-file.png" 
                alt="New" 
                className="w-4 h-4 object-contain" 
                style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(14%) saturate(865%) hue-rotate(314deg) brightness(105%) contrast(100%)' }}
              />
              New Assessment
            </button>
            <button
              onClick={onAskFollowUp}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <img 
                src="/wpf_ask-question.png" 
                alt="Ask" 
                className="w-4 h-4 object-contain" 
                style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(14%) saturate(865%) hue-rotate(314deg) brightness(105%) contrast(100%)' }}
              />
              Ask Follow-up
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
  onLogSymptoms: PropTypes.func.isRequired,
};

export default AssessmentResults;
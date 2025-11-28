import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import AssessmentMethodology from './AssessmentMethodology';

const PRIMARY_COLOR = '#815FB3';
const EMERGENCY_COLOR = '#DC2626';

const RESPIRATION_OPTIONS = [
  { key: 'normal_breathing', label: 'Normal breathing', isEmergency: false },
  { key: 'breathing_faster_than_usual', label: 'Breathing faster than usual', isEmergency: false },
  { key: 'labored_or_struggling', label: 'Labored or struggling to breathe', isEmergency: true },
  { key: 'open_mouth_breathing', label: 'Open-mouth breathing (unusual for cats/dogs at rest)', isEmergency: true },
  { key: 'gasping_wheezing_noises', label: 'Gasping, wheezing, or making noises when breathing', isEmergency: true },
  { key: 'not_breathing_unresponsive', label: 'Not breathing/unresponsive', isEmergency: true },
];

const ALERTNESS_OPTIONS = [
  { key: 'alert_and_aware', label: 'Alert and aware - acting normally', isEmergency: false },
  { key: 'quieter_than_usual', label: 'Quieter than usual but still responsive', isEmergency: false },
  { key: 'lethargic', label: 'Lethargic - very tired, barely responsive', isEmergency: true },
  { key: 'disoriented_or_confused', label: 'Disoriented or confused', isEmergency: true },
  { key: 'unresponsive_or_unconscious', label: 'Unresponsive or unconscious', isEmergency: true },
];

const PERFUSION_OPTIONS = [
  { key: 'normal_pink', label: 'Normal pink', isEmergency: false },
  { key: 'pale_or_white', label: 'Pale or white', isEmergency: true },
  { key: 'blue_or_purple', label: 'Blue or purple (cyanotic)', isEmergency: true },
  { key: 'bright_red', label: 'Bright red', isEmergency: true },
  { key: 'cannot_check', label: "I can't check safely / Not sure", isEmergency: false },
];

const CRITICAL_SYMPTOMS = [
  { key: 'seizures', label: 'Seizures or convulsions' },
  { key: 'collapse', label: 'Collapse or unable to stand/walk' },
  { key: 'active_bleeding', label: "Active bleeding (profuse or won't stop)" },
  { key: 'distended_abdomen', label: 'Distended or bloated abdomen' },
  { key: 'unable_to_urinate_defecate', label: 'Unable to urinate or defecate (straining with nothing)' },
  { key: 'vomiting_blood', label: 'Vomiting blood or bloody diarrhea' },
  { key: 'suspected_poisoning', label: 'Suspected poisoning or toxin ingestion' },
  { key: 'recent_trauma', label: 'Recent trauma (hit by car, fall from height, attack)' },
  { key: 'heatstroke', label: 'Heatstroke symptoms (excessive panting, drooling, collapse in hot environment)' },
  { key: 'eye_injury', label: 'Eye injury or sudden blindness' },
  { key: 'severe_pain', label: 'Severe pain (screaming, unable to move, aggressive when touched)' },
  { key: 'difficulty_giving_birth', label: 'Difficulty giving birth / labor complications' },
];

const EmergencyScreening = ({ selectedPet, onComplete, onEmergencyDetected }) => {
  const [currentStep, setCurrentStep] = useState('0A'); // 0A (chief complaint) -> 0B (emergency indicators)
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [respiration, setRespiration] = useState(null);
  const [alertness, setAlertness] = useState(null);
  const [perfusion, setPerfusion] = useState(null);
  const [criticalSymptoms, setCriticalSymptoms] = useState([]);
  const [showEmergencyWarning, setShowEmergencyWarning] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  
  const containerRef = useRef(null);
  const petName = selectedPet?.name || 'your pet';

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentStep, showEmergencyWarning]);

  const handleChiefComplaintContinue = () => {
    if (chiefComplaint.trim()) {
      setCurrentStep('0B');
    }
  };

  const toggleCriticalSymptom = (key) => {
    setCriticalSymptoms((prev) => {
      if (prev.includes(key)) {
        return prev.filter((s) => s !== key);
      }
      return [...prev, key];
    });
  };

  const checkForEmergency = () => {
    // Check if any emergency conditions are met
    const hasRespirationEmergency = RESPIRATION_OPTIONS.find(
      (opt) => opt.key === respiration && opt.isEmergency
    );
    const hasAlertnessEmergency = ALERTNESS_OPTIONS.find(
      (opt) => opt.key === alertness && opt.isEmergency
    );
    const hasPerfusionEmergency = PERFUSION_OPTIONS.find(
      (opt) => opt.key === perfusion && opt.isEmergency
    );
    const hasCriticalSymptoms = criticalSymptoms.length > 0;

    return hasRespirationEmergency || hasAlertnessEmergency || hasPerfusionEmergency || hasCriticalSymptoms;
  };

  const handleCompleteScreening = () => {
    const emergencyDetected = checkForEmergency();
    setIsEmergency(emergencyDetected);

    if (emergencyDetected) {
      setShowEmergencyWarning(true);
      if (onEmergencyDetected) {
        onEmergencyDetected({
          respiration,
          alertness,
          perfusion,
          criticalSymptoms,
        });
      }
    } else {
      // No emergency, complete the screening
      completeScreening(false);
    }
  };

  const completeScreening = (emergency) => {
    const emergencyData = {
      chiefComplaint: chiefComplaint.trim(),
      emergencyScreen: {
        respiration,
        alertness,
        perfusion,
        criticalSymptoms,
        isEmergency: emergency,
      },
      timestamp: new Date().toISOString(),
    };

    if (onComplete) {
      onComplete(emergencyData);
    }
  };

  const handleContinueAssessmentFromWarning = () => {
    completeScreening(true);
  };

  const canCompleteScreening = respiration && alertness && perfusion;

  if (showEmergencyWarning) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-gray-500" style={{ fontFamily: 'Raleway' }}>
            Emergency Screening
          </span>
        </div>

        <div
          ref={containerRef}
          className="max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400"
        >
          <div
            className="border-2 border-red-200 rounded-[10px] p-5 shadow-sm"
            style={{
              backgroundColor: '#FEF2F2',
              fontFamily: 'Raleway',
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: EMERGENCY_COLOR }}
                >
                  URGENT: IMMEDIATE VETERINARY CARE NEEDED
                </h3>
                <p className="text-[14px] text-gray-800 mb-3">
                  Based on {petName}&apos;s symptoms, this could be a medical emergency. Please:
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-5">
              <div className="flex gap-3">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-bold text-[14px] text-gray-900">1. Call your emergency vet NOW</p>
                  <p className="text-[13px] text-gray-700 mt-1">
                    Find the nearest emergency veterinary clinic and call ahead to let them know you&apos;re coming.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-2xl">🚗</span>
                <div>
                  <p className="font-bold text-[14px] text-gray-900">2. Transport {petName} carefully</p>
                  <ul className="text-[13px] text-gray-700 mt-1 list-disc list-inside space-y-1">
                    <li>Keep calm and quiet</li>
                    <li>Avoid sudden movements</li>
                    <li>Keep warm with blanket</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-bold text-[14px] text-gray-900">3. Do NOT wait - time is critical</p>
                  <p className="text-[13px] text-gray-700 mt-1">
                    Emergency conditions can worsen rapidly. Immediate professional care is essential.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-red-200 pt-4">
              <p className="text-[13px] text-gray-700 mb-3">
                While you arrange transport, I can continue the assessment to provide additional information for the vet.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleContinueAssessmentFromWarning}
                  className="px-5 py-2.5 rounded-[10px] text-[14px] font-bold text-white transition-opacity hover:opacity-90 shadow-md"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  Continue Assessment
                </button>
                <a
                  href="tel:"
                  className="px-5 py-2.5 rounded-[10px] text-[14px] font-bold text-white transition-opacity hover:opacity-90 inline-block shadow-md"
                  style={{ backgroundColor: EMERGENCY_COLOR }}
                >
                  📞 Call Emergency Vet
                </a>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-[11px] text-gray-600 italic">
                This screening uses the veterinary RAP (Respiration, Alertness, Perfusion) triage system and standard emergency indicators recommended by veterinary professionals.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] text-gray-500" style={{ fontFamily: 'Raleway' }}>
          Emergency Screening - Step {currentStep === '0A' ? '1' : '2'} of 2
        </span>
      </div>

      <div
        ref={containerRef}
        className="max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400"
      >
        {currentStep === '0A' && (
          <div
            className="rounded-[10px] p-6 shadow-sm"
            style={{ 
              fontFamily: 'Raleway', 
              backgroundColor: '#FFFFF2',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}
          >
            <div className="mb-4">
              <h3 className="text-[16px] font-bold text-[#34113F] mb-3">
                Hi! I&apos;m here to help assess {petName}&apos;s symptoms. Before we start, I need to understand what&apos;s happening.
              </h3>
              <p className="text-[14px] font-semibold text-gray-800 mb-2">
                <strong>What made you concerned about {petName} today?</strong>
              </p>
              <p className="text-[13px] text-gray-600 mb-3">
                Describe in your own words what you&apos;ve noticed.
              </p>
            </div>

            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g., He's been vomiting since this morning and seems very lethargic..."
              className="w-full h-32 px-4 py-3 border border-[#D1D5DB] rounded-lg text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-[#815FB3] transition-colors bg-white"
              style={{ fontFamily: 'Raleway' }}
            />

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleChiefComplaintContinue}
                disabled={!chiefComplaint.trim()}
                className={`px-5 py-2.5 rounded-[10px] text-[14px] font-semibold text-white transition-opacity shadow-md ${
                  chiefComplaint.trim() ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
                }`}
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Continue
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-[11px] text-gray-500 italic">
                💡 This follows veterinary telephone triage best practices where asking &quot;What changed that prompted you to contact us today?&quot; helps owners identify their pet&apos;s primary concern.
              </p>
            </div>
          </div>
        )}

        {currentStep === '0B' && (
          <div
            className="rounded-[10px] p-6 shadow-sm space-y-5"
            style={{ 
              fontFamily: 'Raleway', 
              backgroundColor: '#FFFFF2',
              boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
            }}
          >
            <div>
              <h3 className="text-[16px] font-bold text-[#34113F] mb-2">
                Thank you. Now I need to check if {petName} needs immediate emergency care.
              </h3>
              <p className="text-[13px] text-gray-600">
                Please answer these questions carefully:
              </p>
            </div>

            {/* SECTION 1: RESPIRATION */}
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="text-[15px] font-bold text-gray-900 mb-2">
                🫁 SECTION 1: RESPIRATION
              </h4>
              <p className="text-[14px] text-gray-800 mb-3 font-semibold">
                How is {petName}&apos;s breathing right now?
              </p>
              <div className="space-y-2">
                {RESPIRATION_OPTIONS.map((option) => {
                  const isSelected = respiration === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setRespiration(option.key)}
                      className={`w-full text-left px-4 py-2.5 rounded-[8px] border text-[13px] transition-all ${
                        isSelected
                          ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                          : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        <span className="text-lg text-[#815FB3]">{isSelected ? '●' : '○'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-500 italic mt-2">
                Part of RAP (Respiration, Alertness, Perfusion) veterinary triage system
              </p>
            </div>

            {/* SECTION 2: ALERTNESS */}
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="text-[15px] font-bold text-gray-900 mb-2">
                🧠 SECTION 2: ALERTNESS (Level of Consciousness)
              </h4>
              <p className="text-[14px] text-gray-800 mb-3 font-semibold">
                How responsive is {petName} right now?
              </p>
              <div className="space-y-2">
                {ALERTNESS_OPTIONS.map((option) => {
                  const isSelected = alertness === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setAlertness(option.key)}
                      className={`w-full text-left px-4 py-2.5 rounded-[8px] border text-[13px] transition-all ${
                        isSelected
                          ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                          : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        <span className="text-lg text-[#815FB3]">{isSelected ? '●' : '○'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-500 italic mt-2">
                Alertness assessment from RAP triage system
              </p>
            </div>

            {/* SECTION 3: PERFUSION */}
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="text-[15px] font-bold text-gray-900 mb-2">
                💧 SECTION 3: PERFUSION (Circulation)
              </h4>
              <p className="text-[14px] text-gray-800 mb-2 font-semibold">
                If you can safely check, what color are {petName}&apos;s gums?
              </p>
              <p className="text-[12px] text-gray-600 mb-3 bg-blue-50 p-2 rounded border border-blue-100">
                💡 <strong>Helper:</strong> Gently lift {petName}&apos;s lip to see gum color. If you can&apos;t check safely, select &quot;Not sure&quot;.
              </p>
              <div className="space-y-2">
                {PERFUSION_OPTIONS.map((option) => {
                  const isSelected = perfusion === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setPerfusion(option.key)}
                      className={`w-full text-left px-4 py-2.5 rounded-[8px] border text-[13px] transition-all ${
                        isSelected
                          ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                          : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.label}</span>
                        <span className="text-lg text-[#815FB3]">{isSelected ? '●' : '○'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-500 italic mt-2">
                Perfusion assessment from RAP triage system
              </p>
            </div>

            {/* SECTION 4: CRITICAL SYMPTOMS CHECK */}
            <div className="border-l-4 border-red-400 pl-4">
              <h4 className="text-[15px] font-bold text-gray-900 mb-2">
                ⚠️ SECTION 4: CRITICAL SYMPTOMS CHECK
              </h4>
              <p className="text-[14px] text-gray-800 mb-3 font-semibold">
                Is {petName} experiencing ANY of these symptoms right now?
              </p>
              <p className="text-[12px] text-gray-600 mb-3">
                Check all that apply:
              </p>
              <div className="space-y-2">
                {CRITICAL_SYMPTOMS.map((symptom) => {
                  const isChecked = criticalSymptoms.includes(symptom.key);
                  return (
                    <button
                      key={symptom.key}
                      type="button"
                      onClick={() => toggleCriticalSymptom(symptom.key)}
                      className={`w-full text-left px-4 py-2.5 rounded-[8px] border text-[13px] transition-all ${
                        isChecked
                          ? 'bg-red-50 border-red-400 text-gray-900 shadow-sm font-medium'
                          : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg flex-shrink-0">{isChecked ? '☑' : '☐'}</span>
                        <span className="flex-1">{symptom.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-500 italic mt-2">
                Standard veterinary emergency indicators
              </p>
            </div>

            {/* Complete Button */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-gray-600">
                  {canCompleteScreening
                    ? 'Please complete all sections above to continue.'
                    : 'Answer all required questions to proceed.'}
                </p>
                <button
                  type="button"
                  onClick={handleCompleteScreening}
                  disabled={!canCompleteScreening}
                  className={`px-5 py-2.5 rounded-[10px] text-[14px] font-semibold text-white transition-opacity shadow-md ${
                    canCompleteScreening ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
                  }`}
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  Complete Screening
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-[11px] text-gray-500 italic">
                This screening uses the veterinary RAP (Respiration, Alertness, Perfusion) triage system and standard emergency indicators recommended by veterinary professionals.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Assessment Methodology Section */}
      <AssessmentMethodology />
    </div>
  );
};

EmergencyScreening.propTypes = {
  selectedPet: PropTypes.shape({
    name: PropTypes.string.isRequired,
    species: PropTypes.string,
    breed: PropTypes.string,
    age: PropTypes.number,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  onEmergencyDetected: PropTypes.func,
};

export default EmergencyScreening;
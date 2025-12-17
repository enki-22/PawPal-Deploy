import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import AssessmentMethodology from './AssessmentMethodology';
import EmergencyScreening from './EmergencyScreening';

const PRIMARY_COLOR = '#815FB3';
const ACCENT_COLOR = '#F4D06F';

const EXOTIC_SPECIES = ['Bird', 'Fish', 'Reptile', 'Turtle', 'Amphibian'];

const MAIN_CONCERNS = [
  { id: 'Digestive Issues', label: 'Digestive Issues', icon: '/hugeicons_digestion.png', vtlCategory: 'Gastrointestinal' },
  { id: 'Respiratory Problems', label: 'Respiratory Problems', icon: '/mingcute_lungs-fill.png', vtlCategory: 'Respiratory' },
  { id: 'Skin & Coat Issues', label: 'Skin & Coat Issues', icon: '/streamline-ultimate-color_hair-skin.png', vtlCategory: 'Generalised/External' },
  { id: 'Behavioral Changes', label: 'Behavioral Changes', icon: '/mdi_brain.png', vtlCategory: 'Neurological/Generalised' },
  { id: 'Movement Problems', label: 'Movement Problems', icon: '/twemoji_paw-prints.png', vtlCategory: 'Musculoskeletal' },
  { id: 'Eyes & Ears', label: 'Eyes & Ears', icon: '/icon-park-outline_eyes.png', vtlCategory: 'Generalised/External' },
  { id: 'Urinary Issues', label: 'Urinary Issues', icon: '/entypo_water.png', vtlCategory: 'Urogenital' },
  { id: 'Oral/Dental Problems', label: 'Oral/Dental Problems', icon: '/streamline-sharp_tooth-remix.png', vtlCategory: 'Generalised' },
  { id: 'Other', label: 'Other', icon: '/basil_other-1-solid.png', vtlCategory: 'Generalised' },
];

const PRIMARY_SYMPTOMS_BY_CONCERN = {
  'Digestive Issues': [
    'vomiting',
    'diarrhea',
    'loss_of_appetite',
    'constipation',
    'weight_loss',
    'bloating',
    'gas',
    'excessive_eating',
  ],
  'Respiratory Problems': [
    'coughing',
    'sneezing',
    'wheezing',
    'labored_breathing',
    'difficulty_breathing',
    'nasal_discharge',
    'nasal_congestion',
    'respiratory_distress',
  ],
  'Skin & Coat Issues': [
    'scratching',
    'itching',
    'hair_loss',
    'bald_patches',
    'red_skin',
    'irritated_skin',
    'skin_lesions',
    'rash',
    'scabs',
    'dandruff',
  ],
  'Behavioral Changes': [
    'lethargy',
    'aggression',
    'hiding',
    'restlessness',
    'confusion',
    'circling',
    'weakness',
    'seizures',
  ],
  'Movement Problems': [
    'limping',
    'lameness',
    'difficulty_walking',
    'stiffness',
    'reluctance_to_move',
    'paralysis',
  ],
  'Eyes & Ears': [
    'watery_eyes',
    'eye_discharge',
    'red_eyes',
    'squinting',
    'ear_discharge',
    'ear_scratching',
    'head_shaking',
  ],
  'Urinary Issues': [
    'blood_in_urine',
    'frequent_urination',
    'straining_to_urinate',
    'dark_urine',
    'cloudy_urine',
  ],
  'Oral/Dental Problems': [
    'bad_breath',
    'drooling',
    'difficulty_eating',
    'swollen_gums',
    'red_gums',
    'mouth_pain',
  ],
};

const GENERAL_ADDITIONAL_SYMPTOMS = [
  { code: 'fever', label: 'Fever' },
  { code: 'lethargy', label: 'Decreased activity' },
  { code: 'frequent_urination', label: 'Increased urination' },
  { code: 'dehydration', label: 'Signs of dehydration' },
  { code: 'weakness', label: 'Weakness' },
  { code: 'weight_loss', label: 'Unexplained weight loss' },
];

const SPECIES_SPECIFIC_SYMPTOMS = {
  Bird: [
    { code: 'drooping_wing', label: 'Drooping wing' },
    { code: 'feather_loss', label: 'Feather loss' },
    { code: 'wing_droop', label: 'Wing droop (both)' },
    { code: 'fluffed_feathers', label: 'Fluffed feathers most of the time' },
    { code: 'tail_bobbing', label: 'Tail bobbing when breathing' },
  ],
  Fish: [
    { code: 'white_spots', label: 'White spots on body or fins' },
    { code: 'fin_rot', label: 'Fin rot or frayed fins' },
    { code: 'swimming_upside_down', label: 'Swimming upside down or sideways' },
    { code: 'gasping_at_surface', label: 'Gasping at the water surface' },
    { code: 'clamped_fins', label: 'Clamped fins' },
    { code: 'rubbing_against_objects', label: 'Rubbing against decorations' },
    { code: 'cloudy_eyes', label: 'Cloudy eyes' },
  ],
  Rabbit: [
    { code: 'head_tilt', label: 'Head tilt' },
    { code: 'rolling', label: 'Rolling or flipping over' },
    { code: 'loss_of_balance', label: 'Loss of balance' },
    { code: 'dental_issues', label: 'Dental issues (overgrown teeth, drooling)' },
  ],
  'Small Mammals': [
    { code: 'wet_tail', label: 'Wet tail' },
    { code: 'lumps', label: 'Lumps' },
    { code: 'bumps', label: 'Bumps' },
    { code: 'overgrown_teeth', label: 'Overgrown teeth' },
  ],
};

const SEVERITY_OPTIONS = [
  {
    key: 'mild',
    label: '🟢 Mild (occasional, pet is still active)',
  },
  {
    key: 'moderate',
    label: '🟡 Moderate (frequent, pet seems uncomfortable)',
  },
  {
    key: 'severe',
    label: '🔴 Severe (constant, pet is very weak/distressed)',
  },
];

const DURATION_OPTIONS = [
  { key: 'lt_24h', label: 'Less than 24 hours', days: 0.5 },
  { key: '1_3d', label: '1-3 days', days: 2.0 },
  { key: '3_7d', label: '3-7 days', days: 5.0 },
  { key: 'gt_7d', label: 'More than a week', days: 10.0 },
];

const PROGRESSION_OPTIONS = [
  { key: 'getting_worse', label: 'Getting worse', emoji: '📈' },
  { key: 'staying_same', label: 'Staying about the same', emoji: '➡️' },
  { key: 'getting_better', label: 'Getting better', emoji: '📉' },
  { key: 'intermittent', label: 'Coming and going (intermittent)', emoji: '🔄' },
];

const getSpeciesCategory = (speciesRaw) => {
  if (!speciesRaw) return null;
  const s = String(speciesRaw).toLowerCase();
  if (s === 'bird') return 'Bird';
  if (s === 'fish') return 'Fish';
  if (s === 'rabbit') return 'Rabbit';
  if (['hamster', 'guinea pig', 'gerbil', 'rat', 'mouse'].includes(s)) return 'Small Mammals';
  return null;
};

const formatSymptomLabel = (code) => {
  if (!code) return '';
  return code
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const ConversationalSymptomChecker = ({ selectedPet, onComplete, onCancel, sessionId }) => {
  // Emergency screening state
  const [showEmergencyScreening, setShowEmergencyScreening] = useState(true);
  const [emergencyData, setEmergencyData] = useState(null);
  
  // Main questionnaire state
  const [currentStep, setCurrentStep] = useState(1); // 1-5
  const [selectedMainConcern, setSelectedMainConcern] = useState(null);
  const [selectedVtlCategory, setSelectedVtlCategory] = useState(null);
  const [primarySymptoms, setPrimarySymptoms] = useState([]);
  const [pendingPrimarySymptoms, setPendingPrimarySymptoms] = useState([]);
  const [severity, setSeverity] = useState(null); // mild | moderate | severe
  const [severityLabel, setSeverityLabel] = useState('');
  const [durationKey, setDurationKey] = useState(null);
  const [durationDays, setDurationDays] = useState(null);
  const [durationLabel, setDurationLabel] = useState('');
  const [progression, setProgression] = useState(null);
  const [progressionLabel, setProgressionLabel] = useState('');
  const [showProgression, setShowProgression] = useState(false);
  const [additionalSymptoms, setAdditionalSymptoms] = useState([]);
  const [pendingGeneralAdditional, setPendingGeneralAdditional] = useState([]);
  const [pendingSpeciesAdditional, setPendingSpeciesAdditional] = useState([]);
  const [otherSymptomsText, setOtherSymptomsText] = useState(''); // Hybrid Triage: user-typed symptoms
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isDynamicMode, setIsDynamicMode] = useState(false);

  const containerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  // Track the instance's session ID at mount time to detect stale callbacks
  const instanceSessionIdRef = useRef(sessionId);
  // Track if component is still mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const petName = selectedPet?.name || 'your pet';
  const petSpecies = selectedPet?.species || 'Pet';
  const petId = selectedPet?.id;

  // Update instance session ID when prop changes (shouldn't normally happen due to key)
  useEffect(() => {
    instanceSessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    // Mark as mounted
    isMountedRef.current = true;

    // Check if species requires dynamic mode
    const species = selectedPet?.species || '';
    setIsDynamicMode(EXOTIC_SPECIES.includes(species));

    // Initialize conversation when pet changes or component mounts
    setShowEmergencyScreening(true);
    setEmergencyData(null);
    setCurrentStep(1);
    setSelectedMainConcern(null);
    setSelectedVtlCategory(null);
    setPrimarySymptoms([]);
    setPendingPrimarySymptoms([]);
    setSeverity(null);
    setSeverityLabel('');
    setDurationKey(null);
    setDurationDays(null);
    setDurationLabel('');
    setProgression(null);
    setProgressionLabel('');
    setShowProgression(false);
    setAdditionalSymptoms([]);
    setPendingGeneralAdditional([]);
    setPendingSpeciesAdditional([]);
    setOtherSymptomsText(''); // Reset typed symptoms
    setShowSummary(false);
    setIsTyping(false);
    setMessages([]);

    return () => {
      // Mark as unmounted to prevent any callbacks from executing
      isMountedRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
    // Using pet id as primary dependency ensures reset when pet actually changes
  }, [selectedPet?.id, selectedPet?.name, selectedPet?.species]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentStep, showSummary]);

  const addBotMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}-${Math.random()}`,
        from: 'bot',
        text,
      },
    ]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}-${Math.random()}`,
        from: 'user',
        text,
      },
    ]);
  };

  const handleEmergencyScreeningComplete = (data) => {
    setEmergencyData(data);
    setShowEmergencyScreening(false);

    // Start main questionnaire with intro message
    const introMessage = {
      id: 'intro',
      from: 'bot',
      text: data.emergencyScreen.isEmergency
        ? `Thank you for completing the emergency screening. While you arrange veterinary care, let's gather more details about ${petName}'s condition.`
        : `Good news - based on your answers, ${petName}'s condition doesn't appear to be an immediate emergency. However, let's do a thorough assessment to understand what's going on.\n\nWhat's your main concern?`,
    };
    setMessages([introMessage]);
  };

  const handleEmergencyDetected = (criticalSymptoms) => {
    // Emergency was detected - this is called by EmergencyScreening
    // The component will show the warning and user can choose to continue
    console.log('Emergency detected:', criticalSymptoms);
  };

  const goToStepWithTyping = (nextStep, botText) => {
    if (!isMountedRef.current) return;

    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      // Guard: Don't update state if component unmounted
      if (!isMountedRef.current) return;

      setIsTyping(false);
      if (botText) {
        addBotMessage(botText);
      }
      setCurrentStep(nextStep);
    }, 600);
  };

  const handleSelectMainConcern = (concernId) => {
    const concernObj = MAIN_CONCERNS.find((c) => c.id === concernId);
    const label = concernObj ? concernObj.label : concernId;
    const vtlCategory = concernObj ? concernObj.vtlCategory : 'Generalised';
    setSelectedMainConcern(label);
    setSelectedVtlCategory(vtlCategory);
    addUserMessage(`${label}`);
    addBotMessage(`Got it, ${label}. Let me ask about specific symptoms.`);
    goToStepWithTyping(2, `Which of these symptoms is ${petName} experiencing? (Select all that apply)`);
  };

  const handleTogglePrimarySymptom = (code) => {
    setPendingPrimarySymptoms((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const handleConfirmPrimarySymptoms = () => {
    if (!pendingPrimarySymptoms.length) return;
    setPrimarySymptoms(pendingPrimarySymptoms);
    const labels = pendingPrimarySymptoms.map((code) => formatSymptomLabel(code));
    addUserMessage(`Primary symptoms: ${labels.join(', ')}`);
    goToStepWithTyping(3, 'How severe are these symptoms?');
  };

  const handleSelectSeverity = (option) => {
    setSeverity(option.key);
    setSeverityLabel(option.label);
  };

  const handleConfirmSeverity = () => {
    if (!severity) return;
    addUserMessage(`Severity: ${severityLabel}`);
    goToStepWithTyping(4, `How long has ${petName} been experiencing these symptoms?`);
  };

  const handleSelectDuration = (option) => {
    setDurationKey(option.key);
    setDurationDays(option.days);
    setDurationLabel(option.label);
  };

  const handleConfirmDuration = () => {
    if (!durationKey) return;
    addUserMessage(`Duration: ${durationLabel}`);
    setShowProgression(true);
    goToStepWithTyping(4, `How are ${petName}'s symptoms changing?`);
  };

  const handleSelectProgression = (option) => {
    setProgression(option.key);
    setProgressionLabel(option.label);
  };

  const handleConfirmProgression = () => {
    if (!progression) return;
    addUserMessage(`Progression: ${progressionLabel}`);
    setShowProgression(false);
    goToStepWithTyping(
      5,
      `Are there any other symptoms you've noticed in ${petName}? (Optional - you can skip this)`,
    );
  };

  const handleToggleGeneralAdditional = (code) => {
    setPendingGeneralAdditional((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const handleToggleSpeciesAdditional = (code) => {
    setPendingSpeciesAdditional((prev) => {
      if (prev.includes(code)) {
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const finalizeAdditionalSymptomsAndShowSummary = (hasAdditional) => {
    if (!isMountedRef.current) return;

    const combined = Array.from(
      new Set([...pendingGeneralAdditional, ...pendingSpeciesAdditional]),
    );
    setAdditionalSymptoms(combined);

    if (hasAdditional && combined.length) {
      const labels = combined.map((code) => formatSymptomLabel(code));
      addUserMessage(`Additional symptoms: ${labels.join(', ')}`);
    } else {
      addUserMessage('No additional symptoms to add.');
    }

    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      // Guard: Don't update state if component unmounted
      if (!isMountedRef.current) return;

      setIsTyping(false);
      addBotMessage(`Let me summarize what you've told me about ${petName}:`);
      setShowSummary(true);
    }, 600);
  };

  const handleSkipAdditional = () => {
    finalizeAdditionalSymptomsAndShowSummary(false);
  };

  const handleDoneAdditional = () => {
    finalizeAdditionalSymptomsAndShowSummary(true);
  };

  const buildSymptomsList = () => {
    const combined = Array.from(
      new Set([...(primarySymptoms || []), ...(additionalSymptoms || [])]),
    );
    return combined;
  };

  const handleSubmitAssessment = () => {
    // Guard: Don't submit if component is no longer mounted
    if (!isMountedRef.current) {
      console.log('ConversationalSymptomChecker: Ignoring submit - component unmounted');
      return;
    }

    const symptomsList = buildSymptomsList();
    const urgency = severity || 'mild';

    const payload = {
      pet_id: petId,
      pet_name: petName,
      species: petSpecies.charAt(0).toUpperCase() + petSpecies.slice(1), // Capitalize first letter
      urgency,
      duration_days: typeof durationDays === 'number' ? durationDays : null,
      symptoms_list: symptomsList,
      symptoms_text: symptomsList.join(', '),
      symptom_count: symptomsList.length,
      main_concern: selectedMainConcern,
      vtl_category: selectedVtlCategory || null,
      severity: severity || null,
      progression: progression || null,
      // Include emergency screening data
      emergency_data: emergencyData || null,
      // Hybrid Triage: Include user-typed symptoms
      user_notes: otherSymptomsText.trim() || '',
      // Include session ID so parent can verify this callback is still valid
      _sessionId: instanceSessionIdRef.current,
    };

    if (onComplete) {
      onComplete(payload);
    }
  };

  const handleStartOver = () => {
    // Reset everything and go back to emergency screening
    setShowEmergencyScreening(true);
    setEmergencyData(null);
    setCurrentStep(1);
    setSelectedMainConcern(null);
    setSelectedVtlCategory(null);
    setPrimarySymptoms([]);
    setPendingPrimarySymptoms([]);
    setSeverity(null);
    setSeverityLabel('');
    setDurationKey(null);
    setDurationDays(null);
    setDurationLabel('');
    setProgression(null);
    setProgressionLabel('');
    setShowProgression(false);
    setAdditionalSymptoms([]);
    setPendingGeneralAdditional([]);
    setPendingSpeciesAdditional([]);
    setOtherSymptomsText(''); // Reset typed symptoms
    setShowSummary(false);
    setIsTyping(false);
    setMessages([]);
  };

  const renderMessageBubble = (message) => {
    const isUser = message.from === 'user';
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} transition-all duration-200`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-[10px] text-[14px] leading-relaxed shadow-sm`}
          style={{
            fontFamily: 'Raleway',
            backgroundColor: isUser ? PRIMARY_COLOR : '#FFFFF2',
            color: isUser ? '#FFFFFF' : '#111827',
          }}
        >
          {message.text}
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => (
    <div className="flex justify-start mt-2">
      <div
        className="max-w-xs lg:max-w-md px-4 py-2 rounded-[10px] shadow-sm"
        style={{ fontFamily: 'Raleway', color: '#4B5563', backgroundColor: '#FFFFF2' }}
      >
        <p className="text-[14px] leading-relaxed animate-pulse">Typing...</p>
      </div>
    </div>
  );

  const renderStepControls = () => {
    // Dynamic mode: Show simplified single-step UI for exotic species (bypass all steps)
    if (isDynamicMode && !showSummary) {
      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-[10px] shadow-sm"
            style={{ fontFamily: 'Raleway', backgroundColor: '#FFFFF2' }}
          >
            <p className="text-[14px] font-semibold mb-3 text-[#34113F]">Describe symptoms</p>
            <textarea
              value={otherSymptomsText}
              onChange={(e) => setOtherSymptomsText(e.target.value)}
              placeholder="Please describe your pet's symptoms in detail..."
              className="w-full px-3 py-3 border border-[#D1D5DB] rounded-lg text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:border-transparent resize-none"
              rows="8"
              style={{ fontFamily: 'Raleway' }}
            />
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={handleSubmitAssessment}
                disabled={!otherSymptomsText.trim()}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-opacity shadow-md ${
                  otherSymptomsText.trim()
                    ? 'hover:opacity-90'
                    : 'opacity-40 cursor-not-allowed'
                }`}
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Submit Assessment
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (showSummary) {
      const symptomsList = buildSymptomsList();
      const symptomLabels = symptomsList.map((code) => formatSymptomLabel(code));
      const severityDisplay =
        SEVERITY_OPTIONS.find((opt) => opt.key === severity)?.label || 'Not specified';
      const durationDisplay = durationLabel || 'Not specified';

      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-[10px] shadow-sm"
            style={{ fontFamily: 'Raleway', backgroundColor: '#FFFFF2' }}
          >
            <p className="text-[14px] font-semibold mb-2 text-[#34113F]">Summary for this assessment</p>
            <div className="text-[13px] text-gray-800 space-y-1 mb-3">
              <p>
                <span className="font-semibold">Pet:</span> {petName} ({petSpecies})
              </p>
              <p>
                <span className="font-semibold">Main concern:</span> {selectedMainConcern || 'Not specified'}
              </p>
              <p>
                <span className="font-semibold">Symptoms:</span>{' '}
                {symptomLabels.length ? symptomLabels.join(', ') : 'None selected'}
              </p>
              <p>
                <span className="font-semibold">Severity:</span> {severityDisplay}
              </p>
              <p>
                <span className="font-semibold">Duration:</span> {durationDisplay}
              </p>
              <p>
                <span className="font-semibold">Progression:</span>{' '}
                {progression ? PROGRESSION_OPTIONS.find(opt => opt.key === progression)?.label || 'Not specified' : 'Not specified'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              <button
                type="button"
                onClick={handleSubmitAssessment}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white shadow-md"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Submit Assessment
              </button>
              <button
                type="button"
                onClick={handleStartOver}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#D1D5DB] text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-[10px] shadow-sm"
            style={{ fontFamily: 'Raleway', backgroundColor: '#FFFFF2' }}
          >
            <p className="text-[14px] font-semibold mb-3 text-[#34113F]">Which body system seems most affected?</p>
              <p className="text-[13px] text-gray-700 mb-3">(Select the primary concern)</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {MAIN_CONCERNS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectMainConcern(option.id)}
                  className={`px-3 py-2 rounded-[8px] text-[13px] font-semibold flex items-center gap-2 text-white hover:opacity-90 transition-opacity shadow-md`}
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <img 
                    src={option.icon} 
                    alt={option.label}
                    className="w-5 h-5 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(95%) sepia(18%) saturate(424%) hue-rotate(344deg) brightness(103%) contrast(93%)' }}
                  />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-[12px] text-gray-600 flex items-start gap-1.5">
                <img 
                  src="/f7_lightbulb-fill.png" 
                  alt="Tip" 
                  className="w-3 h-3 mt-0.5 object-contain" 
                />
                <span>
                  This assessment follows veterinary body system organization to ensure we gather the most relevant information for {petName}&apos;s symptoms.
                </span>
              </p>
              <p className="text-[11px] text-gray-500 italic mt-2">
                Body system organization follows the Veterinary Triage List (VTL) approach, adapted from the Manchester Triage Scale.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      const symptomCodes = PRIMARY_SYMPTOMS_BY_CONCERN[selectedMainConcern] || [];
      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-[10px] shadow-sm"
            style={{ fontFamily: 'Raleway', backgroundColor: '#FFFFF2' }}
          >
            <p className="text-[14px] mb-2 text-[#34113F] font-semibold">
              Which of these symptoms is {petName} experiencing? (Select all that apply)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {symptomCodes.map((code) => {
                const isSelected = pendingPrimarySymptoms.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleTogglePrimarySymptom(code)}
                    className={`flex items-center justify-between px-3 py-2 rounded-[8px] border text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                        : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span>{formatSymptomLabel(code)}</span>
                    <span className="ml-2 text-xs text-[#815FB3]">{isSelected ? '☑' : '☐'}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[12px] text-gray-700">
                Select at least one symptom to continue.
              </span>
              <button
                type="button"
                onClick={handleConfirmPrimarySymptoms}
                disabled={!pendingPrimarySymptoms.length}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-opacity shadow-md ${
                  pendingPrimarySymptoms.length
                    ? 'hover:opacity-90'
                    : 'opacity-40 cursor-not-allowed'
                }`}
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-[10px] shadow-sm"
            style={{ fontFamily: 'Raleway', backgroundColor: '#FFFFF2' }}
          >
            <p className="text-[14px] mb-2 text-[#34113F] font-semibold">Choose the main concern for this visit:</p>
            <div className="space-y-2 mb-3">
              {SEVERITY_OPTIONS.map((option) => {
                const isSelected = severity === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleSelectSeverity(option)}
                    className={`w-full text-left px-3 py-2 rounded-[8px] border text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                        : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={handleConfirmSeverity}
                disabled={!severity}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-opacity shadow-md ${
                  severity ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
                }`}
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 4) {
      // Show progression question after duration is answered
      if (showProgression) {
        return (
          <div className="flex justify-start mt-4">
            <div
              className="max-w-xl w-full px-4 py-3 rounded-[10px] shadow-sm"
              style={{ fontFamily: 'Raleway', backgroundColor: '#FFFFF2' }}
            >
              <p className="text-[14px] mb-2 text-[#34113F] font-semibold">
                How are {petName}&apos;s symptoms changing?
              </p>
              <div className="space-y-2 mb-3">
                {PROGRESSION_OPTIONS.map((option) => {
                  const isSelected = progression === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleSelectProgression(option)}
                      className={`w-full text-left px-3 py-2 rounded-[8px] border text-[13px] transition-colors ${
                        isSelected
                          ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                          : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-[12px] text-gray-700 flex items-start gap-1.5">
                  <img 
                    src="/f7_lightbulb-fill.png" 
                    alt="Tip" 
                    className="w-3 h-3 mt-0.5 object-contain" 
                  />
                  <span>
                    <strong>Helper:</strong> Understanding how symptoms are changing helps determine urgency and appropriate care.
                  </span>
                </p>
              </div>
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={handleConfirmProgression}
                  disabled={!progression}
                  className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-opacity shadow-md ${
                    progression ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
                  }`}
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  Continue
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-300">
                <p className="text-[11px] text-gray-500 italic">
                  Symptom progression is a standard veterinary triage assessment factor.
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Show duration question first
      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-[10px] shadow-sm"
            style={{ fontFamily: 'Raleway', backgroundColor: '#FFFFF2' }}
          >
            <p className="text-[14px] mb-2 text-[#34113F] font-semibold">
              How long has {petName} been experiencing these symptoms?
            </p>
            <div className="space-y-2 mb-3">
              {DURATION_OPTIONS.map((option) => {
                const isSelected = durationKey === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleSelectDuration(option)}
                    className={`w-full text-left px-3 py-2 rounded-[8px] border text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                        : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={handleConfirmDuration}
                disabled={!durationKey}
                className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white transition-opacity shadow-md ${
                  durationKey ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
                }`}
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 5) {
      const speciesCategory = getSpeciesCategory(petSpecies);
      const speciesOptions = speciesCategory ? SPECIES_SPECIFIC_SYMPTOMS[speciesCategory] || [] : [];

      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-[10px] shadow-sm"
            style={{ fontFamily: 'Raleway', backgroundColor: '#FFFFF2' }}
          >
            <p className="text-[14px] mb-2 text-[#34113F] font-semibold">
              Are there any other symptoms you&apos;ve noticed? (Optional)
            </p>

            <div className="mb-2 border border-[#D1D5DB] rounded-lg bg-white">
              <button
                type="button"
                className="w-full flex justify-between items-center px-3 py-2 text-[13px] font-semibold text-gray-800"
              >
                General symptoms
                <span className="text-xs text-gray-500">(tap options below)</span>
              </button>
              <div className="px-3 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GENERAL_ADDITIONAL_SYMPTOMS.map((symptom) => {
                  const isSelected = pendingGeneralAdditional.includes(symptom.code);
                  return (
                    <button
                      key={symptom.code}
                      type="button"
                      onClick={() => handleToggleGeneralAdditional(symptom.code)}
                      className={`flex items-center justify-between px-3 py-2 rounded-[8px] border text-[13px] transition-colors ${
                        isSelected
                          ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                          : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                      }`}
                    >
                      <span>{symptom.label}</span>
                      <span className="ml-2 text-xs text-[#815FB3]">{isSelected ? '☑' : '☐'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {speciesOptions.length > 0 && (
              <div className="mb-2 border border-[#D1D5DB] rounded-lg bg-white">
                <button
                  type="button"
                  className="w-full flex justify-between items-center px-3 py-2 text-[13px] font-semibold text-gray-800"
                >
                  {speciesCategory} specific symptoms
                  <span className="text-xs text-gray-500">(tap options below)</span>
                </button>
                <div className="px-3 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {speciesOptions.map((symptom) => {
                    const isSelected = pendingSpeciesAdditional.includes(symptom.code);
                    return (
                      <button
                        key={symptom.code}
                        type="button"
                        onClick={() => handleToggleSpeciesAdditional(symptom.code)}
                        className={`flex items-center justify-between px-3 py-2 rounded-[8px] border text-[13px] transition-colors ${
                          isSelected
                            ? 'bg-[#E4DEED] border-[#815FB3] text-[#34113F] shadow-sm font-medium'
                            : 'bg-white border-[#E5E7EB] text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span>{symptom.label}</span>
                        <span className="ml-2 text-xs text-[#815FB3]">{isSelected ? '☑' : '☐'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hybrid Triage: Other Symptoms Text Box */}
            <div className="mt-4 mb-3">
              <label className="block text-[13px] font-semibold text-[#34113F] mb-2">
                Any other symptoms not listed above?
              </label>
              <textarea
                value={otherSymptomsText}
                onChange={(e) => setOtherSymptomsText(e.target.value)}
                placeholder="e.g., nosebleed, fainting, unusual behavior..."
                className="w-full px-3 py-2 border border-[#D1D5DB] rounded-lg text-[13px] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:border-transparent resize-none"
                rows="3"
                style={{ fontFamily: 'Raleway' }}
              />
              <p className="text-[11px] text-gray-500 mt-1 flex items-start gap-1.5">
                <img 
                  src="/f7_lightbulb-fill.png" 
                  alt="Tip" 
                  className="w-3 h-3 mt-0.5 object-contain" 
                />
                <span>Type any symptoms not covered by the checkboxes above. This helps us provide a more accurate assessment.</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={handleSkipAdditional}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold border border-[#D1D5DB] text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleDoneAdditional}
                className="px-4 py-2 rounded-[10px] text-[13px] font-semibold text-white shadow-md"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Show emergency screening first
  if (showEmergencyScreening) {
    return (
      <EmergencyScreening
        selectedPet={selectedPet}
        onComplete={handleEmergencyScreeningComplete}
        onEmergencyDetected={handleEmergencyDetected}
      />
    );
  }

  // Show main questionnaire after emergency screening
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] text-gray-500" style={{ fontFamily: 'Raleway' }}>
          Conversational Symptom Questionnaire
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] text-gray-500 hover:text-gray-700 underline"
          style={{ fontFamily: 'Raleway' }}
        >
          Cancel
        </button>
      </div>

      <div
        ref={containerRef}
        className="max-h-[480px] overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400"
      >
        {messages.map((m) => renderMessageBubble(m))}
        {isTyping && renderTypingIndicator()}
        {renderStepControls()}
      </div>

      {/* Assessment Methodology Section */}
      <AssessmentMethodology />
    </div>
  );
};

ConversationalSymptomChecker.propTypes = {
  selectedPet: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    species: PropTypes.string.isRequired,
    breed: PropTypes.string,
    age: PropTypes.number,
  }).isRequired,
  onComplete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  sessionId: PropTypes.number, // Optional session ID for tracking stale callbacks
};

export default ConversationalSymptomChecker;
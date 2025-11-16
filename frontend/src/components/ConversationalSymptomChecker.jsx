import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const PRIMARY_COLOR = '#815FB3';
const ACCENT_COLOR = '#F4D06F';

const MAIN_CONCERNS = [
  { id: 'Digestive Issues', label: 'Digestive Issues', icon: '🔴' },
  { id: 'Respiratory Problems', label: 'Respiratory Problems', icon: '🫁' },
  { id: 'Skin & Coat Issues', label: 'Skin & Coat Issues', icon: '🐾' },
  { id: 'Behavioral Changes', label: 'Behavioral Changes', icon: '🧠' },
  { id: 'Movement Problems', label: 'Movement Problems', icon: '🦴' },
  { id: 'Eyes & Ears', label: 'Eyes & Ears', icon: '👁️' },
  { id: 'Urinary Issues', label: 'Urinary Issues', icon: '💧' },
  { id: 'Oral/Dental Problems', label: 'Oral/Dental Problems', icon: '🦷' },
  { id: 'Other', label: 'Other', icon: '❓' },
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

const ConversationalSymptomChecker = ({ selectedPet, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1-5
  const [selectedMainConcern, setSelectedMainConcern] = useState(null);
  const [primarySymptoms, setPrimarySymptoms] = useState([]);
  const [pendingPrimarySymptoms, setPendingPrimarySymptoms] = useState([]);
  const [severity, setSeverity] = useState(null); // mild | moderate | severe
  const [severityLabel, setSeverityLabel] = useState('');
  const [durationKey, setDurationKey] = useState(null);
  const [durationDays, setDurationDays] = useState(null);
  const [durationLabel, setDurationLabel] = useState('');
  const [additionalSymptoms, setAdditionalSymptoms] = useState([]);
  const [pendingGeneralAdditional, setPendingGeneralAdditional] = useState([]);
  const [pendingSpeciesAdditional, setPendingSpeciesAdditional] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const containerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const petName = selectedPet?.name || 'your pet';
  const petSpecies = selectedPet?.species || 'Pet';
  const petId = selectedPet?.id;

  useEffect(() => {
    // Initialize conversation when pet changes
    setCurrentStep(1);
    setSelectedMainConcern(null);
    setPrimarySymptoms([]);
    setPendingPrimarySymptoms([]);
    setSeverity(null);
    setSeverityLabel('');
    setDurationKey(null);
    setDurationDays(null);
    setDurationLabel('');
    setAdditionalSymptoms([]);
    setPendingGeneralAdditional([]);
    setPendingSpeciesAdditional([]);
    setShowSummary(false);
    setIsTyping(false);

    const introMessage = {
      id: 'intro',
      from: 'bot',
      text: `Hi! I see you want to check symptoms for ${petName} (${petSpecies}). What's your main concern?`,
    };
    setMessages([introMessage]);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPet?.name, selectedPet?.species]);

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

  const goToStepWithTyping = (nextStep, botText) => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
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
    setSelectedMainConcern(label);
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
      severity: severity || null,
    };

    if (onComplete) {
      onComplete(payload);
    }
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setSelectedMainConcern(null);
    setPrimarySymptoms([]);
    setPendingPrimarySymptoms([]);
    setSeverity(null);
    setSeverityLabel('');
    setDurationKey(null);
    setDurationDays(null);
    setDurationLabel('');
    setAdditionalSymptoms([]);
    setPendingGeneralAdditional([]);
    setPendingSpeciesAdditional([]);
    setShowSummary(false);
    setIsTyping(false);

    const introMessage = {
      id: `intro-${Date.now()}`,
      from: 'bot',
      text: `Hi! I see you want to check symptoms for ${petName} (${petSpecies}). What's your main concern?`,
    };
    setMessages([introMessage]);
  };

  const renderMessageBubble = (message) => {
    const isUser = message.from === 'user';
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} transition-all duration-200`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-[14px] leading-relaxed`}
          style={{
            fontFamily: 'Raleway',
            backgroundColor: isUser ? PRIMARY_COLOR : '#E4DEED',
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
        className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-[#E4DEED]"
        style={{ fontFamily: 'Raleway', color: '#4B5563' }}
      >
        <p className="text-[14px] leading-relaxed animate-pulse">Typing...</p>
      </div>
    </div>
  );

  const renderStepControls = () => {
    if (showSummary) {
      const symptomsList = buildSymptomsList();
      const symptomLabels = symptomsList.map((code) => formatSymptomLabel(code));
      const severityDisplay =
        SEVERITY_OPTIONS.find((opt) => opt.key === severity)?.label || 'Not specified';
      const durationDisplay = durationLabel || 'Not specified';

      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-lg bg-[#E4DEED] shadow-sm"
            style={{ fontFamily: 'Raleway' }}
          >
            <p className="text-[14px] font-semibold mb-2">Summary for this assessment</p>
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
            </div>

            <div className="flex flex-wrap gap-2 mt-1">
              <button
                type="button"
                onClick={handleSubmitAssessment}
                className="px-4 py-2 rounded-full text-[13px] font-semibold text-white"
                style={{ backgroundColor: PRIMARY_COLOR }}
              >
                Submit Assessment
              </button>
              <button
                type="button"
                onClick={handleStartOver}
                className="px-4 py-2 rounded-full text-[13px] font-semibold border border-[#D1D5DB] text-gray-700 bg-white hover:bg-gray-50"
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
            className="max-w-xl w-full px-4 py-3 rounded-lg bg-[#E4DEED]"
            style={{ fontFamily: 'Raleway' }}
          >
            <p className="text-[14px] mb-2">Choose the main concern for this visit:</p>
            <div className="flex flex-wrap gap-2">
              {MAIN_CONCERNS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectMainConcern(option.id)}
                  className="px-3 py-2 rounded-full text-[13px] font-semibold flex items-center gap-1 text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: PRIMARY_COLOR }}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              ))}
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
            className="max-w-xl w-full px-4 py-3 rounded-lg bg-[#E4DEED]"
            style={{ fontFamily: 'Raleway' }}
          >
            <p className="text-[14px] mb-2">
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
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-white border-transparent text-gray-900 shadow-sm'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-gray-800 hover:bg-white'
                    }`}
                  >
                    <span>{formatSymptomLabel(code)}</span>
                    <span className="ml-2 text-xs">{isSelected ? '☑' : '☐'}</span>
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
                className={`px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-opacity ${
                  pendingPrimarySymptoms.length ? 'hover:opacity-90' : 'opacity-40 cursor-not-allowed'
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
            className="max-w-xl w-full px-4 py-3 rounded-lg bg-[#E4DEED]"
            style={{ fontFamily: 'Raleway' }}
          >
            <p className="text-[14px] mb-2">How severe are these symptoms?</p>
            <div className="space-y-2 mb-3">
              {SEVERITY_OPTIONS.map((option) => {
                const isSelected = severity === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleSelectSeverity(option)}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-white border-transparent text-gray-900 shadow-sm'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-gray-800 hover:bg-white'
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
                className={`px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-opacity ${
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
      return (
        <div className="flex justify-start mt-4">
          <div
            className="max-w-xl w-full px-4 py-3 rounded-lg bg-[#E4DEED]"
            style={{ fontFamily: 'Raleway' }}
          >
            <p className="text-[14px] mb-2">
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
                    className={`w-full text-left px-3 py-2 rounded-lg border text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-white border-transparent text-gray-900 shadow-sm'
                        : 'bg-[#F9FAFB] border-[#E5E7EB] text-gray-800 hover:bg-white'
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
                className={`px-4 py-2 rounded-full text-[13px] font-semibold text-white transition-opacity ${
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
            className="max-w-xl w-full px-4 py-3 rounded-lg bg-[#E4DEED]"
            style={{ fontFamily: 'Raleway' }}
          >
            <p className="text-[14px] mb-2">
              Are there any other symptoms you've noticed? (Optional)
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
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[13px] transition-colors ${
                        isSelected
                          ? 'bg-[#FFF7E0] border-transparent text-gray-900 shadow-sm'
                          : 'bg-[#F9FAFB] border-[#E5E7EB] text-gray-800 hover:bg-white'
                      }`}
                    >
                      <span>{symptom.label}</span>
                      <span className="ml-2 text-xs">{isSelected ? '☑' : '☐'}</span>
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
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[13px] transition-colors ${
                          isSelected
                            ? 'bg-[#FFF7E0] border-transparent text-gray-900 shadow-sm'
                            : 'bg-[#F9FAFB] border-[#E5E7EB] text-gray-800 hover:bg-white'
                        }`}
                      >
                        <span>{symptom.label}</span>
                        <span className="ml-2 text-xs">{isSelected ? '☑' : '☐'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end mt-2">
              <button
                type="button"
                onClick={handleSkipAdditional}
                className="px-4 py-2 rounded-full text-[13px] font-semibold border border-[#D1D5DB] text-gray-700 bg-white hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleDoneAdditional}
                className="px-4 py-2 rounded-full text-[13px] font-semibold text-white"
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
};

export default ConversationalSymptomChecker;

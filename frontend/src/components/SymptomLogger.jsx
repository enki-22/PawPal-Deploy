import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './SymptomLogger.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/chatbot';
// EXACT 81 CANONICAL SYMPTOMS from train_model.py
// Organized by category to match the risk calculator
const SYMPTOM_CATEGORIES = {
  'General Symptoms': {
    icon: <img src="/basil_other-1-solid.png" alt="General" className="w-5 h-5 inline-block" />,
    symptoms: [
      'vomiting', 'diarrhea', 'lethargy', 'loss_of_appetite', 'weight_loss',
      'fever', 'dehydration', 'weakness', 'seizures'
    ]
  },
  'Respiratory': {
    icon: <img src="/mingcute_lungs-fill.png" alt="Respiratory" className="w-5 h-5 inline-block" />,
    symptoms: [
      'coughing', 'sneezing', 'wheezing', 'labored_breathing', 'difficulty_breathing',
      'nasal_discharge', 'nasal_congestion', 'respiratory_distress'
    ]
  },
  'Skin & Coat': {
    icon: <img src="/streamline-ultimate-color_hair-skin.png" alt="Skin & Coat" className="w-5 h-5 inline-block" />,
    symptoms: [
      'scratching', 'itching', 'hair_loss', 'bald_patches', 'red_skin',
      'irritated_skin', 'skin_lesions', 'rash', 'scabs', 'dandruff'
    ]
  },
  'Eyes & Ears': {
    icon: <img src="/icon-park-outline_eyes.png" alt="Eyes & Ears" className="w-5 h-5 inline-block" />,
    symptoms: [
      'watery_eyes', 'eye_discharge', 'red_eyes', 'squinting',
      'ear_discharge', 'ear_scratching', 'head_shaking'
    ]
  },
  'Digestive': {
    icon: <img src="/hugeicons_digestion.png" alt="Digestive" className="w-5 h-5 inline-block" />,
    symptoms: [
      'constipation', 'bloating', 'gas', 'not_eating', 'excessive_eating'
    ]
  },
  'Urinary': {
    icon: <img src="/entypo_water.png" alt="Urinary" className="w-5 h-5 inline-block" />,
    symptoms: [
      'blood_in_urine', 'frequent_urination', 'straining_to_urinate',
      'dark_urine', 'cloudy_urine'
    ]
  },
  'Oral & Dental': {
    icon: <img src="/streamline-sharp_tooth-remix.png" alt="Oral & Dental" className="w-5 h-5 inline-block" />,
    symptoms: [
      'bad_breath', 'drooling', 'difficulty_eating', 'swollen_gums',
      'red_gums', 'mouth_pain'
    ]
  },
  'Behavioral': {
    icon: <img src="/mdi_brain.png" alt="Behavioral" className="w-5 h-5 inline-block" />,
    symptoms: [
      'aggression', 'hiding', 'restlessness', 'confusion', 'circling'
    ]
  },
  'Mobility': {
    icon: <img src="/twemoji_paw-prints.png" alt="Mobility" className="w-5 h-5 inline-block" />,
    symptoms: [
      'limping', 'lameness', 'difficulty_walking', 'stiffness',
      'reluctance_to_move', 'paralysis'
    ]
  }
};

const SymptomLogger = ({ pet, onComplete, showToast }) => {
  const location = useLocation();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severityValues, setSeverityValues] = useState({}); // { symptom: 1-10 }
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severity, setSeverity] = useState('');

  // Pre-fill symptoms from location.state (when navigating from diagnosis)
  useEffect(() => {
    if (location.state?.prefillSymptoms && Array.isArray(location.state.prefillSymptoms)) {
      const prefillSymptoms = location.state.prefillSymptoms;
      
      // Normalize symptom names (handle both snake_case and spaces)
      const normalizedSymptoms = prefillSymptoms.map(symptom => {
        if (typeof symptom === 'string') {
          // Convert spaces to underscores for consistency
          return symptom.replace(/\s+/g, '_').toLowerCase();
        }
        return symptom;
      });
      
      // Filter to only include symptoms that exist in our categories
      const allAvailableSymptoms = Object.values(SYMPTOM_CATEGORIES).flat();
      const validSymptoms = normalizedSymptoms.filter(symptom => 
        allAvailableSymptoms.includes(symptom)
      );
      
      if (validSymptoms.length > 0) {
        setSelectedSymptoms(validSymptoms);
        // Set default severity (5) for all pre-filled symptoms
        const defaultSeverities = {};
        validSymptoms.forEach(symptom => {
          defaultSeverities[symptom] = 5;
        });
        setSeverityValues(defaultSeverities);
        
        // Show a toast if available
        if (showToast) {
          showToast(`Pre-filled ${validSymptoms.length} symptom(s) from diagnosis`, 'info');
        }
      }
    }
  }, [location.state, showToast]);

  // Format symptom name for display
  const formatSymptomName = (symptom) => {
    return symptom
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Toggle symptom selection
  const handleToggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
      // Remove severity value
      const newSeverity = { ...severityValues };
      delete newSeverity[symptom];
      setSeverityValues(newSeverity);
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
      // Set default severity to 5
      setSeverityValues({
        ...severityValues,
        [symptom]: 5
      });
    }
  };

  // Update severity for a symptom
  const handleSeverityChange = (symptom, value) => {
    setSeverityValues({
      ...severityValues,
      [symptom]: parseInt(value)
    });
  };

  // Get severity color class
  const getSeverityColor = (value) => {
    if (value <= 3) return 'severity-mild'; // Green
    if (value <= 7) return 'severity-moderate'; // Yellow
    return 'severity-severe'; // Red
  };

  // Filter symptoms by search term
  const filterSymptoms = (symptoms) => {
    if (!searchTerm) return symptoms;
    return symptoms.filter(symptom => 
      formatSymptomName(symptom).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedSymptoms.length === 0) {
      if (showToast) {
        showToast('Please select at least one symptom', 'error');
      } else {
        alert('⚠️ Please select at least one symptom');
      }
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/symptom-tracker/log-daily/`,
        {
          pet_id: pet.id,
          symptoms: selectedSymptoms,
          severity_map: severityValues,
          notes: notes
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 90000
        }
      );

      // Success - clear form and show toast
      setSelectedSymptoms([]);
      setSeverityValues({});
      setNotes('');
      setSearchTerm('');

      if (showToast) {
        showToast('Symptoms logged successfully! AI analysis complete.', 'success');
      }

      // Trigger refresh if callback provided
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error) {
      console.error('Error logging symptoms:', error);
      // Extract error message as string (handle both string and object errors)
      const errorData = error.response?.data?.error;
      const errorMessage = typeof errorData === 'string'
        ? errorData
        : (errorData?.message || errorData?.error || error.message || 'Failed to log symptoms. Please try again.');
      
      if (showToast) {
        showToast(errorMessage, 'error');
      } else {
        alert(`❌ ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get all symptoms as flat list for search
  const allSymptoms = Object.values(SYMPTOM_CATEGORIES).flat();

  return (
    <div className="symptom-logger bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <img src="/maki_doctor.png" alt="Doctor" className="w-6 h-6 inline-block" />
          Daily Symptom Log
        </h2>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{pet?.name}</span>
          <span className="mx-2">•</span>
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Selected Symptoms Summary */}
        {selectedSymptoms.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <strong className="text-blue-800">Selected Symptoms ({selectedSymptoms.length})</strong>
              <button
                type="button"
                onClick={() => {
                  setSelectedSymptoms([]);
                  setSeverityValues({});
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map(symptom => (
                <span
                  key={symptom}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                >
                  {formatSymptomName(symptom)}
                  <button
                    type="button"
                    onClick={() => handleToggleSymptom(symptom)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Symptom Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Select Symptoms</h3>
          <div className="space-y-4">
            {Object.entries(SYMPTOM_CATEGORIES).map(([category, { symptoms, icon }]) => {
              const filteredSymptoms = filterSymptoms(symptoms);
              if (searchTerm && filteredSymptoms.length === 0) return null;

              return (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    {icon}
                    <span>{category}</span>
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {filteredSymptoms.map(symptom => {
                      const isSelected = selectedSymptoms.includes(symptom);
                      return (
                        <label
                          key={symptom}
                          className={`flex items-center p-2 border rounded cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-100 border-blue-500'
                              : 'bg-white border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSymptom(symptom)}
                            className="mr-2"
                          />
                          <span className="text-sm">{formatSymptomName(symptom)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Severity Sliders */}
        {selectedSymptoms.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Severity (1-10 scale)</h3>
            <div className="space-y-4">
              {selectedSymptoms.map(symptom => {
                const severity = severityValues[symptom] || 5;
                const colorClass = getSeverityColor(severity);
                return (
                  <div key={symptom} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">
                        {formatSymptomName(symptom)}
                      </label>
                      <span className={`text-sm font-bold ${colorClass}`}>
                        {severity}/10
                        {severity <= 3 && ' (Mild)'}
                        {severity > 3 && severity <= 7 && ' (Moderate)'}
                        {severity > 7 && ' (Severe)'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={severity}
                      onChange={(e) => handleSeverityChange(symptom, e.target.value)}
                      className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${colorClass}`}
                      style={{
                        background: severity <= 3 
                          ? `linear-gradient(to right, #10b981 0%, #10b981 ${(severity/10)*100}%, #e5e7eb ${(severity/10)*100}%, #e5e7eb 100%)`
                          : severity <= 7
                          ? `linear-gradient(to right, #f59e0b 0%, #f59e0b ${(severity/10)*100}%, #e5e7eb ${(severity/10)*100}%, #e5e7eb 100%)`
                          : `linear-gradient(to right, #ef4444 0%, #ef4444 ${(severity/10)*100}%, #e5e7eb ${(severity/10)*100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Any other observations?
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes about your pet&apos;s condition..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
      </div>

      {/* Severity Selection */}
      <div className="severity-section">
        <h3 className="flex items-center gap-2">
          <img src="/picon_chart.png" alt="Chart" className="w-5 h-5 inline-block" />
          Overall Severity
        </h3>
        <p className="section-description">How severe are {pet.name}&apos;s symptoms overall?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { 
              value: 'mild', 
              label: 'Mild', 
              desc: 'Eating & acting mostly normal', 
              activeClass: 'border-green-300 bg-green-50',
              circleClass: 'bg-emerald-200'
            },
            { 
              value: 'moderate', 
              label: 'Moderate', 
              desc: 'Uncomfortable, behavior changes', 
              activeClass: 'border-yellow-300 bg-yellow-50',
              circleClass: 'bg-amber-200' 
            },
            { 
              value: 'severe', 
              label: 'Severe', 
              desc: 'Very unwell, major changes', 
              activeClass: 'border-red-300 bg-red-50',
              circleClass: 'bg-rose-300' 
            }
          ].map((option) => (
            <div
              key={option.value}
              onClick={() => setSeverity(option.value)}
              className={`
                cursor-pointer rounded-lg p-3 border transition-all duration-200
                ${severity === option.value ? option.activeClass : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-4 h-4 rounded-full ${option.circleClass} border border-black/5`}></div>
                <span className="font-bold text-gray-800 text-sm">{option.label}</span>
              </div>
              <p className="text-xs text-gray-600 leading-tight pl-6">{option.desc}</p>
              
              {/* Hidden radio for form logic compatibility */}
              <input
                type="radio"
                value={option.value}
                checked={severity === option.value}
                onChange={() => setSeverity(option.value)}
                className="hidden"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={selectedSymptoms.length === 0 || loading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              selectedSymptoms.length === 0 || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Analyzing with AI...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <img src="/material-symbols_save.png" alt="Save" className="w-5 h-5 inline-block" />
                Log Symptoms
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SymptomLogger;
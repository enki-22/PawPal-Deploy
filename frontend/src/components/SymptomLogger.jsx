import React, { useState } from 'react';
import axios from 'axios';
import './SymptomLogger.css';

// EXACT 81 CANONICAL SYMPTOMS from train_model.py
// Organized by category to match the risk calculator
const SYMPTOM_CATEGORIES = {
  'General Symptoms': {
    icon: '🩺',
    symptoms: [
      'vomiting', 'diarrhea', 'lethargy', 'loss_of_appetite', 'weight_loss',
      'fever', 'dehydration', 'weakness', 'seizures'
    ]
  },
  'Respiratory': {
    icon: '🫁',
    symptoms: [
      'coughing', 'sneezing', 'wheezing', 'labored_breathing', 'difficulty_breathing',
      'nasal_discharge', 'nasal_congestion', 'respiratory_distress'
    ]
  },
  'Skin & Coat': {
    icon: <img src="/mdi_paw.png" alt="Skin & Coat" className="w-5 h-5 inline-block" />,
    symptoms: [
      'scratching', 'itching', 'hair_loss', 'bald_patches', 'red_skin',
      'irritated_skin', 'skin_lesions', 'rash', 'scabs', 'dandruff'
    ]
  },
  'Eyes & Ears': {
    icon: '👁️',
    symptoms: [
      'watery_eyes', 'eye_discharge', 'red_eyes', 'squinting',
      'ear_discharge', 'ear_scratching', 'head_shaking'
    ]
  },
  'Digestive': {
    icon: '🍽️',
    symptoms: [
      'constipation', 'bloating', 'gas', 'not_eating', 'excessive_eating'
    ]
  },
  'Urinary': {
    icon: '💧',
    symptoms: [
      'blood_in_urine', 'frequent_urination', 'straining_to_urinate',
      'dark_urine', 'cloudy_urine'
    ]
  },
  'Oral & Dental': {
    icon: '🦷',
    symptoms: [
      'bad_breath', 'drooling', 'difficulty_eating', 'swollen_gums',
      'red_gums', 'mouth_pain'
    ]
  },
  'Behavioral': {
    icon: '🧠',
    symptoms: [
      'aggression', 'hiding', 'restlessness', 'confusion', 'circling'
    ]
  },
  'Mobility': {
    icon: '🦴',
    symptoms: [
      'limping', 'lameness', 'difficulty_walking', 'stiffness',
      'reluctance_to_move', 'paralysis'
    ]
  }
};

// Species-specific symptoms (shown only if relevant to pet type)
const SPECIES_SYMPTOMS = {
  'bird': {
    icon: '🦜',
    name: 'Bird-Specific',
    symptoms: ['drooping_wing', 'feather_loss', 'wing_droop', 'fluffed_feathers', 'tail_bobbing']
  },
  'fish': {
    icon: '🐠',
    name: 'Fish-Specific',
    symptoms: ['white_spots', 'fin_rot', 'swimming_upside_down', 'gasping_at_surface', 
                'clamped_fins', 'rubbing_against_objects', 'cloudy_eyes']
  },
  'rabbit': {
    icon: '🐰',
    name: 'Rabbit-Specific',
    symptoms: ['head_tilt', 'rolling', 'loss_of_balance', 'dental_issues']
  },
  'hamster': {
    icon: '🐹',
    name: 'Small Mammal',
    symptoms: ['wet_tail', 'lumps', 'bumps', 'overgrown_teeth']
  },
  'guinea pig': {
    icon: '🐹',
    name: 'Small Mammal',
    symptoms: ['wet_tail', 'lumps', 'bumps', 'overgrown_teeth']
  }
};

const SymptomLogger = ({ pet, onComplete }) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState('moderate');
  const [comparedToYesterday, setComparedToYesterday] = useState('');
  const [notes, setNotes] = useState('');
  const [symptomDetails, setSymptomDetails] = useState({});
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Get species-specific category
  const petType = pet?.animal_type?.toLowerCase() || '';
  const speciesCategory = SPECIES_SYMPTOMS[petType];

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggle symptom selection
  const handleToggleSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
      // Remove from symptom details if exists
      const newDetails = { ...symptomDetails };
      delete newDetails[symptom];
      setSymptomDetails(newDetails);
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  // Add detail for a symptom
  const addSymptomDetail = (symptom, detail) => {
    setSymptomDetails({
      ...symptomDetails,
      [symptom]: detail
    });
  };

  // Format symptom name for display
  const formatSymptomName = (symptom) => {
    return symptom
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Submit symptom log
  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      alert('⚠️ Please select at least one symptom');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/chatbot/symptom-tracker/log/', {
        pet_id: pet.id,
        symptom_date: new Date().toISOString().split('T')[0],
        symptoms: selectedSymptoms,
        overall_severity: severity,
        symptom_details: symptomDetails,
        compared_to_yesterday: comparedToYesterday || null,
        notes: notes
      }, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      setRiskAssessment(response.data.risk_assessment);
      setAlert(response.data.alert);
      
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error) {
      console.error('Error logging symptoms:', error);
      if (error.response?.data?.details) {
        const errorDetails = error.response.data.details;
        if (errorDetails.symptoms) {
          alert(`❌ ${errorDetails.symptoms.join(', ')}`);
        } else {
          alert('❌ Failed to log symptoms. Please check your input and try again.');
        }
      } else {
        alert('❌ Failed to log symptoms. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setRiskAssessment(null);
    setAlert(null);
    setSelectedSymptoms([]);
    setSymptomDetails({});
    setNotes('');
    setComparedToYesterday('');
    setSeverity('moderate');
  };

  // Filter symptoms by search term
  const filterSymptoms = (symptoms) => {
    if (!searchTerm) return symptoms;
    return symptoms.filter(symptom => 
      formatSymptomName(symptom).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Get risk level styling
  const getRiskLevelClass = (level) => {
    switch(level?.toLowerCase()) {
      case 'critical': return 'risk-critical';
      case 'high': return 'risk-high';
      case 'moderate': return 'risk-moderate';
      case 'low': return 'risk-low';
      default: return 'risk-unknown';
    }
  };

  const getRiskLevelIcon = (level) => {
    switch(level?.toLowerCase()) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'moderate': return '📋';
      case 'low': return '👁️';
      default: return '❓';
    }
  };

  // Render risk assessment results
  if (riskAssessment) {
    return (
      <div className="symptom-logger">
        <div className="results-container">
          <div className="results-header">
            <h2>✅ Symptoms Logged Successfully</h2>
            <p className="results-subtitle">
              Logged for {pet.name} on {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Alert Banner */}
          {alert && (
            <div className="alert-banner">
              <div className="alert-icon">{alert.alert_type_display.split(' ')[0]}</div>
              <div className="alert-content">
                <strong>{alert.alert_type_display}</strong>
                <p>{alert.alert_message}</p>
              </div>
            </div>
          )}

          {/* Risk Level Card */}
          <div className={`risk-level-card ${getRiskLevelClass(riskAssessment.level)}`}>
            <div className="risk-badge">
              <span className="risk-icon">{getRiskLevelIcon(riskAssessment.level)}</span>
              <div className="risk-info">
                <span className="risk-label">Risk Level</span>
                <span className="risk-value">{riskAssessment.level.toUpperCase()}</span>
              </div>
            </div>
            <div className="risk-score">
              <div className="score-number">{riskAssessment.score}</div>
              <div className="score-label">/ 100</div>
            </div>
          </div>

          {/* Recommendation Box */}
          <div className="recommendation-box">
            <h3>📋 Veterinary Recommendation</h3>
            <p className="recommendation-text">{riskAssessment.recommendation}</p>
          </div>

          {/* Risk Factors */}
          {riskAssessment.risk_factors && riskAssessment.risk_factors.length > 0 && (
            <div className="risk-factors-section">
              <h3>🔍 Contributing Factors</h3>
              <ul className="risk-factors-list">
                {riskAssessment.risk_factors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary Stats */}
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-value">{riskAssessment.symptoms_evaluated}</div>
              <div className="stat-label">Symptoms Evaluated</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{riskAssessment.total_symptoms_reported}</div>
              <div className="stat-label">Total Reported</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button onClick={resetForm} className="btn btn-secondary">
              <span>➕</span> Log Another Entry
            </button>
            <button 
              onClick={() => window.location.href = `/pets/${pet.id}/symptom-timeline`}
              className="btn btn-primary"
            >
              <span>📊</span> View Timeline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render symptom logging form
  return (
    <div className="symptom-logger">
      <div className="logger-header">
        <h2>🩺 Daily Symptom Log</h2>
        <div className="pet-info">
          <strong>{pet.name}</strong>
          <span className="separator">•</span>
          <span>{pet.animal_type}</span>
          <span className="separator">•</span>
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search symptoms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm('')}>
            ✕
          </button>
        )}
      </div>

      {/* Selected Symptoms Summary */}
      {selectedSymptoms.length > 0 && (
        <div className="selected-summary">
          <div className="summary-header">
            <strong>Selected Symptoms ({selectedSymptoms.length})</strong>
            <button 
              className="clear-all-btn"
              onClick={() => {
                setSelectedSymptoms([]);
                setSymptomDetails({});
              }}
            >
              Clear All
            </button>
          </div>
          <div className="selected-chips">
            {selectedSymptoms.map(symptom => (
              <span key={symptom} className="symptom-chip">
                {formatSymptomName(symptom)}
                <button onClick={() => handleToggleSymptom(symptom)}>✕</button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Symptom Categories */}
      <div className="categories-container">
        {Object.entries(SYMPTOM_CATEGORIES).map(([category, data]) => {
          const filteredSymptoms = filterSymptoms(data.symptoms);
          if (searchTerm && filteredSymptoms.length === 0) return null;

          const isExpanded = expandedCategories[category] !== false; // Default to expanded

          return (
            <div key={category} className="category-section">
              <button
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <div className="category-title">
                  <span className="category-icon">{data.icon}</span>
                  <span className="category-name">{category}</span>
                  <span className="category-count">
                    {filteredSymptoms.filter(s => selectedSymptoms.includes(s)).length}/{filteredSymptoms.length}
                  </span>
                </div>
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
              </button>

              {isExpanded && (
                <div className="symptoms-grid">
                  {filteredSymptoms.map(symptom => {
                    const isSelected = selectedSymptoms.includes(symptom);
                    return (
                      <div key={symptom} className="symptom-item">
                        <label className={`symptom-checkbox ${isSelected ? 'checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSymptom(symptom)}
                          />
                          <span className="checkmark">✓</span>
                          <span className="symptom-label">{formatSymptomName(symptom)}</span>
                        </label>
                        {isSelected && (
                          <input
                            type="text"
                            className="symptom-detail-input"
                            placeholder="Add details (optional)..."
                            value={symptomDetails[symptom] || ''}
                            onChange={(e) => addSymptomDetail(symptom, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Species-Specific Symptoms */}
        {speciesCategory && (
          <div className="category-section species-specific">
            <button
              className="category-header"
              onClick={() => toggleCategory('species')}
            >
              <div className="category-title">
                <span className="category-icon">{speciesCategory.icon}</span>
                <span className="category-name">{speciesCategory.name}</span>
                <span className="category-count">
                  {speciesCategory.symptoms.filter(s => selectedSymptoms.includes(s)).length}/{speciesCategory.symptoms.length}
                </span>
              </div>
              <span className={`expand-icon ${expandedCategories['species'] !== false ? 'expanded' : ''}`}>▼</span>
            </button>

            {expandedCategories['species'] !== false && (
              <div className="symptoms-grid">
                {speciesCategory.symptoms.map(symptom => {
                  const isSelected = selectedSymptoms.includes(symptom);
                  return (
                    <div key={symptom} className="symptom-item">
                      <label className={`symptom-checkbox ${isSelected ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSymptom(symptom)}
                        />
                        <span className="checkmark">✓</span>
                        <span className="symptom-label">{formatSymptomName(symptom)}</span>
                      </label>
                      {isSelected && (
                        <input
                          type="text"
                          className="symptom-detail-input"
                          placeholder="Add details (optional)..."
                          value={symptomDetails[symptom] || ''}
                          onChange={(e) => addSymptomDetail(symptom, e.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Severity Selection */}
      <div className="severity-section">
        <h3>📊 Overall Severity</h3>
        <p className="section-description">How severe are {pet.name}&apos;s symptoms overall?</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'mild', label: 'Mild', icon: '🟢', desc: 'Eating & acting mostly normal', color: 'border-green-400 bg-green-50' },
            { value: 'moderate', label: 'Moderate', icon: '🟡', desc: 'Uncomfortable, behavior changes', color: 'border-yellow-400 bg-yellow-50' },
            { value: 'severe', label: 'Severe', icon: '🔴', desc: 'Very unwell, major changes', color: 'border-red-400 bg-red-50' }
          ].map((option) => (
            <div
              key={option.value}
              onClick={() => setSeverity(option.value)}
              className={`
                cursor-pointer rounded-xl p-4 border-2 transition-all duration-200
                ${severity === option.value ? option.color : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{option.icon}</span>
                <span className="font-bold text-gray-800">{option.label}</span>
              </div>
              <p className="text-xs text-gray-600 leading-tight">{option.desc}</p>
              
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

      {/* Comparison to Yesterday */}
      <div className="comparison-section">
        <h3>📈 Progression</h3>
        <p className="section-description">How do today&apos;s symptoms compare to yesterday?</p>
        <select
          value={comparedToYesterday}
          onChange={(e) => setComparedToYesterday(e.target.value)}
          className="comparison-select"
        >
          <option value="">Select comparison...</option>
          <option value="worse">📈 Getting Worse</option>
          <option value="same">➡️ About the Same</option>
          <option value="better">📉 Getting Better</option>
          <option value="new">🆕 First Occurrence</option>
        </select>
      </div>

      {/* Additional Notes */}
      <div className="notes-section">
        <h3>📝 Additional Notes (Optional)</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={`Any other observations about ${pet.name}'s symptoms, behavior, eating, drinking, or activities...`}
          rows={4}
          className="notes-textarea"
        />
      </div>

      {/* Submit Button */}
      <div className="submit-section">
        <button
          onClick={handleSubmit}
          disabled={selectedSymptoms.length === 0 || loading}
          className="btn btn-submit"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Calculating Risk Score...
            </>
          ) : (
            <>
              <span>🧮</span>
              Log Symptoms & Calculate Risk
            </>
          )}
        </button>
        {selectedSymptoms.length === 0 && (
          <p className="submit-hint">Please select at least one symptom to continue</p>
        )}
      </div>
    </div>
  );
};

export default SymptomLogger;

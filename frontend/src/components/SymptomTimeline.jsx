import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './SymptomTimeline.css';
import SymptomLogger from './SymptomLogger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/chatbot';

const SymptomTimeline = ({ petId: propPetId, pet: propPet }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPetId, setSelectedPetId] = useState(propPetId || null);
  const [selectedPet, setSelectedPet] = useState(propPet || null);
  const [pets, setPets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [latestTrend, setLatestTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogger, setShowLogger] = useState(false);
  
  // Check if we should show logger immediately (from diagnosis navigation)
  useEffect(() => {
    if (location.state?.prefillSymptoms && location.state?.fromDiagnosis) {
      // Wait for pet to be loaded before showing logger
      if (selectedPet) {
        setShowLogger(true);
      }
    }
  }, [location.state, selectedPet]);

  // Fetch user's pets
  useEffect(() => {
    fetchUserPets();
  }, []);

  // Load data when pet is selected
  useEffect(() => {
    if (selectedPetId) {
      loadData();
    }
  }, [selectedPetId]);

  const fetchUserPets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/get-user-pets/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success && response.data.pets) {
        setPets(response.data.pets);
        // Auto-select first pet if no petId provided
        if (!selectedPetId && response.data.pets.length > 0) {
          const firstPet = response.data.pets[0];
          setSelectedPetId(firstPet.id);
          setSelectedPet(firstPet);
        } else if (selectedPetId) {
          // Find and set the selected pet
          const pet = response.data.pets.find(p => p.id === selectedPetId);
          if (pet) {
            setSelectedPet(pet);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching pets:', err);
    }
  };

  const loadData = async () => {
    if (!selectedPetId) return;
    
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/symptom-tracker/health-timeline/?pet_id=${selectedPetId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setLogs(response.data.logs || []);
      setLatestTrend(response.data.latest_trend || null);
    } catch (err) {
      console.error('Error loading timeline:', err);
      // Extract error message as string (handle both string and object errors)
      const errorData = err.response?.data?.error;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (errorData?.message || errorData?.error || err.message || 'Failed to load health timeline');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePetSelect = (petId) => {
    const pet = pets.find(p => p.id === petId);
    setSelectedPetId(petId);
    setSelectedPet(pet);
    setShowLogger(false);
  };

  const handleLogComplete = () => {
    setShowLogger(false);
    loadData(); // Refresh timeline
  };

  const handleRunNewAssessment = () => {
    // Navigate to chat with symptom checker mode and context
    navigate('/chat/new', {
      state: {
        mode: 'symptom_checker',
        reason: 'worsening_trend',
        history_summary: latestTrend?.trend_analysis || '',
        petId: selectedPetId,
        petName: selectedPet?.name || 'Your Pet'
      }
    });
  };

  // Get risk score color
  const getRiskColor = (score) => {
    if (score >= 70) return '#ef4444'; // Red - Critical
    if (score >= 50) return '#f59e0b'; // Orange - High
    if (score >= 30) return '#eab308'; // Yellow - Moderate
    return '#10b981'; // Green - Low
  };

  // Get urgency badge color
  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format symptom name
  const formatSymptomName = (symptom) => {
    return symptom
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Prepare chart data - show max severity per day
  const chartData = logs.map(log => {
    const severityScores = log.severity_scores || {};
    const maxSeverity = Object.values(severityScores).length > 0
      ? Math.max(...Object.values(severityScores))
      : 5; // Default to 5 if no scores
    
    // Get top 2 symptoms by severity
    const sortedSymptoms = Object.entries(severityScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);
    
    const dataPoint = {
      date: new Date(log.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: log.log_date,
      maxSeverity: maxSeverity,
      symptoms: log.symptoms || []
    };
    
    // Add top 2 symptoms as separate lines
    sortedSymptoms.forEach(([symptom, severity], index) => {
      dataPoint[`symptom_${index + 1}`] = severity;
      dataPoint[`symptom_${index + 1}_name`] = formatSymptomName(symptom);
    });
    
    return dataPoint;
  });

  if (loading) {
    return (
      <div className="symptom-timeline flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading health timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Ensure error is a string for rendering
    const errorText = typeof error === 'string' ? error : (error?.message || error?.toString() || 'An unknown error occurred');
    return (
      <div className="symptom-timeline p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">⚠️ Error Loading Timeline</h3>
          <p className="text-red-600 mb-4">{errorText}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show logger if requested
  if (showLogger && selectedPet) {
    return (
      <div className="symptom-timeline p-6">
        {location.state?.fromDiagnosis && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Pre-filled from diagnosis:</strong> Symptoms from your recent assessment have been pre-selected. 
              Adjust severity and add any additional observations.
            </p>
          </div>
        )}
        <div className="mb-4">
          <button
            onClick={() => setShowLogger(false)}
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Back to Timeline
          </button>
        </div>
        <SymptomLogger 
          pet={selectedPet} 
          onComplete={handleLogComplete}
        />
      </div>
    );
  }

  // Pet selection screen
  if (!selectedPetId && pets.length > 0) {
    return (
      <div className="symptom-timeline p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Select a Pet</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => handlePetSelect(pet.id)}
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow text-left"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{pet.name}</h3>
                <p className="text-gray-600">{pet.animal_type}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="symptom-timeline p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Symptom Logs Yet</h3>
          <p className="text-gray-600 mb-6">
            Start tracking {selectedPet?.name || 'your pet'}&apos;s symptoms to see progression over time.
          </p>
          <button
            onClick={() => setShowLogger(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            <span>➕</span> Log Symptoms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="symptom-timeline p-6 bg-gray-50 min-h-screen">
      {/* Worsening Alert Banner - Prominent at Top */}
      {latestTrend && latestTrend.alert_needed && (
        <div className="mb-6 bg-red-600 text-white rounded-lg shadow-lg p-6 border-l-4 border-red-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-3xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Worsening Trend Detected</h3>
                <p className="text-red-50 mb-4">
                  Our AI analysis indicates your pet&apos;s symptoms are showing a concerning trend. 
                  We recommend running a new AI Assessment to get updated insights.
                </p>
                <button
                  onClick={handleRunNewAssessment}
                  className="px-6 py-3 bg-white text-red-600 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-md"
                >
                  🔍 Run New Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">📊 Health Timeline</h2>
          {selectedPet && (
            <div className="text-gray-600">
              <span className="font-semibold">{selectedPet.name}</span>
              <span className="mx-2">•</span>
              <span>{selectedPet.animal_type}</span>
            </div>
          )}
        </div>
        {pets.length > 1 && (
          <select
            value={selectedPetId}
            onChange={(e) => handlePetSelect(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {pets.map(pet => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* AI Insight Header */}
      {latestTrend && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Risk Score Badge */}
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                style={{ backgroundColor: getRiskColor(latestTrend.risk_score) }}
              >
                {latestTrend.risk_score}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-1">AI Health Analysis</h3>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(latestTrend.analysis_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full border font-semibold ${getUrgencyColor(latestTrend.urgency_level)}`}>
              {latestTrend.urgency_level}
            </span>
          </div>

          {/* Alert Indicator (Smaller, since we have prominent banner above) */}
          {latestTrend.alert_needed && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚨</span>
                <div>
                  <strong className="text-red-800">Alert Status Active</strong>
                  <p className="text-red-700 text-sm mt-1">
                    See the alert banner above for recommended action.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trend Analysis */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Trend Analysis</h4>
            <p className="text-gray-600">{latestTrend.trend_analysis}</p>
          </div>

          {/* Prediction */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">24-Hour Forecast</h4>
            <p className="text-gray-600">{latestTrend.prediction}</p>
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {chartData.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📈 Severity Over Time</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                label={{ value: 'Severity (1-10)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-gray-800 mb-2">{data.fullDate}</p>
                        <p className="text-sm text-gray-600 mb-1">
                          Max Severity: <strong>{data.maxSeverity}/10</strong>
                        </p>
                        {data.symptoms && data.symptoms.length > 0 && (
                          <p className="text-sm text-gray-600">
                            Symptoms: {data.symptoms.map(s => formatSymptomName(s)).join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="maxSeverity"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Max Severity"
                dot={{ r: 4 }}
              />
              {chartData[0]?.symptom_1 && (
                <Line
                  type="monotone"
                  dataKey="symptom_1"
                  stroke="#10b981"
                  strokeWidth={2}
                  name={chartData[0]?.symptom_1_name || 'Top Symptom 1'}
                  dot={{ r: 3 }}
                />
              )}
              {chartData[0]?.symptom_2 && (
                <Line
                  type="monotone"
                  dataKey="symptom_2"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name={chartData[0]?.symptom_2_name || 'Top Symptom 2'}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">📋 Log History</h3>
        <div className="space-y-4">
          {logs.map((log, index) => (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {new Date(log.log_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Symptoms */}
              {log.symptoms && log.symptoms.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Symptoms: </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {log.symptoms.map((symptom, idx) => {
                      const severity = log.severity_scores?.[symptom] || 5;
                      return (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {formatSymptomName(symptom)}
                          {log.severity_scores && (
                            <span className="ml-1 font-semibold">({severity}/10)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {log.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes: </span>
                    {log.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setShowLogger(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          <span>➕</span> Log New Symptoms
        </button>
      </div>
    </div>
  );
};

export default SymptomTimeline;

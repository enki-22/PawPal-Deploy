import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import './SymptomTimeline.css';

const SymptomTimeline = ({ petId, pet }) => {
  const [timeline, setTimeline] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [progression, setProgression] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(30);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (petId) {
      loadData();
    }
  }, [petId, dateRange]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      };

      const [timelineRes, alertsRes, progressionRes] = await Promise.all([
        axios.get(`/api/chatbot/symptom-tracker/timeline/?pet_id=${petId}&days=${dateRange}`, { headers }),
        axios.get(`/api/chatbot/symptom-tracker/alerts/?pet_id=${petId}&acknowledged=false`, { headers }),
        axios.get(`/api/chatbot/symptom-tracker/progression/?pet_id=${petId}`, { headers })
      ]);

      setTimeline(timelineRes.data.timeline || []);
      setSummary(timelineRes.data.summary || null);
      setAlerts(alertsRes.data.alerts || []);
      setProgression(progressionRes.data || null);
    } catch (err) {
      console.error('Error loading timeline:', err);
      setError(err.response?.data?.error || 'Failed to load symptom timeline');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/chatbot/symptom-tracker/${alertId}/acknowledge-alert/`,
        {},
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Remove from alerts list
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      alert('Failed to acknowledge alert');
    }
  };

  const acknowledgeAllAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/chatbot/symptom-tracker/acknowledge-all-alerts/',
        { pet_id: petId },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setAlerts([]);
    } catch (err) {
      console.error('Error acknowledging alerts:', err);
      alert('Failed to acknowledge alerts');
    }
  };

  // Prepare chart data
  const chartData = timeline.map(log => ({
    date: new Date(log.symptom_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: log.symptom_date,
    risk_score: log.risk_score,
    risk_level: log.risk_level,
    symptoms: log.symptoms,
    severity: log.overall_severity
  }));

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date"><strong>{data.fullDate}</strong></p>
          <p className="tooltip-risk">
            Risk Score: <strong>{data.risk_score}</strong>
          </p>
          <p className="tooltip-level">
            Level: <span className={`risk-badge ${data.risk_level}`}>
              {data.risk_level.toUpperCase()}
            </span>
          </p>
          <p className="tooltip-severity">
            Severity: {data.severity}
          </p>
          <p className="tooltip-symptoms">
            {data.symptoms.length} symptom(s)
          </p>
        </div>
      );
    }
    return null;
  };

  // Get risk level color
  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'moderate': return '#f1c40f';
      case 'low': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'improving': return '📉';
      case 'worsening': return '📈';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  // Format symptom name
  const formatSymptomName = (symptom) => {
    return symptom
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="symptom-timeline">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading symptom timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="symptom-timeline">
        <div className="error-container">
          <h3>⚠️ Error Loading Timeline</h3>
          <p>{error}</p>
          <button onClick={loadData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="symptom-timeline">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Symptom Logs Yet</h3>
          <p>Start tracking {pet?.name || 'your pet'}'s symptoms to see progression over time.</p>
          <button
            onClick={() => window.location.href = `/pets/${petId}/log-symptoms`}
            className="btn btn-primary"
          >
            <span>➕</span> Log Symptoms
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="symptom-timeline">
      {/* Header */}
      <div className="timeline-header">
        <div className="header-content">
          <h2>📊 Symptom Timeline</h2>
          {pet && (
            <div className="pet-info">
              <strong>{pet.name}</strong>
              <span className="separator">•</span>
              <span>{pet.animal_type}</span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="date-range-select"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={loadData} className="btn btn-secondary btn-icon">
            🔄
          </button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <div className="alerts-header">
            <h3>⚠️ Active Alerts ({alerts.length})</h3>
            {alerts.length > 1 && (
              <button
                onClick={acknowledgeAllAlerts}
                className="btn btn-text"
              >
                Acknowledge All
              </button>
            )}
          </div>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card alert-${alert.alert_type}`}>
                <div className="alert-icon">
                  {alert.alert_type_display.split(' ')[0]}
                </div>
                <div className="alert-content">
                  <div className="alert-title">{alert.alert_type_display}</div>
                  <div className="alert-message">{alert.alert_message}</div>
                  <div className="alert-meta">
                    <span>{alert.time_since_created}</span>
                    <span className="separator">•</span>
                    <span>{alert.symptom_date}</span>
                  </div>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="btn btn-text btn-small"
                >
                  Acknowledge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="summary-cards">
          <div className="stat-card">
            <div className="stat-label">Total Logs</div>
            <div className="stat-value">{summary.total_logs}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Current Risk</div>
            <div className={`stat-value risk-${summary.current_risk_level}`}>
              {summary.current_risk_score}
            </div>
            <div className="stat-sublabel">{summary.current_risk_level}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Risk</div>
            <div className="stat-value">{summary.average_risk_score?.toFixed(1)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Highest Risk</div>
            <div className="stat-value">{summary.highest_risk_score}</div>
          </div>
        </div>
      )}

      {/* Progression Analysis */}
      {progression && (
        <div className="progression-section">
          <h3>📈 Progression Analysis</h3>
          <div className="progression-card">
            <div className="progression-main">
              <div className="trend-indicator">
                <span className="trend-icon">{getTrendIcon(progression.trend)}</span>
                <div className="trend-info">
                  <div className="trend-label">Trend</div>
                  <div className={`trend-value trend-${progression.trend}`}>
                    {progression.trend.toUpperCase()}
                  </div>
                  <div className="trend-description">{progression.analysis.trend_description}</div>
                </div>
              </div>
              <div className="progression-stats">
                <div className="prog-stat">
                  <span className="prog-label">Latest Risk</span>
                  <span className={`prog-value risk-${progression.analysis.latest_risk_level}`}>
                    {progression.analysis.latest_risk_score}
                  </span>
                </div>
                <div className="prog-stat">
                  <span className="prog-label">Average</span>
                  <span className="prog-value">
                    {progression.analysis.average_risk_score}
                  </span>
                </div>
                <div className="prog-stat">
                  <span className="prog-label">Range</span>
                  <span className="prog-value">
                    {progression.analysis.lowest_risk_score} - {progression.analysis.highest_risk_score}
                  </span>
                </div>
              </div>
            </div>

            {/* Recurring Symptoms */}
            {progression.recurring_symptoms && progression.recurring_symptoms.length > 0 && (
              <div className="recurring-symptoms">
                <h4>Most Common Symptoms</h4>
                <div className="symptom-tags">
                  {progression.recurring_symptoms.slice(0, 8).map((item, index) => (
                    <span key={index} className="symptom-tag">
                      {formatSymptomName(item.symptom)}
                      <span className="symptom-count">×{item.frequency}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Distribution */}
            {progression.risk_level_distribution && (
              <div className="risk-distribution">
                <h4>Risk Level Distribution</h4>
                <div className="distribution-bars">
                  {Object.entries(progression.risk_level_distribution).map(([level, count]) => (
                    <div key={level} className="distribution-item">
                      <span className="distribution-label">{level}</span>
                      <div className="distribution-bar">
                        <div
                          className={`distribution-fill risk-${level}`}
                          style={{
                            width: `${(count / progression.analysis.days_analyzed) * 100}%`
                          }}
                        />
                      </div>
                      <span className="distribution-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Score Chart */}
      <div className="chart-section">
        <h3>📈 Risk Score Over Time</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3498db" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3498db" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                stroke="#7f8c8d"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                stroke="#7f8c8d"
                label={{ value: 'Risk Score', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#e74c3c" strokeDasharray="3 3" label="Critical" />
              <ReferenceLine y={50} stroke="#f39c12" strokeDasharray="3 3" label="High" />
              <ReferenceLine y={30} stroke="#f1c40f" strokeDasharray="3 3" label="Moderate" />
              <Area
                type="monotone"
                dataKey="risk_score"
                stroke="#3498db"
                strokeWidth={3}
                fill="url(#colorRisk)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#e74c3c' }}></span>
            <span>Critical (70-100)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#f39c12' }}></span>
            <span>High (50-69)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#f1c40f' }}></span>
            <span>Moderate (30-49)</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#2ecc71' }}></span>
            <span>Low (0-29)</span>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="timeline-list-section">
        <h3>📋 Detailed Log History</h3>
        <div className="timeline-list">
          {timeline.slice().reverse().map((log, index) => (
            <div
              key={log.id}
              className={`timeline-entry ${selectedLog === log.id ? 'selected' : ''}`}
              onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
            >
              <div className="entry-marker">
                <div className={`marker-dot risk-${log.risk_level}`}></div>
                {index < timeline.length - 1 && <div className="marker-line"></div>}
              </div>

              <div className="entry-content">
                <div className="entry-header">
                  <div className="entry-date">
                    <strong>{new Date(log.symptom_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</strong>
                    <span className="days-ago">{log.days_since_logged} days ago</span>
                  </div>
                  <div className={`risk-badge risk-${log.risk_level}`}>
                    {log.risk_level_display}
                  </div>
                </div>

                <div className="entry-body">
                  <div className="entry-row">
                    <span className="entry-label">Symptoms ({log.symptom_count}):</span>
                    <div className="symptom-chips">
                      {log.symptoms.map((symptom, idx) => (
                        <span key={idx} className="symptom-chip-small">
                          {formatSymptomName(symptom)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="entry-row">
                    <span className="entry-label">Severity:</span>
                    <span className={`severity-badge severity-${log.overall_severity}`}>
                      {log.overall_severity}
                    </span>
                  </div>

                  {log.compared_to_yesterday && (
                    <div className="entry-row">
                      <span className="entry-label">Compared to Yesterday:</span>
                      <span className={`comparison-badge comparison-${log.compared_to_yesterday}`}>
                        {log.compared_to_yesterday === 'worse' && '📈 Getting Worse'}
                        {log.compared_to_yesterday === 'better' && '📉 Getting Better'}
                        {log.compared_to_yesterday === 'same' && '➡️ About the Same'}
                        {log.compared_to_yesterday === 'new' && '🆕 First Occurrence'}
                      </span>
                    </div>
                  )}

                  <div className="entry-row">
                    <span className="entry-label">Risk Score:</span>
                    <div className="risk-score-bar">
                      <div
                        className={`risk-score-fill risk-${log.risk_level}`}
                        style={{ width: `${log.risk_score}%` }}
                      >
                        <span className="risk-score-text">{log.risk_score}/100</span>
                      </div>
                    </div>
                  </div>

                  {log.notes && selectedLog === log.id && (
                    <div className="entry-notes">
                      <span className="entry-label">Notes:</span>
                      <p>{log.notes}</p>
                    </div>
                  )}
                </div>

                {log.notes && (
                  <div className="entry-footer">
                    <button className="btn-expand">
                      {selectedLog === log.id ? 'Hide Details ▲' : 'Show Details ▼'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="timeline-actions">
        <button
          onClick={() => window.location.href = `/pets/${petId}/log-symptoms`}
          className="btn btn-primary"
        >
          <span>➕</span> Log New Symptoms
        </button>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
        >
          <span>🖨️</span> Print Timeline
        </button>
      </div>
    </div>
  );
};

export default SymptomTimeline;

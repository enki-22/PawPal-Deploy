import React from 'react';
import PropTypes from 'prop-types';

/**
 * EmergencyOverlay - Full-screen modal for critical pet health emergencies
 * Displays when risk_assessment.level === 'critical' or alert_type === 'risk_escalation'
 */
const EmergencyOverlay = ({ alertMessage, onDismiss, onReassess }) => {
  const handleFindVet = () => {
    window.open('https://www.google.com/maps/search/?api=1&query=Southvalley+Clinic+A.+Gomez+National+Highway+Balibago+Sta.+Rosa+Laguna', '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ 
        zIndex: 9999,
        backgroundColor: 'rgba(127, 29, 29, 0.95)',
        backdropFilter: 'blur(4px)'
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
      aria-describedby="emergency-description"
    >
      {/* Pulsing background effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, #dc2626 0%, transparent 70%)',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      
      {/* Main content card */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        style={{
          border: '4px solid #dc2626',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Red header bar */}
        <div 
          className="py-4 px-6"
          style={{ backgroundColor: '#dc2626' }}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl animate-pulse">🚨</span>
            <h2 
              id="emergency-title"
              className="text-2xl font-bold text-white tracking-wide"
              style={{ fontFamily: 'Raleway' }}
            >
              EMERGENCY ALERT
            </h2>
            <span className="text-4xl animate-pulse">🚨</span>
          </div>
        </div>
        
        {/* Content area */}
        <div className="p-6">
          {/* Warning icon */}
          <div className="flex justify-center mb-4">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#fef2f2' }}
            >
              <span className="text-5xl">⚠️</span>
            </div>
          </div>
          
          {/* Alert message */}
          <p 
            id="emergency-description"
            className="text-center text-gray-800 text-lg mb-6 leading-relaxed"
            style={{ fontFamily: 'Raleway' }}
          >
            {alertMessage}
          </p>
          
          {/* Urgency notice */}
          <div 
            className="rounded-lg p-4 mb-6"
            style={{ backgroundColor: '#fef2f2', border: '2px solid #fecaca' }}
          >
            <p 
              className="text-center text-red-800 font-semibold text-sm"
              style={{ fontFamily: 'Raleway' }}
            >
              Your pet may need immediate veterinary attention. 
              Please contact a vet or emergency animal hospital right away.
            </p>
          </div>
          
          {/* Primary action - Find Vet */}
          <button
            onClick={handleFindVet}
            className="w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 mb-4"
            style={{ 
              backgroundColor: '#dc2626',
              fontFamily: 'Raleway',
              boxShadow: '0 4px 14px 0 rgba(220, 38, 38, 0.39)'
            }}
          >
            <span className="text-2xl">🏥</span>
            Go to Southvalley Clinic
          </button>
          
          {/* Secondary action - Start Re-assessment */}
          <button
            onClick={onReassess}
            className="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 hover:bg-gray-200"
            style={{ 
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              fontFamily: 'Raleway'
            }}
          >
            🔍 Start Re-assessment
          </button>
        </div>
        
        {/* Footer disclaimer */}
        <div 
          className="px-6 py-3 text-center"
          style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' }}
        >
          <p 
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Raleway' }}
          >
            This is an AI-generated alert. Always consult a licensed veterinarian for medical decisions.
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

EmergencyOverlay.propTypes = {
  alertMessage: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onReassess: PropTypes.func.isRequired
};

export default EmergencyOverlay;


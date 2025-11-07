import React from 'react';


const typeStyles = {
  error: 'bg-[#FFF4F4] border-[#FF6B6B] text-[#B91C1C]',
  success: 'bg-[#F0FFF4] border-[#34D399] text-[#065F46]',
  info: 'bg-[#F3F4F6] border-[#A78BFA] text-[#3730A3]',
  warning: 'bg-[#FFFBEA] border-[#FBBF24] text-[#92400E]'
};

const typeIcons = {
  error: (
    <svg className="w-5 h-5 mr-2 text-[#FF6B6B] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5 mr-2 text-[#34D399] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 mr-2 text-[#6366F1] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 mr-2 text-[#FBBF24] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 19h14.14c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  )
};

function formatErrorMessage(msg) {
  // Try to pretty-print JSON error messages
  if (typeof msg === 'string') {
    try {
      const obj = JSON.parse(msg);
      if (typeof obj === 'object' && obj !== null) {
        return (
          <ul className="pl-4 list-disc">
            {Object.entries(obj).map(([key, val], i) => {
              // Remove dot before key and capitalize first letter
              let cleanKey = key.replace(/^\.+/, '');
              cleanKey = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);
              return (
                <li key={i}><span className="font-semibold">{cleanKey}:</span> {Array.isArray(val) ? val.join(', ') : val}</li>
              );
            })}
          </ul>
        );
      }
    } catch (e) { /* not JSON, fall through */ }
  }
  return msg;
}

const Alert = ({ type = 'info', message, onClose, children }) => {
  if (!message && !children) return null;
  return (
    <div
      className={`flex items-start border-l-4 rounded-lg px-4 py-3 mb-4 shadow-sm ${typeStyles[type] || typeStyles.info}`}
      style={{ fontFamily: 'Raleway, Inter, sans-serif', fontSize: 15, maxWidth: 480 }}
    >
      {typeIcons[type]}
      <div className="flex-1 min-w-0 break-words">
        {formatErrorMessage(message || children)}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-lg font-bold hover:opacity-70 bg-transparent border-none cursor-pointer"
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
import React from 'react';

const Alert = ({ type = 'info', message, onClose, children }) => {
  if (!message && !children) return null;

  return (
    <div className={`alert alert-${type} flex justify-between items-center`}>
      <span>{message || children}</span>
      {onClose && (
        <button 
          onClick={onClose}
          className="ml-4 text-lg font-bold hover:opacity-70 bg-transparent border-none cursor-pointer"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
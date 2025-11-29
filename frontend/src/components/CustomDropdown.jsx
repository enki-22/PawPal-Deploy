import React, { useState, useEffect, useRef } from 'react';

const CustomDropdown = ({ id, name, value, onChange, options, placeholder, disabled, error, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    // Mimic the native event object so parent components don't break
    if (typeof onChange === 'function') onChange({ target: { name, value: option } });
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className || ''}`} ref={dropdownRef}>
      {/* Dropdown Trigger (The Box) */}
      <div
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 font-raleway text-base rounded-[5px] flex items-center justify-between transition-colors select-none ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-[#6D4C9A]'
        }`}
        style={{
          background: '#815FB3',
          color: 'white',
          border: error ? '1px solid #ef4444' : 'none',
        }}
      >
        <span className="truncate">{value || placeholder}</span>

        {/* Custom White Arrow SVG (Matches your original design) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ minWidth: '1em' }}
        >
          <path
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M2 5l6 6 6-6"
          />
        </svg>
      </div>

      {/* Dropdown Menu (The Scrollable List) */}
      {isOpen && !disabled && (
        <div
          className="absolute left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl overflow-y-auto"
          style={{
            maxHeight: '200px', // Limits height to prevent "drop up"
            zIndex: 1002, // Ensures it floats above other elements
          }}
        >
          {options && options.length > 0 ? (
            options.map((option) => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                className={`px-4 py-2 cursor-pointer font-raleway text-sm transition-colors ${
                  value === option
                    ? 'bg-purple-100 text-[#815FB3] font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-400 font-raleway text-sm italic">No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;

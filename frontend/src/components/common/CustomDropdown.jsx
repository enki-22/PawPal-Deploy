import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomDropdown = ({ 
  options = [],
  value = '',
  onChange = () => {},
  width = '125px',
  bgColor = 'bg-[#f0e4b3]',
  maxHeight = '150px' // Controls the height before scrolling starts
}) => {
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

  return (
    <div className="relative" ref={dropdownRef} style={{ width }}>
      {/* Trigger Button */}
      <div 
        className={`${bgColor} h-[31px] rounded-[5px] px-3 flex items-center justify-between cursor-pointer border border-transparent hover:border-[#888] transition-colors`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-[12px] text-black font-['Inter:Regular',sans-serif] truncate mr-2">
          {value}
        </span>
        <ChevronDown className={`w-[12px] h-[12px] text-black transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-full bg-white border border-[#888888] rounded-[5px] shadow-lg z-50 overflow-y-auto custom-scrollbar"
          style={{ maxHeight }}
        >
          {options.map((option) => (
            <div
              key={option}
              className={`px-3 py-2 text-[12px] font-['Inter:Regular',sans-serif] cursor-pointer hover:bg-[#f0e4b3]/50 text-black ${
                option === value ? 'bg-[#f0e4b3] font-bold' : ''
              }`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;

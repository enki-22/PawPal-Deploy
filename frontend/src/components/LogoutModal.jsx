import React from 'react';

const LogoutModal = ({ isOpen, onClose, onConfirm, loading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in" style={{ zIndex: 70 }}>
      {/* Modal Container - 544px width, 176px height */}
      <div className="relative w-[544px] h-[176px] bg-white rounded-2xl animate-scale-in" 
           style={{ 
             boxShadow: '0px 20px 24px -4px rgba(10, 13, 18, 0.1), 0px 8px 8px -4px rgba(10, 13, 18, 0.04)' 
           }}>
        
        {/* Close Button - Positioned absolutely in top right */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors opacity-33"
          disabled={loading}
        >
          <svg className="w-6 h-6" fill="none" stroke="#717680" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header - Content area */}
        <div className="flex flex-row items-start px-6 pt-6 gap-4">
          {/* Text and supporting text section */}
          <div className="flex flex-col items-start gap-1 flex-1">
            {/* Main Title - Text lg / Semibold */}
            <h3 className="w-full h-7 text-lg font-semibold text-[#181D27] leading-7 flex-none self-stretch" 
                style={{ 
                  fontFamily: 'Raleway',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '18px',
                  lineHeight: '28px',
                  color: '#181D27'
                }}>
              Logout?
            </h3>
            
            {/* Supporting text */}
            <p className="text-sm font-normal text-[#535862] leading-5" 
               style={{ fontFamily: 'Raleway' }}>
              Are you sure you want to logout?
            </p>
          </div>
        </div>

        {/* Modal Actions - Button area */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center items-start pt-8">
          <div className="flex flex-row items-center px-6 pb-6 gap-3 w-full">
            {/* Spacer to push buttons to the right */}
            <div className="flex-1"></div>
            
            {/* Action buttons container */}
            <div className="flex flex-row justify-end items-center gap-3">
              {/* Cancel Button */}
              <button
                onClick={onClose}
                disabled={loading}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] bg-white border border-[#D5D7DA] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  boxShadow: '0px 1px 2px rgba(10, 13, 18, 0.05)',
                  width: '90px',
                  height: '44px'
                }}
              >
                <span className="text-base font-semibold text-[#414651] leading-6" 
                      style={{ fontFamily: 'Raleway' }}>
                  Cancel
                </span>
              </button>
              
              {/* Logout Button */}
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex flex-row justify-center items-center px-[18px] py-[10px] rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#815FB3',
                  boxShadow: '0px 1px 2px rgba(10, 13, 18, 0.05)',
                  width: '91px',
                  height: '44px'
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Raleway' }}>
                      Loading...
                    </span>
                  </div>
                ) : (
                  <span className="text-base font-semibold text-white leading-6" 
                        style={{ fontFamily: 'Raleway' }}>
                    Logout
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
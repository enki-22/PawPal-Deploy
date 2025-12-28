import React, { useEffect } from 'react';

const SignupConfirmationModal = ({ show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3 seconds before auto-close
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/25 z-[9999] flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-[#FFFFF2] rounded-[30px] shadow-2xl relative flex flex-col items-center overflow-hidden"
           style={{
             width: '90%',
             maxWidth: '660px', // Reduced by ~45% from 1200px
             padding: '40px 30px',
             minHeight: '350px' // Reduced height
           }}>

        {/* Header: Logo and Name - Absolute Upper Left */}
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <img 
            src="/pat-logo.png" 
            alt="Paw Icon" 
            className="w-12 h-12 object-contain" // Smaller logo
          />
          {/* PAWPAL Name - Purple and Smaller */}
          <h1 className="text-[#815FB3] font-museo font-black text-2xl tracking-wide leading-none mt-1">
            PAWPAL
          </h1>
        </div>

        {/* Content Section: Centered */}
        <div className="flex flex-col items-center justify-center flex-1 w-full mt-10">
          <h2 className="text-[#34113F] font-extrabold text-2xl md:text-4xl leading-tight mb-4 font-raleway text-center">
            Thank you for signing up!
          </h2>
          <p className="text-[#34113F] text-base md:text-xl font-raleway font-medium text-center mb-8">
            Redirecting to sign in. Please login your new account.
          </p>

          {/* Main Image: Smaller and at bottom */}
          <img 
            src="/confirmsignup.png" 
            alt="Signup Confirmation" 
            className="w-auto h-32 md:h-40 object-contain" // Smaller image height
          />
        </div>
      </div>
    </div>
  );
};

export default SignupConfirmationModal;
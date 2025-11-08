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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.25)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#FFFFF2',
        borderRadius: '32px',
        padding: '48px 32px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <img src="/logo_pawpal.png" alt="PawPal Logo" style={{ height: '56px', marginBottom: '16px' }} />
          <h2 style={{ color: '#6D4A96', fontWeight: 800, fontSize: '2rem', marginBottom: '8px', fontFamily: 'Raleway' }}>
            Thank you for signing up!
          </h2>
          <p style={{ color: '#6D4A96', fontSize: '1.1rem', fontFamily: 'Raleway', marginBottom: '16px' }}>
            Redirecting to sign in. Please login your new account.
          </p>
        </div>
        <img src="/signup-illustration.png" alt="Signup Illustration" style={{ width: '220px', margin: '0 auto' }} />
      </div>
    </div>
  );
};

export default SignupConfirmationModal;

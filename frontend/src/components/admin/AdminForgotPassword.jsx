import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAuthService } from '../../services/api';

export default function AdminForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isFading, setIsFading] = useState(false);

  const onSend = async () => {
    if (!email) {
      setError('Enter your email');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await adminAuthService.requestPasswordReset({ email });
      setMessage('If that email exists, we sent a code.');
      setTimeout(() => navigate('/admin/verify-reset-code', { state: { email } }), 800);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to send code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fade and clear the error bubble after a few seconds (matches registration behavior)
  useEffect(() => {
    let fadeTimer;
    let clearTimer;
    if (error) {
      setIsFading(false);
      fadeTimer = setTimeout(() => setIsFading(true), 2800);
      clearTimer = setTimeout(() => setError(''), 3300);
    }
    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E6D6F7] p-6">
      <div className="bg-[#FFFFF2] w-full max-w-[660px] rounded-[30px] shadow-2xl relative p-8 md:p-12" style={{ minHeight: '440px' }}>

        {/* Header: Logo and Name (matched to SignupConfirmationModal) */}
        <div className="absolute top-6 left-6 flex items-center gap-3" style={{ transform: 'scale(1.4)', transformOrigin: 'left top' }}>
          <img 
            src="/pat-removebg-preview 1.png" 
            alt="Paw Icon" 
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-[#815FB3] font-museo font-black text-2xl tracking-wide leading-none mt-1">
            PAWPAL
          </h1>
        </div>

        <div className="flex flex-col items-center text-center" style={{ paddingTop: '75px' }}>
          <h1 className="mb-2" style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#34113F' }}>Admin - Forgot Password</h1>
          
          {/* FIX: Changed "we'll" to "we&apos;ll" */}
          <p className="mb-6 max-w-xl" style={{ fontFamily: 'Raleway', fontWeight: 300, fontSize: '15px', color: '#6B6B6B' }}>
            Enter your admin email and we&apos;ll send a verification code.
          </p>

          <form className="w-full max-w-md" onSubmit={async (e) => { e.preventDefault(); await onSend(); }}>
            <style>
              {`@keyframes errorPop { 0% { opacity: 0; transform: translateY(-10px) scale(0.8); } 50% { transform: translateY(2px) scale(1.05); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes errorFadeOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-10px) scale(0.8); } }`}
            </style>

            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="w-full mb-4 px-3 py-2 bg-transparent border-b-2 border-[#4A3B5C] focus:outline-none focus:border-[#8B5CF6]"
                placeholder="admin@pawpal.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '-25px',
                  background: '#ef4444',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: 'Raleway',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  zIndex: 1000,
                  animation: isFading ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                }}>
                  {error}
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '-8px',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid #ef4444'
                  }} />
                </div>
              )}
            </div>

            {message ? <div className="mb-3 text-sm text-green-600 text-left">{message}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-[#7E60BF] text-white rounded-xl py-3 hover:bg-[#6c52a3] transition shadow-[0_4px_14px_rgba(126,96,191,0.25)]"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
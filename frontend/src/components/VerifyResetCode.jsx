import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function VerifyResetCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromNav = location.state?.email || '';
  
  const [email, setEmail] = useState(emailFromNav);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFading, setIsFading] = useState(false);
  
  // Logic: If email exists from nav, assume code was just sent and start timer
  const [codeSent, setCodeSent] = useState(!!emailFromNav);
  const [seconds, setSeconds] = useState(emailFromNav ? 60 : 0);
  
  const inputsRef = useRef([]);

  // Focus first input if code is sent
  useEffect(() => {
    if (codeSent) {
      inputsRef.current[0]?.focus();
    }
  }, [codeSent]);

  // Timer countdown
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  // Auto-fade error bubble (matches ForgotPassword behavior)
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

  const handleChange = (idx, val) => {
    // Allow only numbers
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError(''); // Clear error on typing
    
    // Auto-advance focus
    if (val && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  // Handle paste of full code (e.g., user copies code from email and pastes)
  const handlePaste = (e) => {
    const pasted = e.clipboardData?.getData('Text') || '';
    if (!pasted) return;
    const onlyDigits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    if (onlyDigits.length === 0) return;
    // Prevent default paste behaviour to avoid inserting into a single input
    e.preventDefault();
    const next = ['','','','','',''];
    for (let i = 0; i < 6; i++) {
      next[i] = onlyDigits[i] || '';
    }
    setDigits(next);
    setError('');
    setCodeSent(true);
    // Focus the last filled input
    const focusIndex = Math.min(5, onlyDigits.length - 1);
    setTimeout(() => inputsRef.current[focusIndex]?.focus(), 50);
  };

  const code = digits.join('');

  const onSend = async () => {
    if (!email) {
      setError('Enter your email');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await authService.requestPasswordReset({ email });
      setSuccess('Code sent to your email.');
      setSeconds(60);
      setCodeSent(true);
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to send code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!email || code.length !== 6) {
      setError('Enter your email and 6-digit code.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await authService.verifyOtp({ email, purpose: 'password_reset', code });
      // Navigate on success
      navigate('/create-new-password', { state: { email, code, verified: true } });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Invalid code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E6D6F7] p-6">
      <div className="bg-[#FFFFF2] w-full max-w-[660px] rounded-[30px] shadow-2xl relative p-8 md:p-12" style={{ minHeight: '440px' }}>
        
        {/* Header: Logo and Name (Consistent with ForgotPassword) */}
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
          
          {/* Title Section */}
          <h1 className="mb-2" style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#34113F' }}>
            Verify Reset Code
          </h1>
          
          <p className="mb-8 max-w-md" style={{ fontFamily: 'Raleway', fontWeight: 300, fontSize: '15px', color: '#6B6B6B' }}>
            {codeSent 
              ? <>Enter the 6-digit code sent to <span className="font-semibold text-[#34113F]">{email}</span></>
              : "Enter your email to receive a verification code."
            }
          </p>

          <div className="w-full max-w-md">
            <style>
              {`@keyframes errorPop { 0% { opacity: 0; transform: translateY(-10px) scale(0.8); } 50% { transform: translateY(2px) scale(1.05); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes errorFadeOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-10px) scale(0.8); } }`}
            </style>

            <form onSubmit={async (e) => { e.preventDefault(); if (codeSent) { await onVerify(); } else { await onSend(); } }}>

            {/* View 1: Email Input (If user navigated here directly without sending code yet) */}
            {!codeSent && (
              <div className="relative mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-left" style={{ fontFamily: 'Raleway' }}>Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-transparent border-b-2 border-[#4A3B5C] focus:outline-none focus:border-[#8B5CF6] text-[#34113F]"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ fontFamily: 'Raleway' }}
                />
              </div>
            )}

            {/* View 2: OTP Digits Input */}
            {codeSent && (
              <div className="flex items-center justify-between gap-2 mb-8 relative">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="w-10 h-12 md:w-12 md:h-14 text-center text-xl rounded-lg border-2 border-[#4A3B5C] bg-transparent focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                    style={{ fontFamily: 'Raleway', fontWeight: 600, color: '#34113F' }}
                  />
                ))}
                </div>
            )}

            {/* Error Bubble (Shared Position) */}
            <div className="relative w-full">
              {error && (
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bottom: '10px', // Positioned just above the button area
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
                    left: '50%',
                    bottom: '-8px',
                    marginLeft: '-8px',
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid #ef4444'
                  }} />
                </div>
              )}
            </div>

            {success ? <div className="mb-4 text-sm text-green-600 text-center font-raleway">{success}</div> : null}

            {/* Action Buttons */}
            {codeSent ? (
               // Verify Mode
               <div className="flex flex-col gap-3">
                 <button
                   type="submit"
                   disabled={loading}
                   className="w-full bg-[#7E60BF] text-white rounded-xl py-3 hover:bg-[#6c52a3] transition shadow-[0_4px_14px_rgba(126,96,191,0.25)] font-raleway font-semibold"
                 >
                   {loading ? 'Verifying...' : 'Verify Code'}
                 </button>
                 
                 <button 
                   type="button"
                   onClick={onSend}
                   disabled={seconds > 0 || loading}
                   className="text-sm text-[#7E60BF] hover:text-[#5a39a6] disabled:text-gray-400 font-raleway font-medium transition"
                 >
                   {seconds > 0 ? `Resend code in ${seconds}s` : "Resend Code"}
                 </button>
               </div>
            ) : (
               // Initial Send Mode
               <button
                 type="submit"
                 disabled={loading || seconds > 0}
                 className="w-full mt-4 bg-[#7E60BF] text-white rounded-xl py-3 hover:bg-[#6c52a3] transition shadow-[0_4px_14px_rgba(126,96,191,0.25)] font-raleway font-semibold"
               >
                 {seconds > 0 ? `Wait ${seconds}s` : (loading ? 'Sending...' : 'Send OTP')}
               </button>
            )}

            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
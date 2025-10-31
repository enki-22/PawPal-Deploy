import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const inputBase = 'w-12 h-12 md:w-14 md:h-14 text-center text-lg md:text-xl rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500';

export default function VerifyResetCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromNav = location.state?.email || '';
  const [email, setEmail] = useState(emailFromNav);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, [codeSent]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleChange = (idx, val) => {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError('');
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
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
      setSuccess('We sent a reset code to your email.');
      setSeconds(60);
      setCodeSent(true);
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
    // No server verify endpoint separate from reset; move to next step with verified state
    navigate('/create-new-password', { state: { email, code, verified: true } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Verify Reset Code</h1>
        <p className="text-sm text-gray-600 mb-6">Send the OTP to your email, then enter the 6-digit code.</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={onSend}
          disabled={loading || seconds > 0}
          className="w-full mb-4 bg-[#6B46C1] text-white rounded-xl py-3 hover:bg-[#5a39a6] transition disabled:opacity-60"
        >
          {seconds > 0 ? `Resend in ${seconds}s` : (loading ? 'Sending...' : 'Send OTP')}
        </button>

        {codeSent && (
          <>
            <div className="flex items-center justify-between gap-2 mb-6">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  inputMode="numeric"
                  maxLength={1}
                  className={inputBase}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                />
              ))}
            </div>
            <button
              onClick={onVerify}
              disabled={loading}
              className="w-full mb-3 bg-[#6B46C1] text-white rounded-xl py-3 hover:bg-[#5a39a6] transition"
            >
              Verify Code
            </button>
          </>
        )}

        {error ? (
          <div className="mt-3 text-sm text-red-600">{error}</div>
        ) : null}
        {success ? (
          <div className="mt-3 text-sm text-green-600">{success}</div>
        ) : null}
      </div>
    </div>
  );
}





import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSend = async () => {
    if (!email) {
      setError('Enter your email');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setMessage('');
      await authService.requestPasswordReset({ email });
      setMessage('If that email exists, we sent a code.');
      setTimeout(() => navigate('/verify-reset-code', { state: { email } }), 800);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to send code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Forgot Password</h1>
        <p className="text-sm text-gray-600 mb-6">Enter your email and we’ll send a verification code.</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}
        {message ? <div className="mb-3 text-sm text-green-600">{message}</div> : null}

        <button
          onClick={onSend}
          disabled={loading}
          className="w-full bg-[#6B46C1] text-white rounded-xl py-3 hover:bg-[#5a39a6] transition"
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </div>
    </div>
  );
}




import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

function strengthLabel(score) {
  if (score >= 4) return { label: 'Strong', color: 'bg-green-500' };
  if (score >= 3) return { label: 'Medium', color: 'bg-yellow-500' };
  return { label: 'Weak', color: 'bg-red-500' };
}

function computeStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 5);
}

export default function CreateNewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromNav = location.state?.email || '';
  const codeFromNav = location.state?.code || '';
  const verified = !!location.state?.verified;

  const [email] = useState(emailFromNav);
  const [code] = useState(codeFromNav);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const score = useMemo(() => computeStrength(password), [password]);
  const sInfo = strengthLabel(score >= 5 ? 4 : score);
  const percent = Math.max(20, score * 20);

  const onSubmit = async () => {
    if (!verified) {
      setError('Verify your reset code first.');
      return;
    }
    if (!password || !confirm) {
      setError('Enter new password and confirmation.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // FIX 1: Send 'otp_code' instead of 'code' to match backend serializer
      await authService.resetPassword({ 
        email, 
        otp_code: code, 
        new_password: password, 
        confirm_password: confirm 
      });

      setSuccess('Password updated. Redirecting to login...');
      setTimeout(() => navigate('/petowner/login'), 1200);
    } catch (err) {
      let msg = err?.response?.data?.error || 'Failed to reset password';
      
      // FIX 2: Check if msg is an object (validation errors) and convert to string
      if (typeof msg === 'object' && msg !== null) {
        // Flattens {"otp_code": ["Error"], "new_password": ["Error"]} into "Error; Error"
        msg = Object.values(msg).flat().join('; ');
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!verified || !email || !code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <p className="text-gray-700 mb-4">Please verify your reset code first.</p>
          <button onClick={() => navigate('/verify-reset-code')} className="bg-[#6B46C1] text-white rounded-xl py-2 px-4">Go to Verify</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Create New Password</h1>
        <p className="text-sm text-gray-600 mb-6">Set a new password for {email}.</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <input
          type="password"
          className="w-full mb-2 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700">Password strength</span>
            <span className="text-xs text-gray-600">{sInfo.label}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${sInfo.color} h-2 rounded-full`} style={{ width: `${percent}%` }} />
          </div>
          <ul className="mt-2 text-xs text-gray-600 list-disc list-inside">
            <li>Minimum 8 characters</li>
            <li>At least 1 uppercase and 1 lowercase letter</li>
            <li>At least 1 number and 1 special character</li>
          </ul>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input
          type="password"
          className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="********"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error ? <div className="mb-3 text-sm text-red-600">{error}</div> : null}
        {success ? <div className="mb-3 text-sm text-green-600">{success}</div> : null}

        <button
          onClick={onSubmit}
          disabled={loading}
          className="w-full bg-[#6B46C1] text-white rounded-xl py-3 hover:bg-[#5a39a6] transition"
        >
          {loading ? 'Updating...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}
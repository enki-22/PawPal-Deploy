import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { FiEye, FiEyeOff } from 'react-icons/fi'; 

function strengthLabel(score) {
  if (score >= 4) return { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
  if (score >= 3) return { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
  return { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
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
  const [showModal, setShowModal] = useState(false);
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const score = useMemo(() => computeStrength(password), [password]);
  const sInfo = strengthLabel(score >= 5 ? 4 : score);
  const percent = Math.min(100, Math.max(5, score * 20));

  // Auto-fade error bubble
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
      
      await authService.resetPassword({ 
        email, 
        otp_code: code, 
        new_password: password, 
        confirm_password: confirm 
      });

      // Show confirmation modal
      setShowModal(true);
      setSuccess('');
    } catch (err) {
      let msg = err?.response?.data?.error || 'Failed to reset password';
      if (typeof msg === 'object' && msg !== null) {
        msg = Object.values(msg).flat().join('; ');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login after showing success modal
  useEffect(() => {
    if (!showModal) return;
    const t = setTimeout(() => {
      navigate('/petowner/login');
    }, 3000); // Increased to 3s to match the modal timer usually
    return () => clearTimeout(t);
  }, [showModal, navigate]);

  // Shared Animation Styles
  const animationStyles = (
    <style>
      {`@keyframes errorPop { 0% { opacity: 0; transform: translateY(-10px) scale(0.8); } 50% { transform: translateY(2px) scale(1.05); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes errorFadeOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-10px) scale(0.8); } }`}
    </style>
  );

  // Fallback view for unverified access
  if (!verified || !email || !code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E6D6F7] p-6">
        <div className="bg-[#FFFFF2] w-full max-w-md rounded-[30px] shadow-2xl p-12 text-center">
            {/* Header Logo */}
            <div className="flex items-center justify-center gap-3 mb-6 transform scale-125">
                <img src="/pat-removebg-preview 1.png" alt="Paw Icon" className="w-12 h-12 object-contain"/>
                <h1 className="text-[#815FB3] font-museo font-black text-2xl tracking-wide leading-none mt-1">PAWPAL</h1>
            </div>
            <p className="text-[#6B6B6B] mb-8 font-raleway font-light">Session expired or invalid. Please verify your code again.</p>
            <button 
                onClick={() => navigate('/verify-reset-code')} 
                className="w-full bg-[#7E60BF] text-white rounded-xl py-3 hover:bg-[#6c52a3] transition shadow-[0_4px_14px_rgba(126,96,191,0.25)] font-raleway font-semibold"
            >
                Go to Verify
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E6D6F7] p-6">
      <div className="bg-[#FFFFF2] w-full max-w-[660px] rounded-[30px] shadow-2xl relative p-8 md:p-12" style={{ minHeight: '500px' }}>
        
        {animationStyles}

        {/* Header: Logo and Name */}
        <div className="absolute top-6 left-6 flex items-center gap-3" style={{ transform: 'scale(1.4)', transformOrigin: 'left top' }}>
          <img 
            src="/pat-removebg-preview 2.png" 
            alt="Paw Icon" 
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-[#815FB3] font-museo font-black text-2xl tracking-wide leading-none mt-1">
            PAWPAL
          </h1>
        </div>

        <div className="flex flex-col items-center text-center" style={{ paddingTop: '75px' }}>
          <h1 className="mb-2" style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#34113F' }}>
            Create New Password
          </h1>
          <p className="mb-8" style={{ fontFamily: 'Raleway', fontWeight: 300, fontSize: '15px', color: '#6B6B6B' }}>
            Set a new secure password for your account.
          </p>

          <form className="w-full max-w-md space-y-6" onSubmit={async (e) => { e.preventDefault(); await onSubmit(); }}>
            
            {/* New Password Input */}
            <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Raleway' }}>New Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-3 py-2 bg-transparent border-b-2 border-[#4A3B5C] focus:outline-none focus:border-[#8B5CF6] text-[#34113F] pr-10"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ fontFamily: 'Raleway' }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-[#7E60BF] transition"
                    >
                        {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                </div>

                {/* Password Strength Meter */}
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500 font-raleway">Strength</span>
                        <span className={`text-xs font-bold ${sInfo.textColor} font-raleway`}>
                            {password ? sInfo.label : ''}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out ${sInfo.color}`} 
                            style={{ width: `${percent}%` }} 
                        />
                    </div>
                    {/* Requirements List */}
                    {score < 5 && (
                        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                             <p className={`text-[11px] flex items-center ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                                {password.length >= 8 ? '✓' : '•'} 8+ characters
                             </p>
                             <p className={`text-[11px] flex items-center ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                                {/[A-Z]/.test(password) ? '✓' : '•'} Uppercase
                             </p>
                             <p className={`text-[11px] flex items-center ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                                {/[a-z]/.test(password) ? '✓' : '•'} Lowercase
                             </p>
                             <p className={`text-[11px] flex items-center ${/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}>
                                {(password.match(/[0-9]/) && password.match(/[^A-Za-z0-9]/)) ? '✓' : '•'} Number & Special
                             </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Password Input */}
            <div className="text-left relative">
                <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'Raleway' }}>Confirm Password</label>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"}
                        className="w-full px-3 py-2 bg-transparent border-b-2 border-[#4A3B5C] focus:outline-none focus:border-[#8B5CF6] text-[#34113F] pr-10"
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        style={{ fontFamily: 'Raleway' }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-[#7E60BF] transition"
                    >
                        {showConfirm ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                </div>
                
                {/* Error Bubble */}
                {error && (
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        bottom: '-45px',
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
                            top: '-8px',
                            right: '20px',
                            width: 0,
                            height: 0,
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderBottom: '8px solid #ef4444'
                        }} />
                    </div>
                )}
            </div>

            {success ? <div className="text-sm text-green-600 font-raleway font-semibold bg-green-50 p-2 rounded-lg">{success}</div> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-[#7E60BF] text-white rounded-xl py-3 hover:bg-[#6c52a3] transition shadow-[0_4px_14px_rgba(126,96,191,0.25)] font-raleway font-semibold"
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>

            {/* dev-only test button removed */}
          </form>
        </div>
      </div>

      {/* Success Modal Overlay - Matched exactly to SignupConfirmationModal */}
      {showModal && (
        <div className="fixed inset-0 w-screen h-screen bg-black/25 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#FFFFF2] rounded-[30px] shadow-2xl relative flex flex-col items-center overflow-hidden"
              style={{
                width: '90%',
                maxWidth: '660px',
                padding: '40px 30px',
                minHeight: '350px'
              }}>

            {/* Header: Logo and Name - Absolute Upper Left */}
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <img 
                src="/pat-removebg-preview 1.png" 
                alt="Paw Icon" 
                className="w-12 h-12 object-contain"
              />
              <h1 className="text-[#815FB3] font-museo font-black text-2xl tracking-wide leading-none mt-1">
                PAWPAL
              </h1>
            </div>

            {/* Content Section: Centered */}
            <div className="flex flex-col items-center justify-center flex-1 w-full mt-10">
              <h2 className="text-[#34113F] font-extrabold leading-tight mb-4 font-raleway text-center" style={{ fontSize: '25px' }}>
                Password renewed successfully
              </h2>
              <p className="text-[#34113F] font-raleway font-medium text-center mb-8" style={{ fontSize: '15px' }}>
                Redirecting to sign in. Please login your account.
              </p>

              {/* Main Image */}
              <img 
                src="/confirmsignup.png" 
                alt="Success Confirmation" 
                className="w-auto h-32 md:h-40 object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
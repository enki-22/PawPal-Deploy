import { useState, useEffect, useCallback } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import pawIcon from '../Assets/Images/paw-icon.png';
import pawBullet from '../Assets/Images/paw.png';
import { useAuth } from '../context/AuthContext';
import { useRegistration } from '../context/RegistrationContext';
import Alert from './Alert';

// Reusable Carousel Component
const PurpleCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  // Removed fadeClass for no fade transitions

  // Simple slide change, no fade
  const handleSlideChange = useCallback((newSlide) => {
    if (newSlide !== currentSlide) {
      setCurrentSlide(newSlide);
    }
  }, [currentSlide]);

  // Autoplay functionality - switch slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleSlideChange((currentSlide + 1) % 2);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide, handleSlideChange]);

  return (
    <div className="bg-[#815FB3] text-white w-full rounded-2xl relative p-4 md:p-10 flex flex-col justify-start items-center overflow-visible min-h-[320px] md:min-h-[500px] lg:min-h-[600px]">
      
      {/* FIXED SHARED LOGO - Always visible at top */}
      <div className="mb-8" style={{ flexShrink: 0 }}>
        {/* Mobile: custom logo and font, purple color */}
        <div className="inline-flex items-center justify-center w-full md:hidden">
          <img src="/pat-removebg-preview 2.png" alt="PawPal Logo" className="w-20 h-20 mr-2" />
          <h1 className="font-museomoderno font-black text-[49px] leading-[100%] tracking-[0%]" style={{ color: '#815FB3' }}>
            PAWPAL
          </h1>
        </div>
        {/* Desktop: original logo and font */}
        <div className="inline-flex items-center justify-center w-full hidden md:flex">
          {pawIcon ? (
            <img src={pawIcon} alt="Paw" className="w-20 h-20" />
          ) : (
            <span className="text-5xl mr-3">🐾</span>
          )}
          <h1 className="text-[#FFF07B] font-museo font-black text-[49px] leading-[100%] tracking-[0%]">
            PAWPAL
          </h1>
        </div>
      </div>

      {/* CAROUSEL CONTENT AREA - Only content below logo changes */}
      <div className="flex-1 w-full" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
  <div>
          {currentSlide === 0 ? (
            // Slide 1: Health companion content (without logo)
            <>
              <h2 className="text-[24px] font-bold leading-[100%] tracking-[0%] mb-6"
                  style={{ 
                    fontFamily: 'Raleway', 
                    color: '#FFFFF2',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                  }}>
                Your pet&apos;s health companion
              </h2>
             
              <div className="text-[17px] font-medium leading-[140%] tracking-[0%] mb-8"
                   style={{ 
                     fontFamily: 'Raleway', 
                     color: '#FFFFF2', 
                     whiteSpace: 'nowrap',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     width: '100%'
                   }}>
                <div style={{ textAlign: 'left', display: 'inline-block' }}>
                  <div>Get instant answers to your pet</div>
                  <div>health questions, track vaccinations,</div>
                  <div>and receive personalized care</div>
                  <div>recommendations.</div>
                </div>
              </div>
             
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '280px' }}>
                  {pawBullet ? (
                    <img src={pawBullet} alt="Paw" className="w-6 h-6 transform rotate-45" style={{ marginRight: '12px', flexShrink: 0 }} />
                  ) : (
                    <span className="text-yellow-400 text-lg" style={{ marginRight: '12px', flexShrink: 0 }}>🐾</span>
                  )}
                  <span className="text-[20px] font-medium leading-[100%] tracking-[0%]"
                        style={{ 
                          fontFamily: 'Raleway', 
                          color: '#FFFFF2',
                          whiteSpace: 'nowrap'
                        }}>
                    24/7 Pet Health Support
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '280px' }}>
                  {pawBullet ? (
                    <img src={pawBullet} alt="Paw" className="w-6 h-6 transform rotate-45" style={{ marginRight: '12px', flexShrink: 0 }} />
                  ) : (
                    <span className="text-yellow-400 text-lg" style={{ marginRight: '12px', flexShrink: 0 }}>🐾</span>
                  )}
                  <span className="text-[20px] font-medium leading-[100%] tracking-[0%]"
                        style={{ 
                          fontFamily: 'Raleway', 
                          color: '#FFFFF2',
                          whiteSpace: 'nowrap'
                        }}>
                    Personalized Care
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '280px' }}>
                  {pawBullet ? (
                    <img src={pawBullet} alt="Paw" className="w-6 h-6 transform rotate-45" style={{ marginRight: '12px', flexShrink: 0 }} />
                  ) : (
                    <span className="text-yellow-400 text-lg" style={{ marginRight: '12px', flexShrink: 0 }}>🐾</span>
                  )}
                  <span className="text-[20px] font-medium leading-[100%] tracking-[0%]"
                        style={{ 
                          fontFamily: 'Raleway', 
                          color: '#FFFFF2'
                        }}>
                    Track Vaccinations<br />and Medications
                  </span>
                </div>
              </div>
            </>
          ) : (
            // Slide 2: Banner image only (without logo) - Much larger now
            <>
              <div className="w-full h-full flex items-center justify-center" style={{ overflow: 'visible' }}>
                <img 
                  src="/194911935_109537641352555_8380857820585025274_n 1.png" 
                  alt="SOUTHVALLEY VETERINARY CLINIC Banner" 
                  className="rounded-lg"
                  style={{ 
                    width: '135%',
                    maxWidth: '135%',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Page Indicator Dots - Fixed Position */}
      <div 
        className="flex justify-center space-x-2"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <button
          onClick={() => handleSlideChange(0)}
          className={
            currentSlide === 0 
              ? 'w-6 h-2 bg-[#642A77] rounded-full' 
              : 'w-2 h-2 bg-[#642A77] rounded-full hover:bg-[#7A3A87]'
          }
        />
        <button
          onClick={() => handleSlideChange(1)}
          className={
            currentSlide === 1 
              ? 'w-6 h-2 bg-[#642A77] rounded-full' 
              : 'w-2 h-2 bg-[#642A77] rounded-full hover:bg-[#7A3A87]'
          }
        />
      </div>
    </div>
  );
};

// Login Form Component
const LoginForm = ({ onSwitchToRegister, successMessage, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- NEW: State for fading out errors ---
  const [isFading, setIsFading] = useState(false);
  const [isAlertFading, setIsAlertFading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- NEW: useEffect to handle 3-second fade-out for main Alert ---
  useEffect(() => {
    if (error) {
      setIsAlertFading(false); // Show it
      
      const fadeTimer = setTimeout(() => {
        setIsAlertFading(true); // Start fading
      }, 2700); // Start fade at 2.7s

      const clearTimer = setTimeout(() => {
        setError('');
        setIsAlertFading(false); // Reset
      }, 3000); // Remove at 3s

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [error]);

  // --- NEW: useEffect to handle 3-second fade-out for field errors ---
  useEffect(() => {
    // If errors exist and we are not already in a fade-out cycle
    if (Object.keys(errors).length > 0) {
      setIsFading(false); // Ensure we are not fading

      // Timer to start fading out
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 2700); // 2.7s visible, 0.3s fade-out

      // Timer to clear errors after fade-out is complete
      const clearTimer = setTimeout(() => {
        setErrors({});
        setIsFading(false); // Reset state
      }, 3000);

      // Cleanup timers if component unmounts or errors change
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [errors]); // Only re-run when 'errors' object itself changes

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Removed timer from here, useEffect now handles it
      return;
    }
    setErrors({});
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      // Removed timer from here, useEffect now handles it
    }
  };

  return (
  <div className="flex flex-col justify-center h-full px-2 md:px-8">
      {/* --- NEW: Style block for fade-out animation --- */}
      <style>
        {`
          @keyframes errorPop {
            0% {
              opacity: 0;
              transform: translateY(-10px) scale(0.8);
            }
            50% {
              transform: translateY(2px) scale(1.05);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes errorFadeOut {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(-10px) scale(0.8);
            }
          }
        `}
      </style>
  <div className="max-w-xs md:max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-[30px] font-bold leading-[100%] tracking-[5%] text-center mb-2 hidden md:block"
              style={{ fontFamily: 'Raleway' }}>
            Sign In
          </h2>
          {/* Remove sign up prompt in mobile view, keep only desktop */}
          <p className="text-[18px] font-light leading-[100%] tracking-[0%] text-center hidden md:block"
             style={{ fontFamily: 'Raleway' }}>
            Don&apos;t have an account yet?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-gray-900 font-semibold hover:underline cursor-pointer bg-transparent border-none"
            >
              Sign Up
            </button>
          </p>
        </div>

        {successMessage && (
          <Alert type="success" message={successMessage} />
        )}
        
        {/* --- MODIFIED: Wrapped Alert in a fading div --- */}
        <div className={`transition-opacity duration-300 ${isAlertFading ? 'opacity-0' : 'opacity-100'}`}>
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}
        </div>

  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label htmlFor="email" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2"
                   style={{ fontFamily: 'Raleway' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[15px] md:text-[16px] font-light leading-[100%] tracking-[0%] placeholder-gray-400"
                  style={{ fontFamily: 'Raleway' }}
                  placeholder="your@email.com"
                />
              {/* --- MODIFIED: Pop-out error for both required and invalid email --- */}
              {errors.email && (
                <div style={{
                  position: 'absolute',
                  right: '0',
                  bottom: '-44px',
                  background: '#ef4444',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: 'Raleway',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  zIndex: 1000,
                  animation: isFading ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                }}>
                  {errors.email}
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '-8px',
                    width: '0',
                    height: '0',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid #ef4444'
                  }}></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2"
                   style={{ fontFamily: 'Raleway' }}>
              Password
            </label>
            <div className="relative mt-1">
              <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-0 py-2 pr-10 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[15px] md:text-[16px] font-light leading-[100%] tracking-[0%] placeholder-gray-400"
                  style={{ fontFamily: 'Raleway' }}
                  placeholder="••••••••"
                />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
              {/* --- MODIFIED: Added conditional animation style --- */}
              {errors.password && (
                <div style={{
                  position: 'absolute',
                  right: '0',
                  bottom: '-20px',
                  background: '#ef4444',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: 'Raleway',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  zIndex: 1000,
                  // --- THIS LINE IS NEW ---
                  animation: isFading ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                }}>
                  {errors.password}
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '-8px',
                    width: '0',
                    height: '0',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid #ef4444'
                  }}></div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-[#815FB3] text-sm hover:underline mb-4"
              style={{ fontFamily: 'Raleway' }}
            >
              Forgot Password?
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-[#815FB3] hover:bg-[#6d4a96] text-white font-medium py-3 px-8 md:px-16 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                fontFamily: 'Raleway',
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'
              }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Register Form Component
const RegisterForm = ({ onSwitchToLogin, onSubmit, loading, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.username || '',
    email: initialData?.email || '',
    password: initialData?.password1 || '',
    confirmPassword: initialData?.password2 || '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- NEW: State for fading out errors ---
  const [isFading, setIsFading] = useState(false);
  const [isAlertFading, setIsAlertFading] = useState(false);

  // --- MODIFIED: Removed error clearing from handleChange ---
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Removed the on-type error clearing to allow the timer to work
  };

  // --- NEW: useEffect for the main 'general' alert ---
  useEffect(() => {
    if (errors.general) {
      setIsAlertFading(false); // Show it
      const fadeTimer = setTimeout(() => {
        setIsAlertFading(true); // Start fading
      }, 2700);
      const clearTimer = setTimeout(() => {
        setErrors(prev => ({ ...prev, general: undefined })); // Clear only the general error
        setIsAlertFading(false); // Reset
      }, 3000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [errors.general]); // Only depends on the general error string

  // --- NEW: useEffect for the field error bubbles ---
  useEffect(() => {
    const fieldErrorKeys = Object.keys(errors).filter(k => k !== 'general');
    if (fieldErrorKeys.length > 0) {
      setIsFading(false); // Show errors
      const fadeTimer = setTimeout(() => {
        setIsFading(true); // Start fading
      }, 2700);
      const clearTimer = setTimeout(() => {
        // Clear only field errors, keep general error if it exists
        setErrors(prev => ({ general: prev.general }));
        setIsFading(false); // Reset
      }, 3000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [errors]);


  const validateForm = () => {
    const newErrors = {};
    // ... (validation logic is unchanged) ...
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain an uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain a lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain a number';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      newErrors.password = 'Password must contain a special character';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    try {
      await onSubmit({
        username: formData.name,
        email: formData.email,
        password1: formData.password,
        password2: formData.confirmPassword
      });
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    }
  };

  // This is the main container. 
  return (
    <>
      {/* --- Style block for fade-out animation --- */}
      <style>
        {`
          @keyframes errorPop {
            0% {
              opacity: 0;
              transform: translateY(-10px) scale(0.8);
            }
            50% {
              transform: translateY(2px) scale(1.05);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes errorFadeOut {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to {
              opacity: 0;
              transform: translateY(-10px) scale(0.8);
            }
          }
        `}
      </style>
      {/* Responsive wrapper: mobile uses full width, desktop uses max width */}
      <div
        className="w-full flex flex-col justify-center items-center md:min-h-[480px] md:px-2 md:py-2 md:bg-[#FFFFF2] md:rounded-2xl"
        style={{ boxSizing: 'border-box' }}
      >
        <div className="w-full max-w-[370px] mx-auto" style={{ boxSizing: 'border-box' }}>
          {/* Header Section - All text is centered */}
          <div className="text-center mb-6">
            <h2
              className="font-bold text-[28px] mb-3"
              style={{ fontFamily: 'Raleway', color: '#34113F' }}
            >
              Get Started
            </h2>
            <p
              className="text-[16px] mb-4"
              style={{ fontFamily: 'Raleway', color: '#666666' }}
            >
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold cursor-pointer bg-transparent border-none p-0 focus:outline-none transition-colors duration-200"
                style={{ color: '#34113F', textDecoration: 'none', position: 'relative' }}
                onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign In
              </button>
            </p>
            <h3
              className="font-bold text-[16px]"
              style={{ fontFamily: 'Raleway', color: '#34113F' }}
            >
                1 ) Account Information
            </h3>
          </div>
          {/* --- MODIFIED: Wrapped Alert in a fading div --- */}
          <div className={`transition-opacity duration-300 ${isAlertFading ? 'opacity-0' : 'opacity-100'}`}>
            {errors.general && (
              <div className="mb-4">
                <Alert type="error" message={errors.general} onClose={() => setErrors({ ...errors, general: '' })} />
              </div>
            )}
          </div>
          {/* Form Fields - All left-aligned */}
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex flex-col gap-2">
              <div>
                <label
                  className="block font-light text-[15px] mb-1"
                  style={{ fontFamily: 'Raleway', color: '#666666' }}
                >
                  Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border-0 border-b-2 border-[#34113F] bg-transparent outline-none text-[16px] font-normal text-black py-2"
                    style={{ fontFamily: 'Raleway' }}
                    required
                  />
                  {/* --- MODIFIED: Added conditional animation style --- */}
                  {errors.name && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      background: '#ef4444',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'Raleway',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                      zIndex: 1000,
                      marginTop: '4px',
                      transform: 'translateX(0)',
                      animation: isFading ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                    }}>
                      {errors.name}
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '16px',
                        width: '0',
                        height: '0',
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: '4px solid #ef4444'
                      }}></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  className="block font-light text-[15px] mb-1"
                  style={{ fontFamily: 'Raleway', color: '#666666' }}
                >
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border-0 border-b-2 border-[#34113F] bg-transparent outline-none text-[16px] font-normal text-black py-2"
                    style={{ fontFamily: 'Raleway' }}
                    required
                  />
                  {/* --- MODIFIED: Added conditional animation style --- */}
                  {errors.email && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      background: '#ef4444',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'Raleway',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                      zIndex: 1000,
                      marginTop: '4px',
                      transform: 'translateX(0)',
                      animation: isFading ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                    }}>
                      {errors.email}
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '16px',
                        width: '0',
                        height: '0',
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: '4px solid #ef4444'
                      }}></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  className="block font-light text-[15px] mb-1"
                  style={{ fontFamily: 'Raleway', color: '#666666' }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border-0 border-b-2 border-[#34113F] bg-transparent outline-none text-[16px] font-normal text-black py-2 pr-10"
                    style={{ fontFamily: 'Raleway' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ top: '0', height: '100%' }}
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                  {/* --- MODIFIED: Added conditional animation style --- */}
                  {errors.password && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      background: '#ef4444',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'Raleway',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                      zIndex: 1000,
                      marginTop: '4px',
                      transform: 'translateX(0)',
                      animation: isFading ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                    }}>
                      {errors.password}
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '16px',
                        width: '0',
                        height: '0',
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: '4px solid #ef4444'
                      }}></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label
                  className="block font-light text-[15px] mb-1"
                  style={{ fontFamily: 'Raleway', color: '#666666' }}
                >
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full border-0 border-b-2 border-[#34113F] bg-transparent outline-none text-[16px] font-normal text-black py-2 pr-10"
                    style={{ fontFamily: 'Raleway' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    style={{ top: '0', height: '100%' }}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                  {/* --- MODIFIED: Added conditional animation style --- */}
                  {errors.confirmPassword && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      background: '#ef4444',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontFamily: 'Raleway',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                      zIndex: 1000,
                      marginTop: '4px',
                      transform: 'translateX(0)',
                      animation: isFading ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                    }}>
                      {errors.confirmPassword}
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '16px',
                        width: '0',
                        height: '0',
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: '4px solid #ef4444'
                      }}></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full max-w-[201px] h-[40px] bg-[#815FB3] shadow-md rounded-lg border-none font-extrabold text-[16px] text-white text-center"
              style={{ fontFamily: 'Raleway', boxShadow: '0px 4px 4px rgba(0,0,0,0.15)', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating Account...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Main Unified Authentication Component
const UnifiedAuth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const successMessage = location.state?.message;
  const { user, token } = useAuth();
  const { updateStep1, registrationData } = useRegistration();

  // Guarantee redirect after login: watch user and token
  useEffect(() => {
    // If authenticated (user or token), always redirect from login page
    if ((user || token) && location.pathname === '/petowner/login') {
      navigate('/chat/new', { replace: true });
    }
    // If token exists and user is not set, force reload (fixes first login delay)
    if (token && !user && location.pathname === '/petowner/login') {
      window.location.reload();
    }
  }, [user, token, location.pathname, navigate]);
  
  // FIXED: Enhanced initial view detection
  const getInitialView = () => {
    const path = location.pathname;
    if (path === 'petwoner/register' || path.startsWith('petowner/register/')) {
      return 'register';
    }
    return 'login';
  };

  const [currentView, setCurrentView] = useState(getInitialView());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  // ADDED: Update view when URL changes (including refresh and browser navigation)
  useEffect(() => {
    const getInitialView = () => {
      const path = location.pathname;
      if (path === '/petowner/register' || path.startsWith('/petowner/register/')) {
        return 'register';
      }
      return 'login';
    };

    const newView = getInitialView();
    // Only update if we're not currently transitioning and the view actually needs to change
    if (newView !== currentView && !isTransitioning) {
      setCurrentView(newView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Only depend on location.pathname to avoid infinite loops

  // ADDED: Handle browser back/forward navigation
  const handlePopState = useCallback(() => {
    const getInitialView = () => {
      const path = window.location.pathname;
      if (path === '/petowner/register' || path.startsWith('/petowner/register/')) {
        return 'register';
      }
      return 'login';
    };

    const newView = getInitialView();
    // Force update regardless of transition state for browser navigation
    setCurrentView(newView);
    // Reset transition state if browser navigation happened during transition
    if (isTransitioning) {
      setIsTransitioning(false);
    }
  }, [isTransitioning]);

  useEffect(() => {
    // Listen for browser back/forward button
    window.addEventListener('popstate', handlePopState);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState]);

  // Handle smooth transitions between login and register with slide-and-fade effect
  const switchToRegister = () => {
    if (isTransitioning || currentView === 'register') return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentView('register');
      // Update URL after view change to prevent conflicts
      window.history.pushState(null, '', '/petowner/register');
      setTimeout(() => {
        setIsTransitioning(false);
      }, 700); // Wait for animation to complete
    }, 50);
  };

  const switchToLogin = () => {
    if (isTransitioning || currentView === 'login') return;
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentView('login');
      // Update URL after view change to prevent conflicts
      window.history.pushState(null, '', '/petowner/login');
      setTimeout(() => {
        setIsTransitioning(false);
      }, 700); // Wait for animation to complete
    }, 50);
  };

  // Handle login submission
  const handleLoginSubmit = async (formData) => {
    setLoading(true);
    try {
      const result = await login({ 
        email: formData.email,
        password: formData.password 
      });
      
      if (result.success) {
        // FIX: Navigate immediately upon success. 
        navigate('/chat/new', { replace: true });
      } else {
        throw new Error(result.error || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle register submission

  const handleRegisterSubmit = async (formData) => {
    setLoading(true);
    try {
      // Save step 1 data using registration context
      updateStep1({
        username: formData.username,
        email: formData.email,
        password1: formData.password1,
        password2: formData.password2
      });
      
  // Navigate to step 2 of registration
  navigate('/petowner/register/step2');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E6D6F7] flex items-center justify-center p-0 md:p-4">
      {/* Desktop/Tablet Layout */}
      <div className="hidden md:block w-full max-w-6xl bg-[#FFFFF2] shadow-xl overflow-hidden" style={{ borderRadius: '30px' }}>
        <div className="p-6">
          <div className="flex flex-row min-h-[600px] relative">
            {/* Left Slot - Login Form */}
            <div style={{ width: '150%' }} className="flex items-center justify-center relative">
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${currentView === 'login' ? 'opacity-100' : 'opacity-0'}`} style={{ pointerEvents: currentView === 'login' ? 'auto' : 'none' }}>
                <LoginForm 
                  onSwitchToRegister={switchToRegister}
                  successMessage={successMessage}
                  onSubmit={handleLoginSubmit}
                  loading={loading}
                />
              </div>
            </div>
            {/* Right Slot - Register Form */}
            <div style={{ width: '150%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: '32px' }}>
              <div className={`w-full h-full flex items-center justify-start transition-opacity duration-700 ease-in-out ${currentView === 'register' ? 'opacity-100' : 'opacity-0'}`} style={{ pointerEvents: currentView === 'register' ? 'auto' : 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <RegisterForm 
                  onSwitchToLogin={switchToLogin}
                  onSubmit={handleRegisterSubmit}
                  loading={loading}
                  initialData={registrationData.step1}
                />
              </div>
            </div>
            {/* Purple Carousel - Desktop only */}
            <div className="absolute flex items-center justify-center transition-all duration-700 ease-in-out" style={{ width: '40%', height: '100%', left: currentView === 'login' ? '60%' : '0%', zIndex: 10 }}>
              <PurpleCarousel />
            </div>
          </div>
        </div>
      </div>
      {/* Mobile Layout */}
        <div className="block md:hidden w-full max-w-xs mx-auto">
          {/* FIX 1: Always use purple background.
            FIX 2: Changed 'items-center' to 'items-start' and added 'pt-16' (padding-top) 
                    to move the card near the top, not the center.
          */}
          <div className="min-h-screen flex items-start justify-center pt-16" style={{ background: '#E6D6F7' }}>
            {/* FIX 3: Removed 'style={{ minHeight: '520px' }}'. 
                     The card's height is now 'auto' and will shrink-wrap its content.
            */}
            <div className="bg-white rounded-2xl shadow-lg px-4 py-6 flex flex-col items-center w-full">
              {/* Shared logo/header for both login and register step 1 */}
              <div className="inline-flex items-center justify-center w-full mb-6">
                <img src="/pat-removebg-preview 2.png" alt="PawPal Logo" className="w-20 h-20 mr-2" />
                <h1 className="font-museomoderno font-black text-[32px] leading-[100%] tracking-[0%]" style={{ color: '#815FB3' }}>
                  PAWPAL
                </h1>
              </div>
              {/* Only show sign up prompt in login view */}
              {currentView === 'login' && (
                <div className="w-full text-center mb-4">
                  <span style={{ fontFamily: 'Raleway', fontSize: '16px', color: '#333', fontWeight: 400 }}>
                    Don&apos;t have an account yet?{' '}
                  </span>
                  <button
                    onClick={switchToRegister}
                    className="ml-1 font-bold"
                    style={{
                      fontFamily: 'Raleway',
                      fontSize: '16px',
                      color: '#815FB3',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: 700
                    }}
                  >
                    Sign Up
                  </button>
                </div>
              )}
              {/* Form area */}
              <div className="w-full">
                {currentView === 'login' ? (
                  <LoginForm
                    onSwitchToRegister={switchToRegister}
                    successMessage={successMessage}
                    onSubmit={handleLoginSubmit}
                    loading={loading}
                  />
                ) : (
                  // Register step 1 mobile view:
                  // We only need to render the RegisterForm component.
                  // It already contains its own header.
                  <RegisterForm
                    onSwitchToLogin={switchToLogin}
                    onSubmit={handleRegisterSubmit}
                    loading={loading}
                    initialData={registrationData.step1}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default UnifiedAuth;
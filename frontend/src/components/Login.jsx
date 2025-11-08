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
    <div className="bg-[#815FB3] text-white w-full" 
         style={{ 
           borderRadius: '20px', 
           position: 'relative', 
           padding: '10%',
           height: '600px',
           display: 'flex',
           flexDirection: 'column',
           justifyContent: 'flex-start',
           alignItems: 'center',
           overflow: 'visible'
         }}>
      
      {/* FIXED SHARED LOGO - Always visible at top */}
      <div className="mb-8" style={{ flexShrink: 0 }}>
        <div className="inline-flex items-center justify-center w-full">
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
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
      return;
    }
    setErrors({});
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col justify-center h-full px-8">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-[30px] font-bold leading-[100%] tracking-[5%] text-center mb-2"
              style={{ fontFamily: 'Raleway' }}>
            Sign In
          </h2>
          <p className="text-[18px] font-light leading-[100%] tracking-[0%] text-center"
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
        
        {/* Only show top Alert for general/server errors, not for field validation */}
        {error && (
          <Alert type="error" message={error} onClose={() => setError('')} />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%] placeholder-gray-400"
                style={{ fontFamily: 'Raleway' }}
                placeholder="your@email.com"
              />
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
                    animation: 'errorPop 0.3s ease-out'
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
                className="w-full px-0 py-2 pr-10 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%] placeholder-gray-400"
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
                  animation: 'errorPop 0.3s ease-out'
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
              className="bg-[#815FB3] hover:bg-[#6d4a96] text-white font-medium py-3 px-16 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
const RegisterForm = ({ onSwitchToLogin, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear specific error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
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
        `}
      </style>
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '1rem',
          background: '#FFFFF2',  // This is the correct beige background
          transform: 'translateX(-30%)'
        }}
      >
      {/* This wrapper ensures the form has a max width and holds all content */}
      <div style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}>
        
        {/* Header Section - All text is centered */}
        <div style={{ textAlign: 'center', marginBottom: '1.215rem' }}>
          <h2 style={{
            fontFamily: 'Raleway',
            fontWeight: 700,
            fontSize: '30px',
            color: '#34113F',
            marginBottom: '0.81rem'
          }}>
            Get Started
          </h2>
          
          <p style={{
            fontFamily: 'Raleway',
            fontSize: '18px',
            color: '#666666',
            marginBottom: '1.215rem'
          }}>
            Already have an account?{' '}
            <span 
              onClick={onSwitchToLogin}
              style={{
                fontFamily: 'Raleway',
                fontWeight: 700,
                fontSize: '18px',
                color: '#34113F',
                cursor: 'pointer'
              }}
            >
              Sign In
            </span>
          </p>
          
          <h3 style={{
            fontFamily: 'Raleway',
            fontWeight: 700,
            fontSize: '18px',
            color: '#34113F',
            marginBottom: '0'
          }}>
            1 ) Account Information
          </h3>
        </div>

        {errors.general && (
          <div style={{ marginBottom: '1.215rem' }}>
            <Alert type="error" message={errors.general} onClose={() => setErrors({ ...errors, general: '' })} />
          </div>
        )}

        {/* Form Fields - All left-aligned */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '0.81rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6075rem' }}>
            
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'Raleway',
                fontWeight: 300,
                fontSize: '16px',
                color: '#666666',
                marginBottom: '0.405rem'
              }}>
                Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    minWidth: '320px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: '2px solid #34113F',
                    outline: 'none',
                    fontFamily: 'Raleway',
                    fontSize: '16px',
                    color: '#000000',
                    padding: '0.405rem 0',
                    boxSizing: 'border-box'
                  }}
                  required
                />
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
                    animation: 'errorPop 0.3s ease-out'
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
              <label style={{
                display: 'block',
                fontFamily: 'Raleway',
                fontWeight: 300,
                fontSize: '16px',
                color: '#666666',
                marginBottom: '0.405rem'
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    minWidth: '320px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: '2px solid #34113F',
                    outline: 'none',
                    fontFamily: 'Raleway',
                    fontSize: '16px',
                    color: '#000000',
                    padding: '0.405rem 0',
                    boxSizing: 'border-box'
                  }}
                  required
                />
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
                    animation: 'errorPop 0.3s ease-out'
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
              <label style={{
                display: 'block',
                fontFamily: 'Raleway',
                fontWeight: 300,
                fontSize: '16px',
                color: '#666666',
                marginBottom: '0.405rem'
              }}>
                Password
              </label>
              <div style={{ position: 'relative', minWidth: '320px' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: '2px solid #34113F',
                    outline: 'none',
                    fontFamily: 'Raleway',
                    fontSize: '16px',
                    color: '#000000',
                    padding: '0.405rem 0',
                    boxSizing: 'border-box',
                    paddingRight: '2.5rem'
                  }}
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
                    animation: 'errorPop 0.3s ease-out'
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
              <label style={{
                display: 'block',
                fontFamily: 'Raleway',
                fontWeight: 300,
                fontSize: '16px',
                color: '#666666',
                marginBottom: '0.405rem'
              }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative', minWidth: '320px' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    minWidth: '320px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: '2px solid #34113F',
                    outline: 'none',
                    fontFamily: 'Raleway',
                    fontSize: '16px',
                    color: '#000000',
                    padding: '0.405rem 0',
                    boxSizing: 'border-box',
                    paddingRight: '2.5rem'
                  }}
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
                    animation: 'errorPop 0.3s ease-out'
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

            {/* Show Password checkbox removed, eye icon is sufficient */}
          </div>
        </form>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '201px',
              height: '40px',
              background: '#815FB3',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              fontFamily: 'Raleway',
              fontWeight: 800,
              fontSize: '16px',
              textAlign: 'center',
              color: '#FFFFFF'
            }}
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
  
  // FIXED: Enhanced initial view detection
  const getInitialView = () => {
    const path = location.pathname;
    if (path === '/register' || path.startsWith('/register/')) {
      return 'register';
    }
    return 'login';
  };

  const [currentView, setCurrentView] = useState(getInitialView());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { updateStep1 } = useRegistration();

  // ADDED: Update view when URL changes (including refresh and browser navigation)
  useEffect(() => {
    const getInitialView = () => {
      const path = location.pathname;
      if (path === '/register' || path.startsWith('/register/')) {
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
      if (path === '/register' || path.startsWith('/register/')) {
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
      window.history.pushState(null, '', '/register');
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
      window.history.pushState(null, '', '/login');
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
        email: formData.email, // Changed from username to email
        password: formData.password 
      });
      
      if (result.success) {
        navigate('/chat');
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
      navigate('/register/step2');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D8CAED] flex items-center justify-center p-4">
      <div className="max-w-6xl w-full bg-[#FFFFF2] shadow-xl overflow-hidden" 
           style={{ borderRadius: '30px' }}>
        <div className="p-6">
          <div className="flex flex-row min-h-[600px] relative">
            
            {/* Left Slot - ONLY Login Form */}
            <div style={{ width: '60%' }} className="flex items-center justify-center relative">
              {/* Login Form - Always in left slot, fades in/out based on state */}
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                  currentView === 'login' ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ pointerEvents: currentView === 'login' ? 'auto' : 'none' }}
              >
                <LoginForm 
                  onSwitchToRegister={switchToRegister}
                  successMessage={successMessage}
                  onSubmit={handleLoginSubmit}
                  loading={loading}
                />
              </div>
            </div>

            {/* Right Slot - ONLY Register Form */}
            <div style={{ width: '40%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Register Form - Always in right slot, fades in/out based on state */}
              <div 
                className={`w-full h-full flex items-center justify-center transition-opacity duration-700 ease-in-out ${
                  currentView === 'register' ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ 
                  pointerEvents: currentView === 'register' ? 'auto' : 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              >
                <RegisterForm 
                  onSwitchToLogin={switchToLogin}
                  onSubmit={handleRegisterSubmit}
                  loading={loading}
                />
              </div>
            </div>

            {/* Purple Carousel - Slides between left and right positions */}
            <div 
              className="absolute flex items-center justify-center transition-all duration-700 ease-in-out"
              style={{
                width: '40%',
                height: '100%',
                left: currentView === 'login' ? '60%' : '0%', // Slide between right (60%) and left (0%) positions
                zIndex: 10
              }}
            >
              <PurpleCarousel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedAuth;




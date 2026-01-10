import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import pawIcon from '../Assets/Images/paw-icon.png';
import pawBullet from '../Assets/Images/paw.png';
import phLocations from '../data/ph_locations.json';
import { useRegistration } from '../context/RegistrationContext';
import { authService } from '../services/api';
import Alert from './Alert';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import SignupConfirmationModal from './SignupConfirmationModal';
import CustomDropdown from './CustomDropdown';

// Reusable Carousel Component (same as Login)
const PurpleCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');

  // Handle smooth slide transitions
  const handleSlideChange = useCallback((newSlide) => {
    if (newSlide !== currentSlide) {
      setFadeClass('opacity-0');
      setTimeout(() => {
        setCurrentSlide(newSlide);
        setFadeClass('opacity-100');
      }, 300);
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
    <div className="bg-[#815FB3] text-white w-full rounded-2xl relative p-4 md:p-10 min-h-[400px] md:min-h-[600px] flex flex-col justify-start items-center overflow-visible">
      
      {/* FIXED SHARED LOGO - Always visible at top */}
      <div className="mb-4 md:mb-8 flex-shrink-0">
        <div className="inline-flex items-center justify-center w-full">
          {pawIcon ? (
            <img src={pawIcon} alt="Paw" className="w-12 h-12 md:w-20 md:h-20" />
          ) : (
            <span className="text-3xl md:text-5xl mr-2 md:mr-3">🐾</span>
          )}
          <h1 className="text-[#FFF07B] font-museo font-black text-xl md:text-[49px] leading-[100%] tracking-[0%]">
            PAWPAL
          </h1>
        </div>
      </div>

      {/* CAROUSEL CONTENT AREA - Only content below logo changes */}
      <div className="flex-1 w-full" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className={`transition-opacity duration-300 ${fadeClass}`}>
          {currentSlide === 0 ? (
            // Slide 1: Health companion content (without logo)
            <>
              <h2 className="text-base md:text-[24px] font-bold leading-[100%] tracking-[0%] mb-2 md:mb-6 text-center"
                  style={{ fontFamily: 'Raleway', color: '#FFFFF2', whiteSpace: 'normal' }}>
                Your pet&apos;s health companion
              </h2>
             
              <div className="text-xs md:text-[17px] font-medium leading-[140%] tracking-[0%] mb-2 md:mb-8 text-center"
                   style={{ fontFamily: 'Raleway', color: '#FFFFF2', whiteSpace: 'normal' }}>
                Get instant answers to your pet health questions, track vaccinations, and receive personalized care recommendations.
              </div>
             
              <div className="flex flex-col items-center gap-2 md:gap-3">
                <div className="flex items-center w-full max-w-xs md:max-w-sm">
                  {pawBullet ? (
                    <img src={pawBullet} alt="Paw" className="w-4 h-4 md:w-6 md:h-6 transform rotate-45 mr-2 md:mr-3" />
                  ) : (
                    <span className="text-yellow-400 text-lg mr-2 md:mr-3">🐾</span>
                  )}
                  <span className="text-xs md:text-lg font-medium leading-[100%] tracking-[0%]" style={{ fontFamily: 'Raleway', color: '#FFFFF2' }}>
                    24/7 Pet Health Support
                  </span>
                </div>
                <div className="flex items-center w-full max-w-xs md:max-w-sm">
                  {pawBullet ? (
                    <img src={pawBullet} alt="Paw" className="w-4 h-4 md:w-6 md:h-6 transform rotate-45 mr-2 md:mr-3" />
                  ) : (
                    <span className="text-yellow-400 text-lg mr-2 md:mr-3">🐾</span>
                  )}
                  <span className="text-xs md:text-lg font-medium leading-[100%] tracking-[0%]" style={{ fontFamily: 'Raleway', color: '#FFFFF2' }}>
                    Personalized Care
                  </span>
                </div>
                <div className="flex items-center w-full max-w-xs md:max-w-sm">
                  {pawBullet ? (
                    <img src={pawBullet} alt="Paw" className="w-4 h-4 md:w-6 md:h-6 transform rotate-45 mr-2 md:mr-3" />
                  ) : (
                    <span className="text-yellow-400 text-lg mr-2 md:mr-3">🐾</span>
                  )}
                  <span className="text-xs md:text-lg font-medium leading-[100%] tracking-[0%]" style={{ fontFamily: 'Raleway', color: '#FFFFF2' }}>
                    Track Vaccinations and Medications
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
      <div className="flex justify-center gap-2 absolute left-1/2 -translate-x-1/2 bottom-4">
        <button
          onClick={() => handleSlideChange(0)}
          className={`transition-all duration-300 ${currentSlide === 0 ? 'w-6 h-2 bg-[#642A77] rounded-full' : 'w-2 h-2 bg-[#642A77] rounded-full hover:bg-[#7A3A87]'}`}
        />
        <button
          onClick={() => handleSlideChange(1)}
          className={`transition-all duration-300 ${currentSlide === 1 ? 'w-6 h-2 bg-[#642A77] rounded-full' : 'w-2 h-2 bg-[#642A77] rounded-full hover:bg-[#7A3A87]'}`}
        />
      </div>
    </div>
  );
};

// Register Step 2 Form Component
const RegisterStep2Form = ({ onSubmit, loading, setShowTerms, setShowPrivacy }) => {
  const { registrationData, updateStep2 } = useRegistration();
  const [formData, setFormData] = useState({
    ...registrationData.step2,
    terms_agreement: false,
    phone_number: registrationData.step2.phone_number || ''
  });
  const [errors, setErrors] = useState({});
  // Fade state for field error bubbles
  const [isFading, setIsFading] = useState(false);
  const [isAlertFading, setIsAlertFading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
    }
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/[^\d]/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val && !val.startsWith('09')) {
      val = '09' + val.substring(2);
    }
    setFormData(prevData => ({ ...prevData, phone_number: val }));
    if (errors.phone_number) {
      setErrors(prevErrors => ({ ...prevErrors, phone_number: '' }));
    }
  };

  // --- NEW: fade timers for field errors (3s visible, then fade)
  useEffect(() => {
    const fieldErrorKeys = Object.keys(errors).filter(k => k !== 'general');
    if (fieldErrorKeys.length > 0) {
      setIsFading(false);
      const fadeTimer = setTimeout(() => setIsFading(true), 2700);
      const clearTimer = setTimeout(() => {
        setErrors(prev => ({ general: prev.general }));
        setIsFading(false);
      }, 3000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors = {};
    const phone = formData.phone_number.trim();
    const phRegex = /^09\d{9}$/;
    if (!phone) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!phRegex.test(phone)) {
      newErrors.phone_number = 'Enter a valid Philippine phone number (09XXXXXXXXX)';
    }
    if (!formData.province) {
      newErrors.province = 'Province is required';
    }
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    // clinic_agreement removed — only terms_agreement is required now
    if (!formData.terms_agreement) {
      newErrors.terms_agreement = 'You must agree to the Terms and Conditions and Privacy Policy';
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
    updateStep2(formData);
    try {
      await onSubmit(formData);
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    }
  };

  const provinces = Object.keys(phLocations);
  const selectedProvince = formData.province;
  const cities = selectedProvince ? phLocations[selectedProvince] : [];

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      {/* Keyframes used by the error bubble animations */}
      <style>{`
        @keyframes errorPop { 0% { opacity: 0; transform: translateY(-10px) scale(0.8); } 50% { transform: translateY(2px) scale(1.05); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes errorFadeOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-10px) scale(0.8); } }
      `}</style>
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-5">
          <div className="text-left mb-4">
            <button
              type="button"
              onClick={() => navigate('/petowner/register', { replace: true })}
              className="font-raleway font-bold text-lg text-[#34113F] bg-transparent border-none p-0 cursor-pointer"
            >
              &larr; Back
            </button>
          </div>
          <h3 className="font-raleway font-bold text-xl text-[#34113F] mb-0">
            2) Contact Information
          </h3>
        </div>
        {errors.general && (
          <div className="mb-5">
            <Alert type="error" message={errors.general} onClose={() => setErrors({ ...errors, general: '' })} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="mb-3">
          <div className="flex flex-col gap-4">
            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block font-raleway font-light text-base text-gray-600 mb-2">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handlePhoneChange}
                  className="w-full font-raleway text-base px-0 py-2 bg-transparent border-none focus:outline-none"
                  style={{ borderBottom: '2px solid #34113F', color: '#000000', boxSizing: 'border-box', borderRadius: 0 }}
                  placeholder="09XXXXXXXXX"
                  required
                />
                {errors.phone_number && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    bottom: '-44px',
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
                    {errors.phone_number}
                    <div style={{ position: 'absolute', top: '-8px', right: '16px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #ef4444' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Province/City */}
            <div className="grid grid-cols-2 gap-3">
              {/* Province */}
              <div>
                <label htmlFor="province" className="block font-raleway font-light text-base text-gray-600 mb-2">Province</label>
                <div style={{ position: 'relative' }}>
                  <CustomDropdown
                    id="province"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    options={provinces}
                    placeholder="Province"
                  />
                {errors.province && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    bottom: '-44px',
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
                    {errors.province}
                    <div style={{ position: 'absolute', top: '-8px', right: '16px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #ef4444' }} />
                  </div>
                )}
                </div>
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block font-raleway font-light text-base text-gray-600 mb-2">City</label>
                <div style={{ position: 'relative' }}>
                <CustomDropdown
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  options={cities}
                  placeholder="City"
                  disabled={!formData.province}
                />
                {errors.city && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    bottom: '-44px',
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
                    {errors.city}
                    <div style={{ position: 'absolute', top: '-8px', right: '16px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #ef4444' }} />
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Checkboxes: only Terms & Privacy agreement is required now */}
            <div className="flex flex-col gap-3 mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms_agreement"
                  name="terms_agreement"
                  checked={formData.terms_agreement || false}
                  onChange={handleChange}
                  className="accent-[#34113F] w-5 h-5 rounded border border-[#34113F] md:shrink-0"
                  required
                />
                <label 
                  htmlFor="terms_agreement"
                  className="font-raleway text-base text-black cursor-pointer select-none"
                >
                  I confirm that I have read and agree to the{' '}
                  <span
                    style={{ color: '#815FB3', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={e => {
                      e.preventDefault();
                      setShowTerms(true);
                    }}
                  >
                    Terms and Conditions
                  </span>{' '}and{' '}
                  <span
                    style={{ color: '#815FB3', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={e => {
                      e.preventDefault();
                      setShowPrivacy(true);
                    }}
                  >
                    Privacy Policy
                  </span>{' '}of this website.
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                {errors.terms_agreement && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    bottom: '-20px',
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
                    {errors.terms_agreement}
                    <div style={{ position: 'absolute', top: '-8px', right: '16px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid #ef4444' }} />
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
            className="w-full max-w-[240px] h-12 bg-[#815FB3] shadow-md rounded-lg border-none font-raleway font-extrabold text-lg text-white text-center disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)' }}
          >
            {loading ? 'Creating Account...' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RegisterStep2 = () => {
  const { registrationData, clearData } = useRegistration();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  // Redirect if step 1 is not completed
  useEffect(() => {
    // If user hasn't completed step1 and registration has not just succeeded, redirect back to step1
    if (!registrationData.step1.username && !isSuccess) {
      navigate('/petowner/register', { replace: true });
    }
  }, [registrationData.step1.username, navigate, isSuccess]);

  // Fade in effect on component mount
  useEffect(() => {
    setFadeOut(false);
  }, []);

  const handleSubmit = async (formData) => {
    setError('');
    setLoading(true);
    
    // Send all data in one request to match Django backend expectations
    // Construct name from username (capitalize first letter)
    const username = registrationData.step1.username;
    const name = username ? username.charAt(0).toUpperCase() + username.slice(1) : '';
    
    const completeData = {
      // User data (required by UserRegistrationSerializer)
      name: name, // Use name field (backend will split into first_name/last_name)
      username: username,
      email: registrationData.step1.email,
      password: registrationData.step1.password1,
      password_confirm: registrationData.step1.password2,
      
      // UserProfile data (will be handled by the view)
      phone_number: formData.phone_number,
      province: formData.province,
      city: formData.city,
      address: formData.address || ''
    };
    
    console.log('Complete registration data being sent:', completeData);
    
    try {
      // Use the registration endpoint (OTP verification temporarily disabled - accounts are created active)
      await authService.registerWithOtp(completeData);

      // Mark success so the safety redirect doesn't fire, then show confirmation modal
      navigate('/verify-email', { 
        state: { 
          email: registrationData.step1.email,
          purpose: 'account_creation' 
        } 
      });
    } catch (err) {
      const apiErrors = err?.response?.data?.error || err?.response?.data;
      if (apiErrors) {
        if (typeof apiErrors === 'object') {
          const errorMessages = Object.values(apiErrors).flat();
          setError(errorMessages.join(', ') || 'Registration failed. Please try again.');
        } else {
          setError(apiErrors || 'Registration failed. Please try again.');
        }
      } else {
        setError(err?.message || 'Registration failed. Please try again.');
      }
    }
    
    setLoading(false);
  };

  // Called when the confirmation modal closes (after its internal timer)
  const handleFinalRedirect = () => {
    setShowConfirmation(false);
    setFadeOut(true);
    setTimeout(() => {
      clearData();
      navigate('/petowner/login', {
        state: { message: 'Registration successful! You can now log in.' },
        replace: true
      });
    }, 500);
  };

  return (
    <div className={`min-h-screen bg-[#D8CAED] transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Desktop layout: carousel + form */}
      <div className="hidden md:flex items-center justify-center min-h-screen p-4">
        <div className="max-w-6xl w-full bg-[#FFFFF2] shadow-xl overflow-hidden" style={{ borderRadius: '30px' }}>
          <div className="p-6">
            <div className="flex flex-row min-h-[600px] relative">
              <div className="absolute flex items-center justify-center transition-all duration-700 ease-in-out" style={{ width: '40%', height: '100%', left: '0%', zIndex: 10 }}>
                <PurpleCarousel />
              </div>
              <div style={{ width: '60%', marginLeft: '40%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="w-full h-full flex items-center justify-center" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                  {error && (
                    <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 1001 }}>
                      <Alert type="error" message={error} onClose={() => setError('')} />
                    </div>
                  )}
                  <RegisterStep2Form 
                    onSubmit={handleSubmit}
                    loading={loading}
                    setShowTerms={setShowTerms}
                    setShowPrivacy={setShowPrivacy}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile layout: centered white card */}
      <div className="block md:hidden w-full">
        <div className="min-h-screen flex items-start justify-center pt-16" style={{ background: 'transparent' }}>
          <div className="bg-white rounded-2xl shadow-lg px-4 py-8 flex flex-col items-center w-full max-w-xs mx-auto">
            {error && (
              <div className="w-full mb-4">
                <Alert type="error" message={error} onClose={() => setError('')} />
              </div>
            )}
            <RegisterStep2Form 
              onSubmit={handleSubmit}
              loading={loading}
              setShowTerms={setShowTerms}
              setShowPrivacy={setShowPrivacy}
            />
          </div>
        </div>
      </div>
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {/* Dev-only trigger removed */}
      {/* Confirmation Modal - redirects on close */}
      <SignupConfirmationModal show={showConfirmation} onClose={handleFinalRedirect} />
    </div>
  );
};

export default RegisterStep2;
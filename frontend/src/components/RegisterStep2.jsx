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
    clinic_agreement: false,
    terms_agreement: false,
    phone_number: registrationData.step2.phone_number || ''
  });
  const [errors, setErrors] = useState({});
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
    if (!formData.clinic_agreement) {
      newErrors.clinic_agreement = 'You must confirm that you are a client of Southvalley Veterinary Clinic';
    }
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
              {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
            </div>

            {/* Province/City */}
            <div className="grid grid-cols-2 gap-3">
              {/* Province */}
              <div>
                <label htmlFor="province" className="block font-raleway font-light text-base text-gray-600 mb-2">Province</label>
                <select
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-2 font-raleway text-base appearance-none"
                  style={{ 
                    background: '#815FB3', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    outline: 'none', 
                    cursor: 'pointer',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1em'
                  }}
                  required
                >
                  <option value="" disabled hidden>Province</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block font-raleway font-light text-base text-gray-600 mb-2">City</label>
                <select
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!formData.province}
                  className={`w-full px-3 py-2 font-raleway text-base appearance-none ${!formData.province ? 'opacity-60 cursor-not-allowed' : ''}`}
                  style={{ 
                    background: '#815FB3', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    outline: 'none', 
                    cursor: !formData.province ? 'not-allowed' : 'pointer',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1em'
                  }}
                  required
                >
                  <option value="" disabled hidden>City</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-col gap-3 mt-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clinic_agreement"
                  name="clinic_agreement"
                  checked={formData.clinic_agreement || false}
                  onChange={handleChange}
                  className="accent-[#34113F] w-5 h-5 rounded border border-[#34113F]"
                  required
                />
                <label 
                  htmlFor="clinic_agreement"
                  className="font-raleway text-base text-black cursor-pointer select-none"
                >
                  I confirm that I am a client of Southvalley Veterinary Clinic.
                </label>
              </div>
              {errors.clinic_agreement && <p className="text-red-500 text-xs mt-1 ml-1">{errors.clinic_agreement}</p>}

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
              {errors.terms_agreement && <p className="text-red-500 text-xs mt-1 ml-1">{errors.terms_agreement}</p>}
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
  const navigate = useNavigate();

  // Redirect if step 1 is not completed
  useEffect(() => {
    if (!registrationData.step1.username) {
  navigate('/petowner/register', { replace: true });
    }
  }, [registrationData.step1.username, navigate]);

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
      
      // Fade out before navigation
      setFadeOut(true);
      setTimeout(() => {
        clearData();
        // Navigate to login page after successful registration (OTP verification temporarily disabled)
        navigate('/petowner/login', { 
          state: { 
            message: 'Registration successful! You can now log in.' 
          },
          replace: true
        });
      }, 500); // 500ms fade out duration
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
    </div>
  );
};

export default RegisterStep2;
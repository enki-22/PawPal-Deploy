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
        <div className={`transition-opacity duration-300 ${fadeClass}`}>
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
          className={`transition-all duration-300 ${
            currentSlide === 0 
              ? 'w-6 h-2 bg-[#642A77] rounded-full' 
              : 'w-2 h-2 bg-[#642A77] rounded-full hover:bg-[#7A3A87]'
          }`}
        />
        <button
          onClick={() => handleSlideChange(1)}
          className={`transition-all duration-300 ${
            currentSlide === 1 
              ? 'w-6 h-2 bg-[#642A77] rounded-full' 
              : 'w-2 h-2 bg-[#642A77] rounded-full hover:bg-[#7A3A87]'
          }`}
        />
      </div>
    </div>
  );
};

// Register Step 2 Form Component
const RegisterStep2Form = ({ onSubmit, loading, setShowTerms, setShowPrivacy }) => {
  // Custom dropdown state
  const [provinceDropdownOpen, setProvinceDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const { registrationData, updateStep2 } = useRegistration();
  const [formData, setFormData] = useState({
    ...registrationData.step2,
    clinic_agreement: false,
    terms_agreement: false
  });
  const [errors, setErrors] = useState({});
  // Timer state for error fade-out (track which error is fading)
  const [fadeState, setFadeState] = useState({
    phone_number: false,
    province: false,
    city: false,
    clinic_agreement: false,
    terms_agreement: false
  });
  // Unique key to force error bubble re-render
  const [errorKey, setErrorKey] = useState(0);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    // Clear specific error when user starts typing/checking
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const phone = formData.phone_number.trim();
    // Philippines phone number regex: only 09XXXXXXXXX
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
      // Start fade-out for all errors
      const fadeFields = {};
      Object.keys(newErrors).forEach(field => {
        fadeFields[field] = false;
      });
      setFadeState(prev => ({ ...prev, ...fadeFields }));
      setErrorKey(prev => prev + 1); // force re-render
      setTimeout(() => {
        const fadeFields = {};
        Object.keys(newErrors).forEach(field => {
          fadeFields[field] = true;
        });
        setFadeState(prev => ({ ...prev, ...fadeFields }));
      }, 2700);
      setTimeout(() => {
        setErrors(prev => {
          const cleared = { ...prev };
          Object.keys(newErrors).forEach(field => {
            cleared[field] = undefined;
          });
          return cleared;
        });
        const resetFields = {};
        Object.keys(newErrors).forEach(field => {
          resetFields[field] = false;
        });
        setFadeState(prev => ({ ...prev, ...resetFields }));
      }, 3000);
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

  // Get all provinces from phLocations
  const provinces = Object.keys(phLocations);
  // Cities for selected province
  const selectedProvince = formData.province;
  const cities = selectedProvince ? phLocations[selectedProvince] : [];

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
      <div 
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '1rem',
          background: '#FFFFF2',  // This is the correct beige background
          transform: 'translateX(0%)'
        }}
      >
        {/* This wrapper ensures the form has a max width and holds all content */}
        <div style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
          
          {/* Header Section - All text is centered */}
          <div style={{ textAlign: 'center', marginBottom: '1.276rem' }}>
            {/* Back Button */}
            <div style={{ textAlign: 'left', marginBottom: '1.05rem' }}>
              <button
                type="button"
                onClick={() => {
                  // Use navigate with replace:true to prevent browser back to step 2
                  const nav = window.history;
                  if (typeof nav.pushState === 'function') {
                    // fallback for react-router
                    window.location.replace('/petowner/register');
                  } else {
                    // Use react-router navigate if available
                    if (typeof window.navigate === 'function') {
                      window.navigate('/petowner/register', { replace: true });
                    }
                  }
                }}
                style={{
                  fontFamily: 'Raleway',
                  fontWeight: 700,
                  fontSize: '19.2px',
                  color: '#34113F',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0
                }}
              >
                ← Back
              </button>
            </div>

            <h3 style={{
              fontFamily: 'Raleway',
              fontWeight: 700,
              fontSize: '21.6px',
              color: '#34113F',
              marginBottom: '0'
            }}>
              2) Contact Information
            </h3>
          </div>

          {errors.general && (
            <div style={{ marginBottom: '1.276rem' }}>
              <Alert type="error" message={errors.general} onClose={() => setErrors({ ...errors, general: '' })} />
            </div>
          )}

          {/* Form Fields - All left-aligned */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '0.851rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.638rem' }}>
              
              <div>
                <label style={{
                  display: 'block',
                  fontFamily: 'Raleway',
                  fontWeight: 300,
                  fontSize: '19.2px',
                  color: '#666666',
                  marginBottom: '0.425rem'
                }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={e => {
                      // Only allow numbers, max 11 digits, must start with 09
                      let val = e.target.value.replace(/[^\d]/g, '');
                      if (val.length > 11) val = val.slice(0, 11);
                      if (val && !val.startsWith('09')) val = '09';
                      setFormData({ ...formData, phone_number: val });
                      if (errors.phone_number) {
                        setErrors({ ...errors, phone_number: '' });
                      }
                    }}
                    style={{
                      width: '100%',
                      minWidth: '384px',
                      border: 'none',
                      background: 'transparent',
                      borderBottom: '2px solid #34113F',
                      outline: 'none',
                      fontFamily: 'Raleway',
                      fontSize: '19.2px',
                      color: '#000000',
                      padding: '0.425rem 0',
                      boxSizing: 'border-box'
                    }}
                    placeholder="09XXXXXXXXX"
                    required
                  />
                  {errors.phone_number && (
                    <div
                      key={errorKey + 1}
                      style={{
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
                        animation: fadeState.phone_number ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                      }}
                    >
                      {errors.phone_number}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.638rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Raleway',
                    fontWeight: 300,
                    fontSize: '19.2px',
                    color: '#666666',
                    marginBottom: '0.425rem'
                  }}>
                    Province
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div
                      tabIndex={0}
                      style={{
                        width: '100%',
                        minWidth: '186px',
                        padding: '0.425rem 0.5rem',
                        background: '#815FB3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        outline: provinceDropdownOpen ? '2px solid #34113F' : 'none',
                        fontFamily: 'Raleway',
                        fontSize: '19.2px',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 2
                      }}
                      onClick={() => setProvinceDropdownOpen(open => !open)}
                      onBlur={() => setTimeout(() => setProvinceDropdownOpen(false), 150)}
                    >
                      {formData.province || 'Province'}
                      <span style={{ float: 'right', marginLeft: '8px' }}>▼</span>
                    </div>
                    {provinceDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        background: '#815FB3',
                        color: 'white',
                        borderRadius: '0 0 5px 5px',
                        boxShadow: '0 4px 12px rgba(129,95,179,0.15)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 10
                      }}>
                        <div
                          style={{ padding: '0.425rem 0.5rem', cursor: 'pointer', fontFamily: 'Raleway', fontSize: '19.2px', color: '#FFF07B' }}
                          onClick={() => {
                            setFormData({ ...formData, province: '' });
                            setProvinceDropdownOpen(false);
                            handleChange({ target: { name: 'province', value: '' } });
                          }}
                        >Province</div>
                        {provinces.map(province => (
                          <div
                            key={province}
                            style={{ padding: '0.425rem 0.5rem', cursor: 'pointer', fontFamily: 'Raleway', fontSize: '19.2px', background: formData.province === province ? '#642A77' : 'none' }}
                            onClick={() => {
                              setFormData({ ...formData, province });
                              setProvinceDropdownOpen(false);
                              handleChange({ target: { name: 'province', value: province } });
                            }}
                          >{province}</div>
                        ))}
                      </div>
                    )}
                    {errors.province && (
                      <div
                        key={errorKey + 2}
                        style={{
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
                          animation: fadeState.province ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                        }}
                      >
                        {errors.province}
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
                    fontSize: '19.2px',
                    color: '#666666',
                    marginBottom: '0.425rem'
                  }}>
                    City
                  </label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div
                      tabIndex={0}
                      style={{
                        width: '100%',
                        minWidth: '186px',
                        padding: '0.425rem 0.5rem',
                        background: '#815FB3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        outline: cityDropdownOpen ? '2px solid #34113F' : 'none',
                        fontFamily: 'Raleway',
                        fontSize: '19.2px',
                        boxSizing: 'border-box',
                        cursor: formData.province ? 'pointer' : 'not-allowed',
                        position: 'relative',
                        zIndex: 2,
                        opacity: formData.province ? 1 : 0.6
                      }}
                      onClick={() => formData.province && setCityDropdownOpen(open => !open)}
                      onBlur={() => setTimeout(() => setCityDropdownOpen(false), 150)}
                    >
                      {formData.city || 'City'}
                      <span style={{ float: 'right', marginLeft: '8px' }}>▼</span>
                    </div>
                    {cityDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        background: '#815FB3',
                        color: 'white',
                        borderRadius: '0 0 5px 5px',
                        boxShadow: '0 4px 12px rgba(129,95,179,0.15)',
                        maxHeight: '180px',
                        overflowY: 'auto',
                        zIndex: 10
                      }}>
                        <div
                          style={{ padding: '0.425rem 0.5rem', cursor: 'pointer', fontFamily: 'Raleway', fontSize: '19.2px', color: '#FFF07B' }}
                          onClick={() => {
                            setFormData({ ...formData, city: '' });
                            setCityDropdownOpen(false);
                            handleChange({ target: { name: 'city', value: '' } });
                          }}
                        >City</div>
                        {cities.map(city => (
                          <div
                            key={city}
                            style={{ padding: '0.425rem 0.5rem', cursor: 'pointer', fontFamily: 'Raleway', fontSize: '19.2px', background: formData.city === city ? '#642A77' : 'none' }}
                            onClick={() => {
                              setFormData({ ...formData, city });
                              setCityDropdownOpen(false);
                              handleChange({ target: { name: 'city', value: city } });
                            }}
                          >{city}</div>
                        ))}
                      </div>
                    )}
                    {errors.city && (
                      <div
                        key={errorKey + 3}
                        style={{
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
                          animation: fadeState.city ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                        }}
                      >
                        {errors.city}
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

              {/* Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.638rem', marginTop: '0.638rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.638rem', position: 'relative' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      id="clinic_agreement"
                      name="clinic_agreement"
                      checked={formData.clinic_agreement || false}
                      onChange={handleChange}
                      style={{
                        width: '21.6px',
                        height: '21.6px',
                        border: errors.clinic_agreement ? '2px solid #dc2626' : '1px solid #34113F',
                        borderRadius: '5px',
                        margin: 0,
                        marginTop: '2px',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        cursor: 'pointer',
                        backgroundColor: formData.clinic_agreement ? '#34113F' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      required
                    />
                    {formData.clinic_agreement && (
                      <span style={{
                        position: 'absolute',
                        top: '6px',
                        left: '4px',
                        color: '#FFF07B',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        lineHeight: '1'
                      }}>✓</span>
                    )}
                    {/* Error bubble for clinic_agreement */}
                    {errors.clinic_agreement && (
                      <div
                        key={errorKey + 4}
                        style={{
                          position: 'absolute',
                          left: '0',
                          top: '110%',
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
                          animation: fadeState.clinic_agreement ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                        }}
                      >
                        {errors.clinic_agreement}
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          left: '16px',
                          width: '0',
                          height: '0',
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderBottom: '4px solid #ef4444'
                        }}></div>
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="clinic_agreement" 
                    onClick={() => handleChange({ target: { name: 'clinic_agreement', type: 'checkbox', checked: !formData.clinic_agreement } })}
                    style={{
                      fontFamily: 'Raleway',
                      fontSize: '16.8px',
                      color: '#000000',
                      lineHeight: '1.3',
                      cursor: 'pointer',
                      userSelect: 'none',
                      flex: 1
                    }}
                  >
                    I confirm that I am a client of Southvalley Veterinary Clinic.
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.638rem', position: 'relative' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      id="terms_agreement"
                      name="terms_agreement"
                      checked={formData.terms_agreement || false}
                      onChange={handleChange}
                      style={{
                        width: '21.6px',
                        height: '21.6px',
                        border: errors.terms_agreement ? '2px solid #dc2626' : '1px solid #34113F',
                        borderRadius: '5px',
                        margin: 0,
                        marginTop: '2px',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        cursor: 'pointer',
                        backgroundColor: formData.terms_agreement ? '#34113F' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      required
                    />
                    {formData.terms_agreement && (
                      <span style={{
                        position: 'absolute',
                        top: '6px',
                        left: '4px',
                        color: '#FFF07B',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        lineHeight: '1'
                      }}>✓</span>
                    )}
                    {/* Error bubble for terms_agreement */}
                    {errors.terms_agreement && (
                      <div
                        key={errorKey + 5}
                        style={{
                          position: 'absolute',
                          left: '0',
                          top: '110%',
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
                          animation: fadeState.terms_agreement ? 'errorFadeOut 0.3s ease-out forwards' : 'errorPop 0.3s ease-out'
                        }}
                      >
                        {errors.terms_agreement}
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          left: '16px',
                          width: '0',
                          height: '0',
                          borderLeft: '4px solid transparent',
                          borderRight: '4px solid transparent',
                          borderBottom: '4px solid #ef4444'
                        }}></div>
                      </div>
                    )}
                  </div>
                  <label 
                    htmlFor="terms_agreement"
                    onClick={() => handleChange({ target: { name: 'terms_agreement', type: 'checkbox', checked: !formData.terms_agreement } })}
                    style={{
                      fontFamily: 'Raleway',
                      fontSize: '16.8px',
                      color: '#000000',
                      lineHeight: '1.3',
                      cursor: 'pointer',
                      userSelect: 'none',
                      flex: 1
                    }}
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
              </div>
            </div>
          </form>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '241.2px',
                height: '48px',
                background: '#815FB3',
                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                borderRadius: '10px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'Raleway',
                fontWeight: 800,
                fontSize: '19.2px',
                textAlign: 'center',
                color: '#FFFFFF'
              }}
            >
              {loading ? 'Creating Account...' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </>
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
    <div 
      className={`min-h-screen bg-[#D8CAED] flex items-center justify-center p-4 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="max-w-6xl w-full bg-[#FFFFF2] shadow-xl overflow-hidden" 
           style={{ borderRadius: '30px' }}>
        <div className="p-6">
          <div className="flex flex-row min-h-[600px] relative">
            
            {/* Left Slot - Purple Carousel */}
            <div 
              className="absolute flex items-center justify-center transition-all duration-700 ease-in-out"
              style={{
                width: '40%',
                height: '100%',
                left: '0%', // Always on the left for step 2
                zIndex: 10
              }}
            >
              <PurpleCarousel />
            </div>

            {/* Right Slot - Register Step 2 Form */}
            <div style={{ width: '60%', marginLeft: '40%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              >
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
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
    </div>
  );
};

export default RegisterStep2;
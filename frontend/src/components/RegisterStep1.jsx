import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import pawIcon from '../Assets/Images/paw-icon.png';
import pawBullet from '../Assets/Images/paw.png';
import { useRegistration } from '../context/RegistrationContext';
import Alert from './Alert';

const RegisterStep1 = () => {
  const { registrationData, updateStep1 } = useRegistration();
  const [formData, setFormData] = useState(registrationData.step1);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showClinicInfo, setShowClinicInfo] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const navigate = useNavigate();

  // Handle auto-fade for error bubbles (3-second duration)
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setIsFading(false);
      const fadeTimer = setTimeout(() => setIsFading(true), 2700);
      const clearTimer = setTimeout(() => {
        setErrors({});
        setIsFading(false);
      }, 3000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [errors]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    }
  };

  // Add this helper to determine if the form is ready
  const isFormComplete = formData.username.trim() !== '' && 
                         formData.email.trim() !== '' && 
                         formData.password1 !== '' && 
                         formData.password2 !== '';

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password1) {
      newErrors.password1 = 'Password is required';
    } else if (formData.password1.length < 8) {
      newErrors.password1 = 'Must be at least 8 characters';
    }

    if (!formData.password2) {
      newErrors.password2 = 'Please confirm password';
    } else if (formData.password1 !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateStep1(formData);
      // Navigate to step 2 without calling the API
      // The API will be called in RegisterStep2 after collecting all information
      navigate('/register/step2');
    }
  };

  // Reusable error bubble component for consistency
  const ErrorBubble = ({ message }) => (
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
      {message}
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
  );

  return (
    <div className="min-h-screen bg-[#D8CAED] flex items-center justify-center p-2 md:p-4">
      {/* Animation Styles */}
      <style>{`
        @keyframes errorPop { 0% { opacity: 0; transform: translateY(-10px) scale(0.8); } 50% { transform: translateY(2px) scale(1.05); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes errorFadeOut { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-10px) scale(0.8); } }
      `}</style>
      
      <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl w-full bg-[#FFFFF2] rounded-lg shadow-xl overflow-hidden">
        <div className="p-2 md:p-4 lg:p-8">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-2 md:gap-4 lg:gap-8">
            {/* Left Side - PawPal Promotional Panel */}
            <div className="bg-[#815FB3] text-white p-2 md:p-4 lg:p-8 rounded-lg flex flex-col justify-center">
              <div className="text-center">
                {!showClinicInfo ? (
                  <>
                    <div className="mb-2 md:mb-4">
                      <div className="inline-flex items-center">
                        <img src={pawIcon} alt="Paw" className="w-10 h-10 md:w-16 md:h-16 mr-2" />
                        <h1 className="text-[#FFF07B] font-museo font-black text-2xl md:text-[47px] leading-[100%] tracking-[0%]">
                          PAWPAL
                        </h1>
                      </div>
                    </div>
                    
                    <h2 className="text-base md:text-[20px] font-bold leading-[100%] tracking-[0%] text-center mb-2 md:mb-4" 
                        style={{ fontFamily: 'Raleway' }}>
                      Your pet&apos;s health companion
                    </h2>
                    
              <p className="text-sm md:text-[16px] font-medium leading-[100%] tracking-[0%] mb-4 md:mb-8" 
                style={{ fontFamily: 'Raleway' }}>
                      Get instant answers to your pet health questions, track vaccinations, and receive personalized care recommendations.
                    </p>
                    
                    <div className="space-y-2 md:space-y-3 text-left">
                      <div className="flex items-center">
                        <img src={pawBullet} alt="Paw" className="w-4 h-4 md:w-6 md:h-6 mr-2 md:mr-3 transform rotate-45" />
                        <span className="text-xs md:text-[18px] font-medium leading-[100%] tracking-[0%]" 
                              style={{ fontFamily: 'Raleway' }}>
                          24/7 Pet Health Support
                        </span>
                      </div>
                      <div className="flex items-center">
                        <img src={pawBullet} alt="Paw" className="w-4 h-4 md:w-6 md:h-6 mr-2 md:mr-3 transform rotate-45" />
                        <span className="text-xs md:text-[18px] font-medium leading-[100%] tracking-[0%]" 
                              style={{ fontFamily: 'Raleway' }}>
                          Personalized Care
                        </span>
                      </div>
                      <div className="flex items-center">
                        <img src={pawBullet} alt="Paw" className="w-4 h-4 md:w-6 md:h-6 mr-2 md:mr-3 transform rotate-45" />
                        <span className="text-xs md:text-[18px] font-medium leading-[100%] tracking-[0%]" 
                              style={{ fontFamily: 'Raleway' }}>
                          Track Vaccinations and Medications
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="inline-flex items-center">
                        <img src={pawIcon} alt="Paw" className="w-16 h-16 mr-2" />
                        <h1 className="text-[#FFF07B] font-museo font-black text-[47px] leading-[100%] tracking-[0%]">
                          PAWPAL
                        </h1>
                      </div>
                    </div>
                    
                    <div className="w-full bg-white rounded-lg p-6 mx-auto flex items-center justify-center mb-4">
                      <div className="text-[#815FB3] text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="text-2xl mr-2">🐱</div>
                          <div className="border-2 border-[#815FB3] rounded-full w-16 h-16 flex items-center justify-center relative">
                            <div className="text-2xl font-bold">24</div>
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#815FB3] rounded-full"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#815FB3] rounded-full"></div>
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#815FB3] rounded-full"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#815FB3] rounded-full"></div>
                          </div>
                          <div className="text-2xl ml-2">🐱</div>
                        </div>
                        <h3 className="text-[#815FB3] font-bold text-xl mb-1" style={{ fontFamily: 'Raleway' }}>SOUTHVALLEY</h3>
                        <h4 className="text-[#815FB3] font-semibold text-lg mb-1" style={{ fontFamily: 'Raleway' }}>VETERINARY CLINIC</h4>
                        <p className="text-[#815FB3] text-sm" style={{ fontFamily: 'Raleway' }}>24 HOUR CARE FOR YOUR PET</p>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="mt-4 md:mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => setShowClinicInfo(false)}
                    className={`w-8 h-2 rounded-full transition-colors duration-200 ${!showClinicInfo ? 'bg-purple-800' : 'bg-purple-400 hover:bg-purple-300 cursor-pointer'}`}
                  />
                  <button
                    onClick={() => setShowClinicInfo(true)}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${showClinicInfo ? 'bg-[#FFF07B]' : 'bg-purple-400 hover:bg-[#FFF07B] cursor-pointer'}`}
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto flex flex-col h-full">
                
                {/* Section 1: Header (flex-grow: 0) */}
                <div className="text-center" style={{ flexGrow: 0 }}>
                  <h2 className="text-xl md:text-[30px] font-bold leading-[100%] tracking-[5%] text-center mb-2 md:mb-3" 
                      style={{ fontFamily: 'Raleway' }}>
                    Get Started
                  </h2>
                  <p className="text-sm md:text-[18px] font-light leading-[100%] tracking-[0%] text-center mb-2 md:mb-5" 
                     style={{ fontFamily: 'Raleway' }}>
                    Already have an account?{' '}
                    <Link 
                      to="/login" 
                      className="text-gray-900 font-semibold hover:underline"
                    >
                      Sign In
                    </Link>
                  </p>
                  <div 
                    className="text-left mb-2 md:mb-4 text-base md:text-lg font-bold" 
                    style={{ fontFamily: 'Raleway' }}
                  >
                    1 ) Account Information
                  </div>
                </div>

                {/* Section 2: Fields (flex-grow: 1) */}
                <div className="flex flex-col justify-center flex-grow">

                    <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div className="relative">
                      <label className="block text-sm font-light text-[#666666]">Name</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full border-0 border-b-2 border-[#34113F] bg-transparent py-2 outline-none"
                      />
                      {errors.username && <ErrorBubble message={errors.username} />}
                    </div>

                    {/* Email Field */}
                    <div className="relative">
                      <label className="block text-sm font-light text-[#666666]">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full border-0 border-b-2 border-[#34113F] bg-transparent py-2 outline-none"
                      />
                      {errors.email && <ErrorBubble message={errors.email} />}
                    </div>

                    {/* Password Field */}
                    <div className="relative">
                      <label className="block text-sm font-light text-[#666666]">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password1"
                          value={formData.password1}
                          onChange={handleChange}
                          className="w-full border-0 border-b-2 border-[#34113F] bg-transparent py-2 pr-10 outline-none"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2">
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {errors.password1 && <ErrorBubble message={errors.password1} />}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="relative">
                      <label className="block text-sm font-light text-[#666666]">Confirm Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password2"
                        value={formData.password2}
                        onChange={handleChange}
                        className="w-full border-0 border-b-2 border-[#34113F] bg-transparent py-2 outline-none"
                      />
                      {errors.password2 && <ErrorBubble message={errors.password2} />}
                    </div>

                    <div className="mb-2 md:mb-4 flex items-center">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="mr-2"
                      />
                      <label className="text-xs md:text-[15px] font-light" style={{ fontFamily: 'Raleway', color: '#666666' }}>
                        Show Password
                      </label>
                    </div>
                  </form>
                </div>

                {/* Section 3: Button (flex-grow: 0) */}
                <div className="flex justify-center mt-2 md:mt-4">
                  <button 
                    type="submit" 
                    onClick={handleSubmit}
                    disabled={!isFormComplete}
                    className="bg-[#815FB3] hover:bg-[#6d4a96] text-white font-medium py-2 md:py-3 px-6 md:px-16 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-base"
                    style={{ fontFamily: 'Raleway', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)' }}
                  >
                    Next
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStep1;
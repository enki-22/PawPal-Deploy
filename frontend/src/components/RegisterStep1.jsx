import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pawIcon from '../Assets/Images/paw-icon.png';
import pawBullet from '../Assets/Images/paw.png';
import { useRegistration } from '../context/RegistrationContext';
import Alert from './Alert';
import { authService } from '../services/api';

const RegisterStep1 = () => {
  const { registrationData, updateStep1 } = useRegistration();
  const [formData, setFormData] = useState(registrationData.step1);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showClinicInfo, setShowClinicInfo] = useState(false);
  const navigate = useNavigate();

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
      newErrors.password1 = 'Password must be at least 8 characters';
    }

    if (!formData.password2) {
      newErrors.password2 = 'Please confirm your password';
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
      try {
        await authService.registerWithOtp({
          username: formData.username,
          email: formData.email,
          password: formData.password1,
          password_confirm: formData.password2,
          first_name: '',
          last_name: '',
        });
        navigate('/verify-email', { state: { email: formData.email } });
      } catch (err) {
        const apiErrors = err?.response?.data?.error || err?.response?.data;
        const newErrors = {};
        if (apiErrors) {
          if (apiErrors.username) newErrors.username = apiErrors.username?.[0] || 'Invalid username';
          if (apiErrors.email) newErrors.email = apiErrors.email?.[0] || 'Invalid email';
          if (apiErrors.password) newErrors.password1 = apiErrors.password?.[0] || 'Invalid password';
        }
        if (!Object.keys(newErrors).length) newErrors.password1 = 'Registration failed. Please try again.';
        setErrors(newErrors);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#D8CAED] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side - PawPal Promotional Panel */}
            <div className="bg-[#815FB3] text-white p-8 rounded-lg flex flex-col justify-center">
              <div className="text-center">
                {!showClinicInfo ? (
                  <>
                    <div className="mb-4">
                      <div className="inline-flex items-center">
                        <img src={pawIcon} alt="Paw" className="w-16 h-16 mr-2" />
                        <h1 className="text-[#FFF07B] font-museo font-black text-[47px] leading-[100%] tracking-[0%]">
                          PAWPAL
                        </h1>
                      </div>
                    </div>
                    
                    <h2 className="text-[20px] font-bold leading-[100%] tracking-[0%] text-center mb-4" 
                        style={{ fontFamily: 'Raleway' }}>
                      Your pet&apos;s health companion
                    </h2>
                    
                    <p className="text-[16px] font-medium leading-[100%] tracking-[0%] mb-8" 
                       style={{ fontFamily: 'Raleway' }}>
                      Get instant answers to your pet health questions, track vaccinations, and receive personalized care recommendations.
                    </p>
                    
                    <div className="space-y-3 text-left">
                      <div className="flex items-center">
                        <img src={pawBullet} alt="Paw" className="w-6 h-6 mr-3 transform rotate-45" />
                        <span className="text-[18px] font-medium leading-[100%] tracking-[0%]" 
                              style={{ fontFamily: 'Raleway' }}>
                          24/7 Pet Health Support
                        </span>
                      </div>
                      <div className="flex items-center">
                        <img src={pawBullet} alt="Paw" className="w-6 h-6 mr-3 transform rotate-45" />
                        <span className="text-[18px] font-medium leading-[100%] tracking-[0%]" 
                              style={{ fontFamily: 'Raleway' }}>
                          Personalized Care
                        </span>
                      </div>
                      <div className="flex items-center">
                        <img src={pawBullet} alt="Paw" className="w-6 h-6 mr-3 transform rotate-45" />
                        <span className="text-[18px] font-medium leading-[100%] tracking-[0%]" 
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
                
                <div className="mt-8 flex justify-center space-x-2">
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
            <div className="flex flex-col justify-center">
              <div className="max-w-sm mx-auto w-full">
              <div className="text-center mb-8">
                <h2 className="text-[30px] font-bold leading-[100%] tracking-[5%] text-center mb-2" 
                    style={{ fontFamily: 'Raleway' }}>
                  Get Started
                </h2>
                <p className="text-[18px] font-light leading-[100%] tracking-[0%] text-center mb-4" 
                   style={{ fontFamily: 'Raleway' }}>
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="text-gray-900 font-semibold hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
                <div className="text-[18px] font-medium leading-[100%] tracking-[0%] text-center mb-4" 
                     style={{ fontFamily: 'Raleway' }}>
                  1 ) Account Information
                </div>
              </div>

              {Object.keys(errors).length > 0 && (
                <Alert type="error">
                  <ul className="list-disc list-inside">
                    {Object.values(errors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                         style={{ fontFamily: 'Raleway' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%]"
                    style={{ fontFamily: 'Raleway' }}
                    required
                  />
                  {errors.username && <span className="text-red-600 text-sm">{errors.username}</span>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                         style={{ fontFamily: 'Raleway' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%]"
                    style={{ fontFamily: 'Raleway' }}
                    required
                  />
                  {errors.email && <span className="text-red-600 text-sm">{errors.email}</span>}
                </div>

                <div>
                  <label htmlFor="password1" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                         style={{ fontFamily: 'Raleway' }}>
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password1"
                    name="password1"
                    value={formData.password1}
                    onChange={handleChange}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%]"
                    style={{ fontFamily: 'Raleway' }}
                    required
                  />
                  {errors.password1 && <span className="text-red-600 text-sm">{errors.password1}</span>}
                </div>

                <div>
                  <label htmlFor="password2" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                         style={{ fontFamily: 'Raleway' }}>
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password2"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%]"
                    style={{ fontFamily: 'Raleway' }}
                    required
                  />
                  {errors.password2 && <span className="text-red-600 text-sm">{errors.password2}</span>}
                  <div className="mt-2">
                    <label className="flex items-center text-[16px] font-light leading-[100%] tracking-[0%]" 
                           style={{ fontFamily: 'Raleway' }}>
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="mr-2"
                      />
                      Show Password
                    </label>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button 
                    type="submit" 
                    className="bg-[#815FB3] hover:bg-[#6d4a96] text-white font-medium py-3 px-16 rounded-lg shadow-lg hover:shadow-xl transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Raleway' }}
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default RegisterStep1;
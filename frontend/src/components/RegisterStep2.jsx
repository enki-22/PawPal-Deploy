import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRegistration } from '../context/RegistrationContext';
import Alert from './Alert';

const RegisterStep2 = () => {
  const { registrationData, updateStep2, clearData } = useRegistration();
  const [formData, setFormData] = useState(registrationData.step2);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Redirect if step 1 is not completed
  useEffect(() => {
    if (!registrationData.step1.username) {
      navigate('/register/step1', { replace: true });
    }
  }, [registrationData.step1.username, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    updateStep2(formData);
    
    // Send all data in one request to match Django backend expectations
    const completeData = {
      // User data (required by UserRegistrationSerializer)
      username: registrationData.step1.username,
      email: registrationData.step1.email,
      password: registrationData.step1.password1,
      password_confirm: registrationData.step1.password2,
      first_name: '',
      last_name: '',
      
      // UserProfile data (will be handled by the view)
      phone_number: formData.phone_number,
      province: formData.province,
      city: formData.city,
      address: formData.address || ''
    };
    
    console.log('Complete registration data being sent:', completeData);
    
    const result = await register(completeData);
    
    if (result.success) {
      clearData();
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in.' },
        replace: true
      });
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const provinces = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
    'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
    'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'
  ];

  return (
    <div className="min-h-screen bg-[#D8CAED] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - PawPal Promotional Panel */}
          <div className="bg-[#815FB3] text-white p-8 md:p-12 flex flex-col justify-center">
            <div className="text-center">
              <div className="mb-4">
                <div className="inline-flex items-center">
                  <span className="text-4xl mr-2">🐾</span>
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
                  <span className="text-yellow-400 mr-3">🐾</span>
                  <span className="text-[18px] font-medium leading-[100%] tracking-[0%]" 
                        style={{ fontFamily: 'Raleway' }}>
                    24/7 Pet Health Support
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-3">🐾</span>
                  <span className="text-[18px] font-medium leading-[100%] tracking-[0%]" 
                        style={{ fontFamily: 'Raleway' }}>
                    Personalized Care
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-yellow-400 mr-3">🐾</span>
                  <span className="text-[18px] font-medium leading-[100%] tracking-[0%]" 
                        style={{ fontFamily: 'Raleway' }}>
                    Track Vaccinations and Medications
                  </span>
                </div>
              </div>
              
              <div className="mt-8 flex justify-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <div className="w-8 h-2 bg-purple-800 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form Step 2 */}
          <div className="p-8 md:p-12">
            <div className="max-w-sm mx-auto">
              {/* Back Button */}
              <div className="mb-6">
                <Link 
                  to="/register/step1"
                  className="inline-flex items-center text-[16px] font-light leading-[100%] tracking-[0%] text-gray-600 hover:text-gray-800" 
                  style={{ fontFamily: 'Raleway' }}
                >
                  ← Back
                </Link>
              </div>

              <div className="text-center mb-8">
                <div className="text-[18px] font-medium leading-[100%] tracking-[0%] text-left mb-4" 
                     style={{ fontFamily: 'Raleway' }}>
                  2 ) Contact Information
                </div>
              </div>

              {error && (
                <Alert type="error" onClose={() => setError('')}>
                  <pre className="whitespace-pre-wrap text-sm">{error}</pre>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="phone_number" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                         style={{ fontFamily: 'Raleway' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%]"
                    style={{ fontFamily: 'Raleway' }}
                    placeholder="(123) 456-7890"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="province" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                           style={{ fontFamily: 'Raleway' }}>
                      Province
                    </label>
                    <select
                      id="province"
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[#815FB3] text-white rounded text-[16px] font-light leading-[100%] tracking-[0%] focus:outline-none"
                      style={{ fontFamily: 'Raleway' }}
                      required
                    >
                      <option value="">Province</option>
                      {provinces.map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                           style={{ fontFamily: 'Raleway' }}>
                      City
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-[#815FB3] text-white rounded text-[16px] font-light leading-[100%] tracking-[0%] focus:outline-none"
                      style={{ fontFamily: 'Raleway' }}
                      required
                    >
                      <option value="">City</option>
                      <option value="Toronto">Toronto</option>
                      <option value="Vancouver">Vancouver</option>
                      <option value="Montreal">Montreal</option>
                      <option value="Calgary">Calgary</option>
                      <option value="Edmonton">Edmonton</option>
                      <option value="Ottawa">Ottawa</option>
                      <option value="Winnipeg">Winnipeg</option>
                      <option value="Quebec City">Quebec City</option>
                      <option value="Hamilton">Hamilton</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="clinic_agreement"
                      className="mt-1"
                      required
                    />
                    <label htmlFor="clinic_agreement" className="text-[16px] font-light leading-[100%] tracking-[0%]" 
                           style={{ fontFamily: 'Raleway' }}>
                      I confirm that I am a client of Southvalley Veterinary Clinic.
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="terms_agreement"
                      className="mt-1"
                      required
                    />
                    <label htmlFor="terms_agreement" className="text-[16px] font-light leading-[100%] tracking-[0%]" 
                           style={{ fontFamily: 'Raleway' }}>
                      I confirm that I have read and agree to the Terms and Conditions and Privacy Policy of this website.
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#815FB3] hover:bg-[#6d4a96] text-white font-medium py-3 px-4 rounded-full transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Raleway' }}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Sign up'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStep2;
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from './Alert';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);
    
    if (result.success) {
      navigate('/chat');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#D8CAED] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Login Form */}
          <div className="p-8 md:p-12">
            <div className="max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-[30px] font-bold leading-[100%] tracking-[5%] text-center mb-2" 
                    style={{ fontFamily: 'Raleway' }}>
                  Sign In
                </h2>
                <p className="text-[18px] font-light leading-[100%] tracking-[0%] text-center" 
                   style={{ fontFamily: 'Raleway' }}>
                  Don&apos;t have an account yet?{' '}
                  <Link 
                    to="/register/step1" 
                    className="text-gray-900 font-semibold hover:underline"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>

              {successMessage && (
                <Alert type="success" message={successMessage} />
              )}
              
              <Alert type="error" message={error} onClose={() => setError('')} />

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                         style={{ fontFamily: 'Raleway' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%]"
                    style={{ fontFamily: 'Raleway' }}
                    placeholder="Mala@test.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-[16px] font-light leading-[100%] tracking-[0%] mb-2" 
                         style={{ fontFamily: 'Raleway' }}>
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-0 py-2 border-0 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-gray-600 text-[16px] font-light leading-[100%] tracking-[0%]"
                    style={{ fontFamily: 'Raleway' }}
                    placeholder="••••••••"
                    required
                  />
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

                <div className="text-left">
                  <Link 
                    to="/forgot-password" 
                    className="text-purple-600 hover:text-purple-500 text-sm"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-[#815FB3] hover:bg-[#6d4a96] text-white font-medium py-3 px-4 rounded-full transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Side - Promotional Panel */}
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
                <div className="w-8 h-2 bg-purple-800 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
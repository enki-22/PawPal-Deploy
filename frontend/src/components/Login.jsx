import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import pawIcon from '../Assets/Images/paw-icon.png';
import pawBullet from '../Assets/Images/paw.png';
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
  const [showClinicInfo, setShowClinicInfo] = useState(false);
  
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
    setError('');
    setLoading(true);

    try {
      const { username, password } = formData;
      console.log('Attempting login with:', { username, password: password.length + ' chars' });
      
      const result = await login({ username, password });
      
      console.log('Login result:', result);
      
      if (result.success) {
        console.log('Login successful, should redirect to /chat');
        navigate('/chat');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D8CAED] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Side - Login Form */}
            <div className="flex flex-col justify-center">
              <div className="max-w-sm mx-auto w-full">
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

                  <div className="flex justify-center">
                    <button 
                      type="submit" 
                      className="bg-[#815FB3] hover:bg-[#6d4a96] text-white font-medium py-3 px-16 rounded-lg shadow-lg hover:shadow-xl transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Raleway' }}
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Side - PawPal Promotional Panel */}
            <div className="bg-[#815FB3] text-white p-10 rounded-lg flex flex-col justify-center min-h-[500px]">
              <div className="text-center">
                {!showClinicInfo ? (
                  <>
                    <div className="mb-4">
                      <div className="inline-flex items-center">
                        {/* Use pawIcon if available, fallback to emoji */}
                        {pawIcon ? (
                          <img src={pawIcon} alt="Paw" className="w-16 h-16" />
                        ) : (
                          <span className="text-4xl mr-2">🐾</span>
                        )}
                        <h1 className="text-[#FFF07B] font-museo font-black text-[47px] leading-[100%] tracking-[0%]">
                          PAWPAL
                        </h1>
                      </div>
                    </div>
                    
                    <h2 className="text-[20px] font-bold leading-[100%] tracking-[0%] text-center mb-4" 
                        style={{ fontFamily: 'Raleway' }}>
                      Your pet&apos;s health companion
                    </h2>
                    
                    <div className="text-[16px] font-medium leading-[150%] tracking-[0%] mb-8 text-center" 
                         style={{ fontFamily: 'Raleway' }}>
                      <div>Get instant answers to your pet health</div>
                      <div>questions, track vaccinations, and receive</div>
                      <div>personalized care recommendations.</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        {/* Use pawBullet if available, fallback to emoji */}
                        {pawBullet ? (
                          <img src={pawBullet} alt="Paw" className="w-6 h-6 mr-3 transform rotate-45" />
                        ) : (
                          <span className="text-yellow-400 mr-3">🐾</span>
                        )}
                        <span className="text-[18px] font-medium leading-[100%] tracking-[0%]" 
                              style={{ fontFamily: 'Raleway' }}>
                          24/7 Pet Health Support
                        </span>
                      </div>
                      <div className="flex items-center">
                        {pawBullet ? (
                          <img src={pawBullet} alt="Paw" className="w-6 h-6 mr-3 transform rotate-45" />
                        ) : (
                          <span className="text-yellow-400 mr-3">🐾</span>
                        )}
                        <span className="text-[18px] font-medium leading-[100%] tracking-[0%]" 
                              style={{ fontFamily: 'Raleway' }}>
                          Personalized Care
                        </span>
                      </div>
                      <div className="flex items-center">
                        {pawBullet ? (
                          <img src={pawBullet} alt="Paw" className="w-6 h-6 mr-3 transform rotate-45" />
                        ) : (
                          <span className="text-yellow-400 mr-3">🐾</span>
                        )}
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
                        <span className="text-4xl mr-2">🐾</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
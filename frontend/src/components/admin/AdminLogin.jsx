import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await adminLogin(credentials);
      
      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-purple-100 flex flex-col items-center justify-center">
      {/* Custom Logo */}
      <div className="mb-8">
        <img 
          src="/pat-removebg-preview 2.png" 
          alt="PawPal Logo" 
          className="w-16 h-16 mx-auto object-contain"
        />
      </div>
      
      <div 
        style={{
          width: '696px',
          height: '386px',
          backgroundColor: '#fefefbff',
          borderRadius: '10px',
          padding: '2rem',
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        <div className="text-center mb-8">
          <h1 className="mb-2" style={{
            fontFamily: 'Raleway',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '25px',
            lineHeight: '29px',
            letterSpacing: '0.05em',
            color: '#642A77'
          }}>
            PawPal Admin Login
          </h1>
          <p className="text-gray-600">Enter your credentials to access your account</p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" style={{color: '#642A77'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                style={{
                  boxSizing: 'border-box',
                  width: '436px',
                  height: '47px',
                  border: '1px solid #B192DF',
                  borderRadius: '5px',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  outline: 'none'
                }}
                className="focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" style={{color: '#642A77'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                style={{
                  boxSizing: 'border-box',
                  width: '436px',
                  height: '47px',
                  border: '1px solid #B192DF',
                  borderRadius: '5px',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  outline: 'none'
                }}
                className="focus:ring-2 focus:ring-purple-500"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              boxSizing: 'border-box',
              width: '436px',
              height: '47px',
              backgroundColor: '#9333ea',
              borderRadius: '5px',
              border: 'none',
              color: 'white',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              outline: 'none'
            }}
            className="hover:bg-purple-700 focus:outline-none focus:shadow-outline"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
      
      {/* Forgot Password Link */}
      <div className="mt-6 text-center">
        <p>
          <span style={{
            fontFamily: 'Raleway',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '19px',
            letterSpacing: '0.05em',
            color: '#666666'
          }}>
            Forgot your password? 
          </span>
          <a href="#" style={{
            fontFamily: 'Raleway',
            fontStyle: 'normal', 
            fontWeight: 800,
            fontSize: '16px',
            lineHeight: '19px',
            letterSpacing: '0.05em',
            color: '#815FB3'
          }} className="hover:underline">
            Reset Password
          </a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
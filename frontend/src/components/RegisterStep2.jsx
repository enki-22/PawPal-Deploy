import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRegistration } from '../context/RegistrationContext';
import Layout from './Layout';
import Alert from './Alert';
import ProgressBar from './ProgressBar';

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
    <Layout title="Create Your PawPal Account - Contact Information">
      <div className="max-w-md mx-auto">
        <ProgressBar currentStep={2} totalSteps={2} />

        <div className="bg-gray-50 p-4 rounded mb-5">
          <h6 className="font-semibold mb-2">Account Info:</h6>
          <p>
            <strong>Username:</strong> {registrationData.step1.username}<br />
            <strong>Email:</strong> {registrationData.step1.email}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert type="error" onClose={() => setError('')}>
              <pre className="whitespace-pre-wrap text-sm">{error}</pre>
            </Alert>
          )}
          
          <div className="form-group">
            <label htmlFor="phone_number" className="form-label">Phone Number:</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              className="form-input"
              placeholder="(123) 456-7890"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="province" className="form-label">Province:</label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a province</option>
              {provinces.map(province => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="city" className="form-label">City:</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address" className="form-label">Complete Address (Optional):</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="Enter your complete address"
            />
          </div>
          
          <div className="flex justify-between">
            <Link to="/register/step1" className="btn btn-secondary">
              ← Back
            </Link>
            <button 
              type="submit" 
              className="btn"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterStep2;
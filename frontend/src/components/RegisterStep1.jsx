import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import Alert from './Alert';
import ProgressBar from './ProgressBar';
import { useRegistration } from '../context/RegistrationContext';

const RegisterStep1 = () => {
  const { registrationData, updateStep1 } = useRegistration();
  const [formData, setFormData] = useState(registrationData.step1);
  const [errors, setErrors] = useState({});
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateStep1(formData);
      navigate('/register/step2');
    }
  };

  return (
    <Layout title="Create Your PawPal Account - Account Information">
      <div className="max-w-md mx-auto">
        <ProgressBar currentStep={1} totalSteps={2} />

        <form onSubmit={handleSubmit}>
          {Object.keys(errors).length > 0 && (
            <Alert type="error">
              <ul className="list-disc list-inside">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`form-input ${errors.username ? 'border-red-500' : ''}`}
              required
            />
            {errors.username && <span className="text-red-600 text-sm">{errors.username}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
              required
            />
            {errors.email && <span className="text-red-600 text-sm">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password1" className="form-label">Password:</label>
            <input
              type="password"
              id="password1"
              name="password1"
              value={formData.password1}
              onChange={handleChange}
              className={`form-input ${errors.password1 ? 'border-red-500' : ''}`}
              required
            />
            {errors.password1 && <span className="text-red-600 text-sm">{errors.password1}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password2" className="form-label">Confirm Password:</label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              className={`form-input ${errors.password2 ? 'border-red-500' : ''}`}
              required
            />
            {errors.password2 && <span className="text-red-600 text-sm">{errors.password2}</span>}
          </div>
          
          <button type="submit" className="btn w-full">
            Next: Contact Information →
          </button>
        </form>

        <p className="text-center text-gray-600 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </Layout>
  );
};

export default RegisterStep1;
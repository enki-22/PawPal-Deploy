import React, { createContext, useState, useContext, useEffect } from 'react';

const RegistrationContext = createContext();

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};

export const RegistrationProvider = ({ children }) => {
  const [registrationData, setRegistrationData] = useState(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('registrationData');
    return saved ? JSON.parse(saved) : {
      step1: {
        username: '',
        email: '',
        password1: '',
        password2: '',
      },
      step2: {
        phone_number: '',
        province: '',
        city: '',
        address: '',
      }
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('registrationData', JSON.stringify(registrationData));
  }, [registrationData]);

  const updateStep1 = (data) => {
    setRegistrationData(prev => ({
      ...prev,
      step1: { ...prev.step1, ...data }
    }));
  };

  const updateStep2 = (data) => {
    setRegistrationData(prev => ({
      ...prev,
      step2: { ...prev.step2, ...data }
    }));
  };

  const getCompleteData = () => ({
    ...registrationData.step1,
    ...registrationData.step2,
  });

  const clearData = () => {
    localStorage.removeItem('registrationData');
    setRegistrationData({
      step1: {
        username: '',
        email: '',
        password1: '',
        password2: '',
      },
      step2: {
        phone_number: '',
        province: '',
        city: '',
        address: '',
      }
    });
  };

  const value = {
    registrationData,
    updateStep1,
    updateStep2,
    getCompleteData,
    clearData,
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};
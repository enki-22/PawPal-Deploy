import React from 'react';

const ProgressBar = ({ currentStep, totalSteps }) => {
  return (
    <div className="mb-5">
      <div className="flex justify-between mb-2.5">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div 
            key={index}
            className={`flex-1 h-1 ${index < totalSteps - 1 ? 'mr-1' : ''} ${
              index + 1 <= currentStep ? 'bg-green-500' : 
              index + 1 === currentStep ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <small className="text-gray-600">
        Step {currentStep} of {totalSteps}: {
          currentStep === 1 ? 'Account Information' : 'Contact Information'
        }
      </small>
    </div>
  );
};

export default ProgressBar;
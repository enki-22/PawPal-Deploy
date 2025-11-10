import React, { useState } from 'react';
import axios from 'axios';

const AddPetModal = ({ isOpen, onClose, onPetAdded, token }) => {
  // Blood type options by species
  const bloodTypeOptions = {
    dog: [
      { value: 'DEA 1.1', label: 'DEA 1.1 (Dog)' },
      { value: 'DEA 1.2', label: 'DEA 1.2 (Dog)' },
      { value: 'DEA 3', label: 'DEA 3 (Dog)' },
      { value: 'DEA 4', label: 'DEA 4 (Dog)' },
      { value: 'DEA 5', label: 'DEA 5 (Dog)' },
      { value: 'DEA 7', label: 'DEA 7 (Dog)' },
    ],
    cat: [
      { value: 'A', label: 'A (Cat)' },
      { value: 'B', label: 'B (Cat)' },
      { value: 'AB', label: 'AB (Cat)' },
    ],
    other: [
      { value: 'Unknown', label: 'Unknown' },
    ],
    hamster: [ { value: 'Unknown', label: 'Unknown' } ],
    bird: [ { value: 'Unknown', label: 'Unknown' } ],
    rabbit: [ { value: 'Unknown', label: 'Unknown' } ],
    fish: [ { value: 'Unknown', label: 'Unknown' } ],
  };
  const [newPet, setNewPet] = useState({
    name: '',
    animal_type: '',
    breed: '',
    date_of_birth: '',
    sex: '',
    blood_type: '',
    allergies: '',
    chronic_disease: '',
    spayed_neutered: false,
    image: null
  });
  const [addingPet, setAddingPet] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleInputChange = (field, value) => {
    setNewPet(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPet(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleClose = () => {
    setNewPet({
      name: '',
      animal_type: '',
      breed: '',
      date_of_birth: '',
      sex: '',
      blood_type: '',
      allergies: '',
      chronic_disease: '',
      spayed_neutered: false,
      image: null
    });
    setPreviewImage(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddingPet(true);

    try {
      const formData = new FormData();
      
      // Calculate age from date of birth
      let age = 0;
      if (newPet.date_of_birth) {
        const birthDate = new Date(newPet.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Append all fields to FormData
      formData.append('name', newPet.name);
      formData.append('animal_type', newPet.animal_type);
      formData.append('breed', newPet.breed || '');
      formData.append('age', age);
      formData.append('sex', newPet.sex);
      formData.append('medical_notes', 
        `Blood Type: ${newPet.blood_type || 'Unknown'}\n` +
        `Allergies: ${newPet.allergies || 'None'}\n` +
        `Chronic Disease: ${newPet.chronic_disease || 'None'}\n` +
        `Spayed/Neutered: ${newPet.spayed_neutered ? 'Yes' : 'No'}`
      );
      
      if (newPet.image) {
        formData.append('image', newPet.image);
        console.log('Image file being uploaded:', newPet.image.name, newPet.image.type, newPet.image.size);
      }

      // Debug: Log all form data
      for (let [key, value] of formData.entries()) {
        console.log('FormData:', key, value);
      }

      const response = await axios.post(
        'http://localhost:8000/api/pets/create/',
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      console.log('Pet created:', response.data);
      onPetAdded(); // Refresh the pets list
      handleClose(); // Close modal
      
    } catch (error) {
      console.error('Error creating pet:', error);
      alert('Failed to create pet. Please try again.');
    } finally {
      setAddingPet(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden z-[1001]">
        {/* Modal Header */}
        <div className="bg-[#815FB3] text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Raleway' }}>
            Add Pet
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-12">
              {/* Left Column - Pet Photo */}
              <div className="flex-shrink-0 relative">
                <div className="w-48 h-48 bg-[#815FB3] rounded-full flex items-center justify-center relative overflow-hidden">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Pet preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src="/Group 60.png" 
                      alt="Pet placeholder"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {/* Camera Icon - Top position */}
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-black bg-opacity-80 rounded-full flex items-center justify-center cursor-pointer border-2 border-white">
                  <input
                    type="file"
                    id="petImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="petImage" className="cursor-pointer">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                </div>
              </div>

              {/* Right Column - Form Fields */}
              <div className="flex-1">
                {/* Basic Information Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Raleway' }}>
                    Basic Information
                  </h3>

                  {/* First Row - Name and Breed */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Name</label>
                      <input
                        type="text"
                        required
                        value={newPet.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        placeholder="Name"
                        style={{ fontFamily: 'Raleway' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Breed</label>
                      <input
                        type="text"
                        value={newPet.breed}
                        onChange={(e) => handleInputChange('breed', e.target.value)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        placeholder="Breed"
                        style={{ fontFamily: 'Raleway' }}
                      />
                    </div>
                  </div>

                  {/* Second Row - Species */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Species</label>
                      <select
                        required
                        value={newPet.animal_type}
                        onChange={(e) => handleInputChange('animal_type', e.target.value)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        style={{ fontFamily: 'Raleway' }}
                      >
                        <option value="">Species</option>
                        <option value="cat">Cat</option>
                        <option value="dog">Dog</option>
                        <option value="hamster">Hamster</option>
                        <option value="bird">Bird</option>
                        <option value="rabbit">Rabbit</option>
                        <option value="fish">Fish</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Third Row - Date of Birth and Weight */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Date of Birth</label>
                      <input
                        type="date"
                        value={newPet.date_of_birth}
                        onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        style={{ fontFamily: 'Raleway' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Weight</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newPet.weight || ''}
                        onChange={(e) => handleInputChange('weight', e.target.value.replace(/[^0-9.]/g, ''))}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        placeholder="Weight"
                        style={{ fontFamily: 'Raleway' }}
                      />
                    </div>
                  </div>

                  {/* Gender Section */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-3" style={{ fontFamily: 'Raleway' }}>Gender</label>
                    <div className="flex space-x-8">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="sex"
                          value="male"
                          checked={newPet.sex === 'male'}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                          className="mr-3 w-4 h-4 text-[#815FB3]"
                          required
                        />
                        <span className="text-base text-gray-700" style={{ fontFamily: 'Raleway' }}>Male</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="sex"
                          value="female"
                          checked={newPet.sex === 'female'}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                          className="mr-3 w-4 h-4 text-[#815FB3]"
                          required
                        />
                        <span className="text-base text-gray-700" style={{ fontFamily: 'Raleway' }}>Female</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Medical Information Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Raleway' }}>
                    Medical Information
                  </h3>

                  {/* First Row - Blood Type and Spayed/Neutered */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Blood Type</label>
                      <select
                        value={newPet.blood_type}
                        onChange={(e) => handleInputChange('blood_type', e.target.value)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        style={{ fontFamily: 'Raleway' }}
                        required
                        disabled={!newPet.animal_type}
                      >
                        <option value="">Select Blood Type</option>
                        {(bloodTypeOptions[newPet.animal_type] || bloodTypeOptions['other']).map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3" style={{ fontFamily: 'Raleway' }}>Spayed or Neutered</label>
                      <div className="flex space-x-8">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="spayed_neutered"
                            value="true"
                            checked={newPet.spayed_neutered === true}
                            onChange={() => handleInputChange('spayed_neutered', true)}
                            className="mr-3 w-4 h-4 text-[#815FB3]"
                          />
                          <span className="text-base text-gray-700" style={{ fontFamily: 'Raleway' }}>Yes</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="spayed_neutered"
                            value="false"
                            checked={newPet.spayed_neutered === false}
                            onChange={() => handleInputChange('spayed_neutered', false)}
                            className="mr-3 w-4 h-4 text-[#815FB3]"
                          />
                          <span className="text-base text-gray-700" style={{ fontFamily: 'Raleway' }}>No</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Second Row - Allergies and Chronic Disease */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Allergies</label>
                      <input
                        type="text"
                        value={newPet.allergies}
                        onChange={(e) => handleInputChange('allergies', e.target.value)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        placeholder="Allergies"
                        style={{ fontFamily: 'Raleway' }}
                        disabled={newPet.allergies === 'Unknown'}
                      />
                      <div className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          id="allergiesUnknown"
                          checked={newPet.allergies === 'Unknown'}
                          onChange={() => handleInputChange('allergies', newPet.allergies === 'Unknown' ? '' : 'Unknown')}
                          className="mr-2"
                        />
                        <label htmlFor="allergiesUnknown" className="text-sm text-gray-700" style={{ fontFamily: 'Raleway' }}>
                          Allergies Unknown
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Chronic Disease</label>
                      <input
                        type="text"
                        value={newPet.chronic_disease}
                        onChange={(e) => handleInputChange('chronic_disease', e.target.value)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        placeholder="Chronic Disease"
                        style={{ fontFamily: 'Raleway' }}
                        disabled={newPet.chronic_disease === 'Unknown'}
                      />
                      <div className="mt-2 flex items-center">
                        <input
                          type="checkbox"
                          id="chronicDiseaseUnknown"
                          checked={newPet.chronic_disease === 'Unknown'}
                          onChange={() => handleInputChange('chronic_disease', newPet.chronic_disease === 'Unknown' ? '' : 'Unknown')}
                          className="mr-2"
                        />
                        <label htmlFor="chronicDiseaseUnknown" className="text-sm text-gray-700" style={{ fontFamily: 'Raleway' }}>
                          Chronic Disease Unknown
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Create Pet Button - Centered in modal */}
            <div className="flex justify-center mt-8">
              <button
                type="submit"
                disabled={addingPet}
                className="bg-[#815FB3] text-white px-12 py-3 rounded-lg hover:bg-[#6d4a96] transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Raleway' }}
              >
                {addingPet ? 'Creating Pet...' : 'Create Pet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPetModal;
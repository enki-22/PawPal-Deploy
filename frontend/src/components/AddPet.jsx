import React, { useState } from 'react';
import axios from 'axios';

const AddPetModal = ({ isOpen, onClose, onPetAdded, token }) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Photo & Basic Info */}
              <div>
                {/* Pet Photo Upload */}
                <div className="text-center mb-8">
                  <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden border-4 border-gray-300">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Pet preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-gray-500">Upload Photo</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    id="petImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="petImage"
                    className="bg-[#FFF07B] text-black px-6 py-2 rounded-lg cursor-pointer hover:bg-yellow-400 transition-colors font-medium"
                    style={{ fontFamily: 'Raleway' }}
                  >
                    Choose Photo
                  </label>
                </div>

                {/* Basic Information */}
                <h3 className="text-xl font-bold text-[#815FB3] mb-6" style={{ fontFamily: 'Raleway' }}>
                  Basic Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={newPet.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-base"
                      placeholder="Enter pet's name"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Breed</label>
                    <input
                      type="text"
                      value={newPet.breed}
                      onChange={(e) => handleInputChange('breed', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-base"
                      placeholder="Enter breed"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Species *</label>
                    <select
                      required
                      value={newPet.animal_type}
                      onChange={(e) => handleInputChange('animal_type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-base"
                      style={{ fontFamily: 'Raleway' }}
                    >
                      <option value="">Select species</option>
                      <option value="cat">Cat</option>
                      <option value="dog">Dog</option>
                      <option value="hamster">Hamster</option>
                      <option value="bird">Bird</option>
                      <option value="rabbit">Rabbit</option>
                      <option value="fish">Fish</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={newPet.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-base"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Gender *</label>
                    <div className="flex space-x-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="sex"
                          value="male"
                          checked={newPet.sex === 'male'}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                          className="mr-2 w-4 h-4"
                          required
                        />
                        <span className="text-base" style={{ fontFamily: 'Raleway' }}>Male</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="sex"
                          value="female"
                          checked={newPet.sex === 'female'}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                          className="mr-2 w-4 h-4"
                          required
                        />
                        <span className="text-base" style={{ fontFamily: 'Raleway' }}>Female</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Medical Info */}
              <div>
                <h3 className="text-xl font-bold text-[#815FB3] mb-6" style={{ fontFamily: 'Raleway' }}>
                  Medical Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Type</label>
                    <input
                      type="text"
                      value={newPet.blood_type}
                      onChange={(e) => handleInputChange('blood_type', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-base"
                      placeholder="Enter blood type"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Spayed or Neutered</label>
                    <div className="flex space-x-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="spayed_neutered"
                          value="true"
                          checked={newPet.spayed_neutered === true}
                          onChange={(e) => handleInputChange('spayed_neutered', true)}
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-base" style={{ fontFamily: 'Raleway' }}>Yes</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="spayed_neutered"
                          value="false"
                          checked={newPet.spayed_neutered === false}
                          onChange={(e) => handleInputChange('spayed_neutered', false)}
                          className="mr-2 w-4 h-4"
                        />
                        <span className="text-base" style={{ fontFamily: 'Raleway' }}>No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Allergies</label>
                    <textarea
                      value={newPet.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] h-24 resize-none text-base"
                      placeholder="List any known allergies"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Chronic Disease</label>
                    <textarea
                      value={newPet.chronic_disease}
                      onChange={(e) => handleInputChange('chronic_disease', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] h-24 resize-none text-base"
                      placeholder="List any chronic conditions"
                      style={{ fontFamily: 'Raleway' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center space-x-4">
              <button
                type="button"
                onClick={handleClose}
                className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors text-lg font-semibold"
                style={{ fontFamily: 'Raleway' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingPet}
                className="bg-[#815FB3] text-white px-8 py-3 rounded-lg hover:bg-[#6d4a96] transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
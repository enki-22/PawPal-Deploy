import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import showToast from '../utils/toast';

// --- DATA: Breed Lists ---
const DOG_BREEDS = [
  "Aspin (Askal)", "Beagle", "Belgian Malinois", "Bichon Frise", "Border Collie", "Boston Terrier",
  "Boxer", "Bulldog", "Bull Terrier", "Cane Corso", "Chihuahua", "Chow Chow", "Corgi", 
  "Dachshund", "Dalmatian", "Doberman Pinscher", "French Bulldog", "German Shepherd", 
  "Golden Retriever", "Great Dane", "Husky", "Jack Russell Terrier", "Labrador Retriever", 
  "Lhasa Apso", "Maltese", "Mastiff", "Mixed Breed", "Pomeranian", "Poodle", "Pug", 
  "Rottweiler", "Saint Bernard", "Samoyed", "Schnauzer", "Shih Tzu", "Siberian Husky", 
  "Spitz", "Yorkshire Terrier"
];

const CAT_BREEDS = [
  "Abyssinian", "American Shorthair", "Bengal", "Birman", "British Shorthair", "Burmese", 
  "Domestic Long Hair", "Domestic Short Hair", "Exotic Shorthair", "Himalayan", "Maine Coon", 
  "Manx", "Mixed Breed", "Norwegian Forest", "Persian", "Puspin", "Ragdoll", 
  "Russian Blue", "Scottish Fold", "Siamese", "Siberian", "Sphynx", "Turkish Angora"
];

const AddPetModal = ({ isOpen, onClose, onPetAdded, token, petToEdit = null }) => {
  const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = `${API_ROOT}/api`;
  
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
  };

  const initialPetState = {
    name: '',
    animal_type: '',
    breed: '',
    date_of_birth: '',
    age: '', 
    sex: '',
    weight: '',
    blood_type: '',
    allergies: '',
    chronic_disease: '',
    spayed_neutered: false,
    image: null
  };

  const [newPet, setNewPet] = useState(initialPetState);
  const [addingPet, setAddingPet] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // --- NEW STATE: For Breed Autocomplete ---
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const breedInputRef = useRef(null);

  // Populate form when editing
  useEffect(() => {
    if (isOpen && petToEdit) {
      const notes = petToEdit.medical_notes || '';
      const bloodTypeMatch = notes.match(/Blood Type: ([^\n]+)/);
      const allergiesMatch = notes.match(/Allergies: ([^\n]+)/);
      const chronicMatch = notes.match(/Chronic Disease: ([^\n]+)/);
      const spayedMatch = notes.match(/Spayed\/Neutered: ([^\n]+)/);

      let isSpayed = false;
      if (spayedMatch) {
        isSpayed = spayedMatch[1].trim() === 'Yes';
      } else if (typeof petToEdit.spayed_neutered !== 'undefined') {
        isSpayed = petToEdit.spayed_neutered;
      }

      setNewPet({
        name: petToEdit.name || '',
        animal_type: petToEdit.animal_type || '',
        breed: petToEdit.breed || '',
        date_of_birth: petToEdit.date_of_birth || '',
        age: petToEdit.age || '',
        sex: petToEdit.sex || '',
        weight: petToEdit.weight !== null ? parseFloat(petToEdit.weight).toString() : '',
        blood_type: bloodTypeMatch ? bloodTypeMatch[1].trim() : (petToEdit.blood_type || ''),
        allergies: allergiesMatch ? allergiesMatch[1].trim() : (petToEdit.allergies || ''),
        chronic_disease: chronicMatch ? chronicMatch[1].trim() : (petToEdit.chronic_disease || ''),
        spayed_neutered: isSpayed,
        image: null
      });

      if (petToEdit.image || petToEdit.image_url) {
        setPreviewImage(petToEdit.image_url || petToEdit.image);
      } else setPreviewImage(null);
    } else if (isOpen && !petToEdit) {
      setNewPet(initialPetState);
      setPreviewImage(null);
    }
  }, [isOpen, petToEdit]);

  // --- NEW EFFECT: Filter breeds based on input and animal type ---
  useEffect(() => {
    let sourceList = [];
    if (newPet.animal_type === 'dog') sourceList = DOG_BREEDS;
    else if (newPet.animal_type === 'cat') sourceList = CAT_BREEDS;
    
    if (sourceList.length > 0) {
      const lowerInput = (newPet.breed || '').toLowerCase();
      const filtered = sourceList.filter(breed => 
        breed.toLowerCase().includes(lowerInput)
      );
      setFilteredBreeds(filtered);
    } else {
      setFilteredBreeds([]);
    }
  }, [newPet.breed, newPet.animal_type]);

  const handleInputChange = (field, value) => {
    setNewPet(prev => ({ ...prev, [field]: value }));
  };

  // --- NEW HANDLER: Select breed from dropdown ---
  const handleBreedSelect = (breed) => {
    setNewPet(prev => ({ ...prev, breed: breed }));
    setShowBreedSuggestions(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewPet(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleClose = () => {
    setNewPet(initialPetState);
    setPreviewImage(null);
    setShowBreedSuggestions(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAddingPet(true);

    try {
      const formData = new FormData();
      
      let finalAge = newPet.age;
      if (newPet.date_of_birth) {
        const birthDate = new Date(newPet.date_of_birth);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        finalAge = calculatedAge;
      }

      formData.append('name', newPet.name);
      formData.append('animal_type', newPet.animal_type);
      formData.append('breed', newPet.breed || '');
      formData.append('age', finalAge);
      formData.append('date_of_birth', newPet.date_of_birth || '');
      formData.append('sex', newPet.sex);
      
      if (newPet.weight !== '') {
        formData.append('weight', newPet.weight);
      }

      const medicalNotes = `Blood Type: ${newPet.blood_type || 'Unknown'}\n` +
        `Allergies: ${newPet.allergies || 'None'}\n` +
        `Chronic Disease: ${newPet.chronic_disease || 'None'}\n` +
        `Spayed/Neutered: ${newPet.spayed_neutered ? 'Yes' : 'No'}`;

      formData.append('medical_notes', medicalNotes);
      
      if (newPet.image) {
        formData.append('image', newPet.image);
      }

      let response;
      if (petToEdit) {
        response = await axios.put(
          `${API_BASE_URL}/pets/${petToEdit.id}/`,
          formData,
          {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'multipart/form-data',
            }
          }
        );
        showToast({ message: 'Pet Updated Successfully!', type: 'success' });
      } else {
        response = await axios.post(
          `${API_BASE_URL}/pets/create/`,
          formData,
          {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'multipart/form-data',
            }
          }
        );
        showToast({ message: 'Pet Added Successfully!', type: 'success' });
      }

      onPetAdded();
      handleClose();
      
    } catch (error) {
      console.error('Error creating pet:', error);
      showToast({ message: 'Failed to create pet. Please try again.', type: 'error' });
    } finally {
      setAddingPet(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[1000]">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden z-[1001] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#815FB3] text-white p-4 md:p-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-bold" style={{ fontFamily: 'Raleway' }}>
            {petToEdit ? 'Edit Pet' : 'Add Pet'}
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
        <div className="p-4 md:p-8 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit}>
            {/* Responsive Layout: Stack on mobile, Row on desktop */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-12">
              
              {/* Left Column (Top on Mobile) - Pet Photo */}
              <div className="flex-shrink-0 relative flex justify-center md:block">
                <div className="w-32 h-32 md:w-48 md:h-48 bg-[#815FB3] rounded-full flex items-center justify-center relative overflow-hidden">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt="Pet preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src="/group-60.png" 
                      alt="Pet placeholder"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {/* Camera Icon */}
                <div className="absolute top-0 right-20 md:top-[-8px] md:right-[-8px] w-10 h-10 md:w-12 md:h-12 bg-black bg-opacity-80 rounded-full flex items-center justify-center cursor-pointer border-2 border-white">
                  <input
                    type="file"
                    id="petImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="petImage" className="cursor-pointer flex items-center justify-center w-full h-full">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                </div>
              </div>

              {/* Right Column (Bottom on Mobile) - Form Fields */}
              <div className="flex-1">
                {/* Basic Information Section */}
                <div className="mb-8">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 text-center md:text-left" style={{ fontFamily: 'Raleway' }}>
                    Basic Information
                  </h3>

                  {/* First Row - Name and Breed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
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
                    
                    {/* --- UPDATED BREED INPUT WITH DROPDOWN --- */}
                    <div className="relative">
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Breed</label>
                      <input
                        ref={breedInputRef}
                        type="text"
                        value={newPet.breed}
                        onChange={(e) => {
                          handleInputChange('breed', e.target.value);
                          setShowBreedSuggestions(true);
                        }}
                        onFocus={() => setShowBreedSuggestions(true)}
                        // Delayed blur to allow click event on dropdown item
                        onBlur={() => setTimeout(() => setShowBreedSuggestions(false), 200)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        placeholder={newPet.animal_type ? `Search ${newPet.animal_type} breeds...` : "Select species first"}
                        style={{ fontFamily: 'Raleway' }}
                        disabled={!newPet.animal_type}
                        autoComplete="off"
                      />
                      
                      {/* Breed Suggestions Dropdown */}
                      {showBreedSuggestions && filteredBreeds.length > 0 && newPet.animal_type && (
                        <ul className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg rounded-b-lg max-h-48 overflow-y-auto mt-1">
                          {filteredBreeds.map((breed, index) => (
                            <li 
                              key={index}
                              onClick={() => handleBreedSelect(breed)}
                              className="px-4 py-2 hover:bg-[#815FB3] hover:text-white cursor-pointer text-sm transition-colors"
                              style={{ fontFamily: 'Raleway' }}
                            >
                              {breed}
                            </li>
                          ))}
                        </ul>
                      )}
                      {showBreedSuggestions && newPet.animal_type && filteredBreeds.length === 0 && newPet.breed && (
                         <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg rounded-b-lg p-2 mt-1">
                            <span className="text-xs text-gray-500 italic px-2">Custom breed: &quot;{newPet.breed}&quot;</span>
                         </div>
                      )}
                    </div>
                    {/* --- END UPDATED BREED INPUT --- */}

                  </div>

                  {/* Second Row - Species */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Species</label>
                      <select
                        required
                        value={newPet.animal_type}
                        onChange={(e) => {
                          handleInputChange('animal_type', e.target.value);
                          // Clear breed if species changes to avoid mismatch
                          handleInputChange('breed', ''); 
                        }}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        style={{ fontFamily: 'Raleway' }}
                      >
                        <option value="" disabled hidden>Species</option>
                        <option value="cat">Cat</option>
                        <option value="dog">Dog</option>
                      </select>
                    </div>
                  </div>

                  {/* Third Row - Date of Birth and Weight */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
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
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Weight (kg)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newPet.weight || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            handleInputChange('weight', val);
                          }
                        }}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        placeholder="Weight (kg)"
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
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 text-center md:text-left" style={{ fontFamily: 'Raleway' }}>
                    Medical Information
                  </h3>

                  {/* First Row - Blood Type and Spayed/Neutered */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>Blood Type <span className="text-gray-500 font-normal text-xs">(Optional)</span></label>
                      <select
                        value={newPet.blood_type}
                        onChange={(e) => handleInputChange('blood_type', e.target.value)}
                        className="w-full px-3 py-2 border-b-2 border-gray-300 focus:border-[#815FB3] focus:outline-none text-base bg-transparent"
                        style={{ fontFamily: 'Raleway' }}
                        disabled={!newPet.animal_type}
                      >
                        <option value="">Select Blood Type (Optional)</option>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
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
                className="bg-[#815FB3] text-white px-12 py-3 rounded-lg hover:bg-[#6d4a96] transition-colors text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                style={{ fontFamily: 'Raleway' }}
              >
                {addingPet ? (petToEdit ? 'Saving...' : 'Creating Pet...') : (petToEdit ? 'Save Changes' : 'Create Pet')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPetModal;
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Upload, Camera } from 'lucide-react';
import CustomDropdown from './CustomDropdown';

const EditPetModal = ({ isOpen, onClose, onPetUpdated, token, petToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    animal_type: '',
    breed: '',
    sex: '',
    age: '',
    weight: '',
    blood_type: '',
    spayed_neutered: 'No',
    allergies: '',
    chronic_disease: '',
    medical_notes: ''
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (petToEdit) {
      setFormData({
        name: petToEdit.name || '',
        animal_type: petToEdit.animal_type || '',
        breed: petToEdit.breed || '',
        sex: petToEdit.sex || '',
        age: petToEdit.age || '',
        weight: petToEdit.weight || '',
        blood_type: petToEdit.blood_type || '',
        spayed_neutered: petToEdit.spayed_neutered ? 'Yes' : 'No',
        allergies: petToEdit.allergies || '',
        chronic_disease: petToEdit.chronic_disease || '',
        medical_notes: petToEdit.medical_notes || ''
      });
      setPreviewImage(petToEdit.image_url || petToEdit.image || null);
    }
  }, [petToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'spayed_neutered') {
          data.append(key, formData[key] === 'Yes' ? 'true' : 'false');
        } else {
          data.append(key, formData[key]);
        }
      });
      if (selectedFile) data.append('image', selectedFile);

      const response = await axios.patch(
        `http://localhost:8000/api/pets/${petToEdit.id}/`,
        data,
        {
          headers: {
            'Authorization': token ? `Token ${token}` : '',
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data) {
        if (onPetUpdated) onPetUpdated(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error updating pet:', error);
      alert('Failed to update pet profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative font-raleway">
        <div className="sticky top-0 bg-white z-10 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#34113F]">Edit Pet Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#815FB3] bg-gray-100 shadow-md">
                {previewImage ? (
                  <img src={previewImage} alt="Pet Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#815FB3]">
                    <Camera size={40} />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all flex items-center justify-center">
                <Upload className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Tap to change photo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#815FB3] border-b border-gray-100 pb-2">Basic Info</h3>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Pet Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Species</label>
                  <select name="animal_type" value={formData.animal_type} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none">
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Bird">Bird</option>
                    <option value="Rabbit">Rabbit</option>
                    <option value="Fish">Fish</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Breed</label>
                  <input type="text" name="breed" value={formData.breed} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Age (Years)</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Sex</label>
                   <select name="sex" value={formData.sex} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#815FB3] border-b border-gray-100 pb-2">Medical Info</h3>

               <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Blood Type</label>
                   <input type="text" name="blood_type" value={formData.blood_type} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none" placeholder="e.g. DEA 1.1" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Spayed/Neutered?</label>
                   <select name="spayed_neutered" value={formData.spayed_neutered} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Allergies</label>
                <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none" placeholder="e.g. Chicken, Pollen" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Chronic Conditions</label>
                <input type="text" name="chronic_disease" value={formData.chronic_disease} onChange={handleChange} className="w-full p-3 bg-[#F0F0F0] rounded-xl border-none focus:ring-2 focus:ring-[#815FB3] outline-none" placeholder="e.g. Diabetes, Arthritis" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#815FB3] text-white rounded-xl font-bold shadow-md hover:bg-[#6a4c9c] transition-all disabled:opacity-70"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditPetModal;

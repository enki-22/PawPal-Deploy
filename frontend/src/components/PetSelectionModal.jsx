import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const PetSelectionModal = ({ isOpen, onClose, onSelectPet, conversationType }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setError(null);
      fetchUserPets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchUserPets = async () => {
    let response;
    try {
      setLoading(true);
      // DEBUG: Check all possible token sources
      const tokenFromAuth = token;
      const tokenFromLocalStorage = localStorage.getItem('token');
      const tokenFromAuthToken = localStorage.getItem('authToken');
      const authToken = tokenFromAuth || tokenFromLocalStorage || tokenFromAuthToken;
      if (!authToken) {
        throw new Error('No authentication token found. Please log in again.');
      }
      const headers = {
        'Authorization': `Token ${authToken}`,
        'Content-Type': 'application/json',
      };
      response = await fetch(`${API_BASE_URL}/chatbot/get-user-pets/`, {
        method: 'GET',
        headers: headers
      });
      const data = await response.json();
      if (data.success) {
        setPets(data.pets);
        setError(null);
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch pets');
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async (petId = null, isNewPet = false) => {
    try {
      const requestBody = {
        type: conversationType,
        pet_id: petId,
        is_new_pet: isNewPet,
        pet_name: isNewPet ? 'New Pet' : pets.find(p => p.id === petId)?.name
      };
      const response = await fetch(`${API_BASE_URL}/chatbot/start-conversation-with-pet/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Token ${token}` : '',
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        onSelectPet({
          conversation_id: data.conversation_id,
          pet_context: data.pet_context,
          initial_message: data.initial_message,
          conversation_title: `${conversationType === 'general' ? 'Pet Care' : 'Symptom Check'}: ${data.pet_context?.name || 'New Pet'}`
        });
        onClose();
      } else {
        setError(data.error || 'Failed to start conversation');
      }
    } catch (error) {
      setError(`Failed to start conversation: ${error.message}`);
    }
  };

  const handleAddNewPet = () => {
    onClose();
    navigate('/pet-health-records');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Raleway' }}>
          {conversationType === 'general' ? 'General Pet Healthcare' : 'Symptom Checker'}
        </h2>
        <p className="text-gray-600 mb-6" style={{ fontFamily: 'Raleway' }}>
          {conversationType === 'general' 
            ? "Want to check what&apos;s normal for your pet? Let&apos;s start with: Do you want to check for an existing pet or add a new one?"
            : "Let&apos;s analyze your pet&apos;s symptoms. Do you want to check an existing pet or add a new one?"
          }
        </p>
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        {!selectedOption && (
          <div className="space-y-3">
            <button
              onClick={() => setSelectedOption('existing')}
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              style={{ fontFamily: 'Raleway' }}
            >
              Existing Pet
            </button>
            <button
              onClick={() => setSelectedOption('new')}
              className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              style={{ fontFamily: 'Raleway' }}
            >
              Add New Pet
            </button>
          </div>
        )}
        {selectedOption === 'existing' && (
          <div className="space-y-3">
            <h3 className="font-semibold" style={{ fontFamily: 'Raleway' }}>Select your pet:</h3>
            {loading ? (
              <div className="text-center py-4" style={{ fontFamily: 'Raleway' }}>
                Loading pets...
              </div>
            ) : pets.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => handleStartConversation(pet.id, false)}
                    className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    style={{ fontFamily: 'Raleway' }}
                  >
                    <div className="flex items-center space-x-3">
                      {pet.photo && (
                        <img 
                          src={pet.photo} 
                          alt={pet.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{pet.name}</div>
                        <div className="text-sm text-gray-500">
                          {pet.breed} • {pet.species} • {pet.age} years old
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500" style={{ fontFamily: 'Raleway' }}>
                <p>No pets found.</p>
                <button
                  onClick={handleAddNewPet}
                  className="mt-2 text-blue-500 hover:text-blue-700 underline"
                >
                  Would you like to add a pet first?
                </button>
              </div>
            )}
            <button
              onClick={() => setSelectedOption(null)}
              className="w-full p-2 text-gray-500 hover:text-gray-700"
              style={{ fontFamily: 'Raleway' }}
            >
              ← Back
            </button>
          </div>
        )}
        {selectedOption === 'new' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4" style={{ fontFamily: 'Raleway' }}>
                Let&apos;s add your new pet&apos;s information first so I can provide better assistance.
              </p>
              {/* Option 1: Redirect to Pet Health Records */}
              <div className="space-y-3">
                <button
                  onClick={handleAddNewPet}
                  className="w-full p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  style={{ fontFamily: 'Raleway' }}
                >
                  📋 Add Pet Details First
                  <div className="text-sm mt-1 opacity-90">
                    Go to Pet Health Records to add your pet&apos;s information
                  </div>
                </button>
                {/* Option 2: Continue without details */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartConversation(null, true)}
                  className="w-full p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  style={{ fontFamily: 'Raleway' }}
                >
                  💬 Continue Without Details
                  <div className="text-sm mt-1 opacity-75">
                    Start chatting now, add details later
                  </div>
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedOption(null)}
              className="w-full p-2 text-gray-500 hover:text-gray-700"
              style={{ fontFamily: 'Raleway' }}
            >
              ← Back
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full mt-6 p-2 text-gray-500 hover:text-gray-700 border-t pt-4"
          style={{ fontFamily: 'Raleway' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PetSelectionModal;
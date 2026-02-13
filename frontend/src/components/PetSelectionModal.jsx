import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const PetSelectionModal = ({ isOpen, onClose, onSelectPet, conversationType }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false); // New state to track submission
  const { token } = useAuth();
  const navigate = useNavigate();

  // Environment-aware API roots
  const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = `${API_ROOT}/api`;

  // Helper to ensure we have an absolute URL for images
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_ROOT}${normalizedPath}`;
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setError(null);
      setIsStarting(false); // Reset starting state when opening
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
    // Prevent multiple clicks if already starting
    if (isStarting) return;
    
    setIsStarting(true); // Lock the buttons
    
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
        setIsStarting(false); // Unlock on API error
      }
    } catch (error) {
      setError(`Failed to start conversation: ${error.message}`);
      setIsStarting(false); // Unlock on network error
    }
  };

  const handleAddNewPet = () => {
    onClose();
    navigate('/pet-health-records');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center animate-fade-in" style={{ zIndex: 70 }}>
      <div className="relative w-[90%] md:w-[544px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl animate-scale-in flex flex-col"
           style={{
             boxShadow: '0px 20px 24px -4px rgba(10, 13, 18, 0.1), 0px 8px 8px -4px rgba(10, 13, 18, 0.04)',
             padding: '24px 24px 24px 24px', // Reduced padding slightly for mobile optimization
           }}>
        
        {/* Header */}
        <h2 className="w-full text-xl md:text-[22px] font-bold text-center mb-2" style={{ fontFamily: 'Raleway', color: '#181D27' }}>
          {conversationType === 'general' ? 'General Pet Healthcare' : 'Symptom Checker'}
        </h2>
        
        {/* Prompt - Made smaller on mobile to save space */}
        <p className="text-gray-700 mb-4 md:mb-6 text-center text-sm md:text-base" style={{ fontFamily: 'Raleway', color: '#535862' }}>
          {conversationType === 'general' 
            ? "Want to check what's normal for your pet? Let's start with: Do you want to check for an existing pet or add a new one?"
            : "Let's analyze your pet's symptoms. Do you want to check an existing pet or add a new one?"
          }
        </p>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Initial Selection Buttons */}
        {!selectedOption && (
          <div className="flex flex-col gap-3 md:gap-4 w-full">
            <button
              onClick={() => setSelectedOption('existing')}
              className="w-full py-3 rounded-lg font-semibold text-base md:text-lg transition-colors hover:brightness-90 hover:shadow-md"
              style={{ backgroundColor: '#815FB3', color: '#fff', fontFamily: 'Raleway', fontWeight: 600 }}
            >
              Existing Pet
            </button>
            <button
              onClick={() => setSelectedOption('new')}
              className="w-full py-3 rounded-lg font-semibold text-base md:text-lg transition-colors hover:brightness-90 hover:shadow-md"
              style={{ backgroundColor: '#F0E4B3', color: '#34113F', fontFamily: 'Raleway', fontWeight: 600 }}
            >
              Add New Pet
            </button>
          </div>
        )}

        {/* Existing Pet Selection */}
        {selectedOption === 'existing' && (
          <div className="w-full bg-white rounded-2xl p-4 md:p-6 flex flex-col items-center border border-gray-100" style={{ boxShadow: '0px 8px 16px -4px rgba(10,13,18,0.08)', marginTop: '8px' }}>
            <h3 className="w-full text-lg font-bold text-center mb-3" style={{ fontFamily: 'Raleway', color: '#181D27' }}>Select your pet:</h3>
            
            {loading ? (
              <div className="text-center py-4 w-full" style={{ fontFamily: 'Raleway', color: '#535862' }}>
                Loading pets...
              </div>
            ) : pets.length > 0 ? (
              // Adjusted height: max-h-[50vh] for mobile (bigger), max-h-60 for desktop (original)
              <div className="space-y-2 overflow-y-auto w-full max-h-[50vh] md:max-h-60 pr-1 custom-scrollbar">
                {pets.map(pet => (
                  <button
                    key={pet.id}
                    onClick={() => handleStartConversation(pet.id, false)}
                    disabled={isStarting}
                    className={`w-full p-3 rounded-lg font-semibold text-base transition-colors flex items-center gap-4 border border-gray-200 ${isStarting ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-90 hover:shadow-md hover:bg-[#ede7f6]'}`}
                    style={{ backgroundColor: '#F6F4FA', color: '#181D27', fontFamily: 'Raleway', fontWeight: 500, textAlign: 'left' }}
                  >
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border border-gray-300 mr-2 flex items-center justify-center bg-gray-100 shrink-0">
                      {pet.photo ? (
                        <img
                          src={getImageUrl(pet.photo)}
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/pawpalicon.png'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#E9E6F2] text-[#815FB3] font-bold text-lg md:text-xl">
                          {pet.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0" style={{ textAlign: 'left' }}>
                      <div className="font-medium text-[#34113F] text-left truncate">{pet.name}</div>
                      <div className="text-xs md:text-sm text-gray-500 text-left truncate">
                        {pet.species} • {pet.breed} • {pet.age} years old
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 w-full" style={{ fontFamily: 'Raleway' }}>
                <p>No pets found.</p>
                <button
                  onClick={handleAddNewPet}
                  className="mt-2 text-[#815FB3] hover:text-[#34113F] underline font-semibold"
                  style={{ fontFamily: 'Raleway', fontWeight: 600 }}
                >
                  Would you like to add a pet first?
                </button>
              </div>
            )}
            <button
              onClick={() => setSelectedOption(null)}
              className="w-full mt-4 p-2 text-gray-500 hover:text-gray-700 border-t pt-3 font-bold transition-colors hover:brightness-90 hover:shadow-md text-sm md:text-base"
              style={{ fontFamily: 'Raleway', fontWeight: 700 }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* New Pet Selection - SIMPLIFIED TEXT */}
        {selectedOption === 'new' && (
          <div className="w-full bg-white rounded-2xl p-4 md:p-6 flex flex-col items-center border border-gray-100" style={{ boxShadow: '0px 8px 16px -4px rgba(10,13,18,0.08)', marginTop: '8px' }}>
            <div className="w-full text-center">
              <p className="text-gray-700 mb-4 text-sm md:text-base" style={{ fontFamily: 'Raleway', color: '#535862' }}>
                Please create a profile for your new pet to continue.
              </p>
              <div className="space-y-3 w-full">
                <button
                  onClick={handleAddNewPet}
                  className="w-full py-3 rounded-lg font-semibold text-base md:text-lg transition-colors hover:brightness-90 hover:shadow-md"
                  style={{ backgroundColor: '#F0E4B3', color: '#34113F', fontFamily: 'Raleway', fontWeight: 600 }}
                >
                  Create Pet Profile
                  <div className="text-xs md:text-sm mt-1 opacity-90">
                    Go to Health Records
                  </div>
                </button>
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedOption(null)}
              className="w-full mt-4 p-2 text-gray-500 hover:text-gray-700 border-t pt-3 font-semibold transition-colors hover:brightness-90 hover:shadow-md text-sm md:text-base"
              style={{ fontFamily: 'Raleway', fontWeight: 600 }}
            >
              ← Back
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 md:mt-6 p-2 text-gray-500 hover:text-gray-700 border-t pt-4 transition-colors hover:brightness-90 hover:shadow-md text-sm md:text-base"
          style={{ fontFamily: 'Raleway', fontWeight: 600 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PetSelectionModal;
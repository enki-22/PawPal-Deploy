import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../context/ConversationsContext';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';
import LogoutModal from './LogoutModal';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState('New Chat');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [imageMenuVisible, setImageMenuVisible] = useState(false);
  const [chatMode, setChatMode] = useState(null); // 'general' or 'symptom_checker'
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [mlPredictions, setMlPredictions] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  
  // Use global conversations context
  const {
    conversations,
    loadingConversations,
    fetchConversations,
    handlePinConversation,
    handleRenameConversation,
    handleArchiveConversation,
    handleDeleteConversation
  } = useConversations();

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  // Load conversations and pets on component mount
  useEffect(() => {
    fetchConversations();
    fetchPets();
  }, []);

  // Fetch user's pets
  const fetchPets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pets/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setPets(response.data);
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || loading) return;

    const userMessage = messageInput.trim();
    setMessageInput('');
    setLoading(true);

    try {
      // Add user message to chat
      const userMsg = {
        id: Date.now() + Math.random(),
        content: userMessage,
        isUser: true,
        sender: 'You',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);

      // Get ML predictions if in symptom checker mode
      let mlData = null;
      if (chatMode === 'symptom_checker' && selectedPet) {
        try {
          const mlResponse = await axios.post(`${API_BASE_URL}/chatbot/predict/`, {
            symptoms: userMessage,
            species: selectedPet.animal_type,
            pet_id: selectedPet.id,
            image_url: imageAnalysis ? 'analyzed' : null
          }, {
            headers: { 'Authorization': `Token ${token}` }
          });
          mlData = mlResponse.data;
          setMlPredictions(mlData.predictions);
        } catch (error) {
          console.error('ML prediction error:', error);
        }
      }

      // Send message to chatbot API
      const response = await axios.post(`${API_BASE_URL}/chatbot/chat/`, {
        message: userMessage,
        conversation_id: currentConversationId,
        chat_mode: chatMode || 'general'
      }, {
        headers: { 'Authorization': `Token ${token}` }
      });

      const aiResponse = response.data.response;
      
      // Add AI response to chat
      const aiMsg = {
        id: Date.now() + Math.random() + 1,
        content: aiResponse,
        isUser: false,
        sender: 'PawPal',
        timestamp: new Date().toISOString(),
        mlPredictions: mlData ? mlData.predictions : null,
        severity: mlData ? mlData.severity : null,
        urgency: mlData ? mlData.urgency : null,
        confidence: mlData ? mlData.confidence_score : null,
        petContext: mlData ? mlData.pet_context : null
      };
      
      setMessages(prev => [...prev, aiMsg]);

      // Update conversation ID and title
      if (response.data.conversation_id) {
        setCurrentConversationId(response.data.conversation_id);
        setCurrentConversationTitle(response.data.conversation_title || 'New Chat');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = {
        id: Date.now() + Math.random(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        sender: 'PawPal',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(`${API_BASE_URL}/chatbot/upload-image/`, formData, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setImageAnalysis(response.data.image_analysis);
      
      // Add image message to chat
      const imageMsg = {
        id: Date.now() + Math.random(),
        content: `📷 Image uploaded and analyzed`,
        isUser: true,
        sender: 'You',
        timestamp: new Date().toISOString(),
        imageAnalysis: response.data.image_analysis
      };
      setMessages(prev => [...prev, imageMsg]);

    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleModeSelect = (mode) => {
    setChatMode(mode);
    setShowModeSelection(false);
    setMessages([]);
    setCurrentConversationId(null);
    setMlPredictions(null);
    setImageAnalysis(null);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setCurrentConversationTitle('New Chat');
    setMlPredictions(null);
    setImageAnalysis(null);
    setShowModeSelection(true);
    setChatMode(null);
  };

  const handlePetSelect = (pet) => {
    setSelectedPet(pet);
  };

  // ML Predictions Display Component
  const MLPredictionsDisplay = ({ predictions, severity, urgency, confidence }) => {
    if (!predictions || predictions.length === 0) return null;

    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'critical': return 'text-red-600 bg-red-50';
        case 'high': return 'text-orange-600 bg-orange-50';
        case 'moderate': return 'text-yellow-600 bg-yellow-50';
        case 'low': return 'text-green-600 bg-green-50';
        default: return 'text-gray-600 bg-gray-50';
      }
    };

    const getUrgencyIcon = (urgency) => {
      switch (urgency) {
        case 'emergency': return '🚨';
        case 'immediate': return '⚡';
        case 'soon': return '⏰';
        case 'routine': return '📅';
        default: return 'ℹ️';
      }
    };

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
          🧠 AI Symptom Analysis
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className={`p-3 rounded-lg ${getSeverityColor(severity)}`}>
            <div className="font-medium">Severity: {severity?.toUpperCase()}</div>
            <div className="text-sm">Confidence: {(confidence * 100).toFixed(1)}%</div>
          </div>
          <div className="p-3 rounded-lg bg-blue-100">
            <div className="font-medium flex items-center">
              {getUrgencyIcon(urgency)} Urgency: {urgency?.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h5 className="font-medium text-gray-700">Top Predictions:</h5>
          {predictions.map((pred, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
              <span className="font-medium">{pred.label}</span>
              <span className="text-sm text-gray-600">
                {(pred.confidence * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Image Analysis Display Component
  const ImageAnalysisDisplay = ({ analysis }) => {
    if (!analysis) return null;

    return (
      <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <h5 className="font-medium text-purple-800 mb-2">📷 Image Analysis:</h5>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(analysis).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key.replace('_', ' ')}:</span>
              <span className="font-medium">{(value * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Mode Selection Component
  const ModeSelection = () => (
    <div className="flex-1 flex items-center justify-center bg-[#F0F0F0] p-6">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-[40px] font-bold text-gray-900 mb-3" style={{ fontFamily: 'Raleway' }}>
            Hello, {user?.username || 'User'}! 👋
          </h1>
          <p className="text-[16px] text-gray-600" style={{ fontFamily: 'Raleway' }}>
            How can I assist you and your furry friend today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General Pet Care Mode */}
          <div 
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-300"
            onClick={() => handleModeSelect('general')}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🐾</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">General Pet Care</h3>
              <p className="text-gray-600 mb-4">
                Get advice on pet health, behavior, nutrition, and general care questions.
              </p>
              <div className="text-sm text-blue-600 font-medium">
                Perfect for new pet owners
              </div>
            </div>
          </div>

          {/* Symptom Checker Mode */}
          <div 
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-red-300"
            onClick={() => handleModeSelect('symptom_checker')}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏥</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Symptom Checker</h3>
              <p className="text-gray-600 mb-4">
                Describe your pet's symptoms and get AI-powered analysis with urgency assessment.
              </p>
              <div className="text-sm text-red-600 font-medium">
                Includes ML predictions + Image analysis
              </div>
            </div>
          </div>
        </div>

        {/* Pet Selection for Symptom Checker */}
        {chatMode === 'symptom_checker' && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Pet for Analysis:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedPet?.id === pet.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handlePetSelect(pet)}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-lg">🐕</span>
                    </div>
                    <div className="font-medium">{pet.name}</div>
                    <div className="text-sm text-gray-600">{pet.animal_type} • {pet.age}y</div>
                  </div>
                </div>
              ))}
            </div>
            {selectedPet && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <div className="text-green-800 font-medium">
                  ✅ Selected: {selectedPet.name} ({selectedPet.animal_type})
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  );

  // Main Chat Interface
  const ChatInterface = () => (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{currentConversationTitle}</h2>
          {chatMode && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              chatMode === 'symptom_checker' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {chatMode === 'symptom_checker' ? '🏥 Symptom Checker' : '🐾 General Care'}
            </span>
          )}
        </div>
        <button
          onClick={handleNewChat}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Chat
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl p-4 rounded-lg ${
              message.isUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="font-medium mb-1">{message.sender}</div>
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* ML Predictions Display */}
              {message.mlPredictions && (
                <MLPredictionsDisplay 
                  predictions={message.mlPredictions}
                  severity={message.severity}
                  urgency={message.urgency}
                  confidence={message.confidence}
                />
              )}
              
              {/* Image Analysis Display */}
              {message.imageAnalysis && (
                <ImageAnalysisDisplay analysis={message.imageAnalysis} />
              )}
              
              <div className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>PawPal is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Upload Menu */}
      {imageMenuVisible && (
        <div className="absolute bottom-20 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <button
            onClick={() => {
              setImageMenuVisible(false);
              fileInputRef.current?.click();
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>📁</span>
            <span>Upload from Gallery</span>
          </button>
          <button
            onClick={() => {
              setImageMenuVisible(false);
              cameraInputRef.current?.click();
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 rounded flex items-center space-x-2"
          >
            <span>📷</span>
            <span>Take Photo</span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setImageMenuVisible(!imageMenuVisible)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            ) : (
              <span className="text-xl">📷</span>
            )}
          </button>
          
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={chatMode === 'symptom_checker' ? "Describe your pet's symptoms..." : "Ask about pet care..."}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={loading || !messageInput.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarVisible && (
        <Sidebar
          conversations={conversations}
          loadingConversations={loadingConversations}
          currentConversationId={currentConversationId}
          onConversationSelect={(conversation) => {
            setCurrentConversationId(conversation.id);
            setCurrentConversationTitle(conversation.title);
            setShowModeSelection(false);
            // Load conversation messages here
          }}
          onPinConversation={handlePinConversation}
          onRenameConversation={handleRenameConversation}
          onArchiveConversation={handleArchiveConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewChat={handleNewChat}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Profile Button */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-end">
          <ProfileButton
            user={user}
            onLogout={() => setShowLogoutModal(true)}
          />
        </div>

        {/* Chat Content */}
        {showModeSelection ? <ModeSelection /> : <ChatInterface />}
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => {
            logout();
            navigate('/login');
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
};

export default Chat;

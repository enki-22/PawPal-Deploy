import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../context/ConversationsContext';
import AssessmentResults from './AssessmentResults';
import ConversationalSymptomChecker from './ConversationalSymptomChecker';
import EmergencyOverlay from './EmergencyOverlay';
import LogoutModal from './LogoutModal';
import PetSelectionModal from './PetSelectionModal';
import ProfileButton from './ProfileButton';
import Sidebar from './Sidebar';
import SymptomLogger from './SymptomLogger';

// TypingIndicator Component
const TypingIndicator = () => (
  <div className="flex justify-start mb-4">
    <div className="bg-[#FFFFF2] px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex items-center space-x-1">
      <div className="w-2 h-2 bg-[#815FB3] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-[#815FB3] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-[#815FB3] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
);
// Helper to parse **text** into bold elements
const renderFormattedText = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const Chat = () => {
  // --- STATE ---
  const [messages, setMessages] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const { conversationId } = useParams();
  const [currentConversationTitle, setCurrentConversationTitle] = useState('New Chat');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [chatMode, setChatMode] = useState(null); 
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [currentPetContext, setCurrentPetContext] = useState(null);
  const [showSymptomChecker, setShowSymptomChecker] = useState(false);
  const [showSymptomLogger, setShowSymptomLogger] = useState(false);
  const [assessmentData, setAssessmentData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  
  // --- REFS ---
  const activeConversationIdRef = useRef(conversationId);
  // Tracks a unique session ID to invalidate stale requests (ref for guards)
  const chatSessionIdRef = useRef(Date.now());
  const chatContainerRef = useRef(null);
  
  // State-based session key to ensure components remount properly (state triggers re-render)
  const [sessionKey, setSessionKey] = useState(() => Date.now());
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout, loading: authLoading } = useAuth();
  
  //const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  const API_BASE_URL = `${API_ROOT}/api`;

  const {
    conversations,
    loadingConversations,
    fetchConversations,
    handlePinConversation,
    handleRenameConversation,
    handleArchiveConversation,
    handleDeleteConversation
  } = useConversations();

  useEffect(() => {
    // Only kick user out if we are done loading AND there is no user
    // Note: You need to grab 'loading' from useAuth() at the top of this component first!
    if (!authLoading && !user) {
      window.location.replace('/petowner/login');
    }
  }, [user, authLoading]);

  // Update ref whenever conversationId changes
  useEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  // --- CORE LOGIC ---

  // Helper to completely reset the view state and generate a new session ID
  const startNewSession = useCallback(() => {
    // Generate new session ID immediately to invalidate ANY pending requests from previous views
    const newSessionId = Date.now();
    chatSessionIdRef.current = newSessionId;
    setSessionKey(newSessionId); // State-based key triggers proper re-renders for component remounting
    
    setMessages([]);
    setAssessmentData(null); // <--- Clears old assessment data
    setCurrentPetContext(null);
    setShowSymptomChecker(false);
    setShowSymptomLogger(false);
    setIsAnalyzing(false);
    setLoading(false);
    setCurrentConversationId(null);
    setCurrentConversationTitle('New Chat');
    setChatMode(null);
  }, []);

  const loadConversation = useCallback(async (targetId) => {
    // Capture the session ID at the START of the request
    const mySessionId = chatSessionIdRef.current;

    try {
      const response = await axios.get(`${API_BASE_URL}/chatbot/conversations/${targetId}/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });

      // === RACE CONDITION GUARD ===
      // If the session ID has changed since we started (user clicked away), abort.
      if (chatSessionIdRef.current !== mySessionId) {
         return;
      }

      if (response.data) {
        setCurrentConversationId(targetId);
        setCurrentConversationTitle(response.data.conversation.title);
        
        if (response.data.pet_context) {
          setCurrentPetContext(response.data.pet_context);
        } else {
          setCurrentPetContext(null);
        }

        const formattedMessages = response.data.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.isUser,
          sender: msg.sender,
          timestamp: msg.timestamp,
        }));
        
        // Determine conversation mode from title FIRST
        let detectedMode = null;
        if (response.data.conversation.title.includes('Symptom Check:')) {
          detectedMode = 'symptom_checker';
        } else if (response.data.conversation.title.includes('Pet Care:')) {
          detectedMode = 'general';
        }
        
        // Set the mode before handling assessment data
        if (detectedMode) {
          setChatMode(detectedMode);
        }
        
        // Handle existing assessment(s) in the conversation
        // CRITICAL: Only load assessment data for symptom_checker mode conversations
        if (detectedMode === 'symptom_checker') {
          // Check for full assessment history first (new format)
          if (response.data.assessments_history && Array.isArray(response.data.assessments_history) && response.data.assessments_history.length > 0) {
            // Set the latest assessment (first in array, sorted newest-first) for follow-up context
            setAssessmentData(response.data.assessments_history[0]);
            
            // Create assessment messages for ALL assessments in history
            response.data.assessments_history.forEach((assessment) => {
              const assessmentMessage = {
                id: `assessment-${assessment.case_id}`,
                content: '',
                isUser: false,
                sender: 'PawPal',
                timestamp: assessment.date_generated || assessment.created_at || new Date().toISOString(),
                isAssessment: true,
                assessmentData: assessment
              };
              formattedMessages.push(assessmentMessage);
            });
            
            // Has assessments - don't show the questionnaire
            setShowSymptomChecker(false);
          } 
          // Fallback: Backward compatibility with single assessment_data
          else if (response.data.assessment_data) {
            const assessmentData = response.data.assessment_data;
            setAssessmentData(assessmentData);
            
            const hasAssessmentMessage = formattedMessages.some(msg => msg.isAssessment);
            if (!hasAssessmentMessage) {
              const assessmentMessage = {
                id: `assessment-${assessmentData.case_id || targetId}-${Date.now()}`,
                content: '',
                isUser: false,
                sender: 'PawPal',
                timestamp: assessmentData.date_generated || assessmentData.created_at || new Date().toISOString(),
                isAssessment: true,
                assessmentData: assessmentData
              };
              formattedMessages.push(assessmentMessage);
            }
            // Has assessment - don't show the questionnaire
            setShowSymptomChecker(false);
          } else {
            // Clear assessment data for non-symptom-checker conversations
            setAssessmentData(null);
            
            // === FIX: For NEW symptom checker conversations (no assessment yet), show the questionnaire ===
            // Check if this is a symptom checker conversation that needs the questionnaire shown
            // Note: pet_context might be a dummy context for "Continue Without Details" flow
            if (detectedMode === 'symptom_checker') {
              // This is a new symptom checker conversation - show the questionnaire
              // If no pet_context, create a dummy one for the questionnaire to work
              if (!response.data.pet_context) {
                setCurrentPetContext({
                  id: 0,
                  name: 'Your Pet',
                  species: 'Pet',
                  breed: 'Unknown',
                  age: 0
                });
              }
              setShowSymptomChecker(true);
            } else {
              setShowSymptomChecker(false);
            }
          }
        }
        
        // Always reset symptom logger when loading a conversation
        setShowSymptomLogger(false);
        
        // CRITICAL: Sort all messages (including assessments) by timestamp (ascending)
        // This ensures assessments appear chronologically between user messages, not all bunched at the end
        formattedMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        
        setMessages(formattedMessages);
      } else {
        // Fallback for empty data if still on same session
        if (chatSessionIdRef.current === mySessionId) {
            setMessages([]);
            setAssessmentData(null);
            setCurrentPetContext(null);
        }
      }
    } catch (err) {
      // Only reset if we are still in the relevant session
      if (chatSessionIdRef.current === mySessionId) {
        console.error('Error loading conversation:', err);
        setMessages([]);
        setAssessmentData(null);
        setCurrentPetContext(null);
      }
    }
  }, [API_BASE_URL, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  // Auto-scroll when symptom logger opens
  useEffect(() => {
    if (showSymptomLogger) {
      scrollToBottom();
    }
  }, [showSymptomLogger]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Handle location state from symptom tracker (worsening trend alert)
  useEffect(() => {
    if (location.state && location.state.mode === 'symptom_checker' && location.state.reason === 'worsening_trend') {
      // Set chat mode to symptom_checker
      setChatMode('symptom_checker');
      
      // If pet context is provided, set it
      if (location.state.petId) {
        // You may want to fetch the full pet details here
        // For now, we'll set a basic context
        setCurrentPetContext({
          id: location.state.petId,
          name: location.state.petName || 'Your Pet',
          species: 'Pet',
          breed: 'Unknown',
          age: 0
        });
      }
      
      // Show symptom checker immediately
      setShowSymptomChecker(true);
      
      // Optionally, you could add a message about the worsening trend
      if (location.state.history_summary) {
        const trendMessage = {
          id: `trend-${Date.now()}`,
          content: `⚠️ **Worsening Trend Detected**\n\n${location.state.history_summary}\n\nPlease complete the symptom assessment below to get updated insights.`,
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString()
        };
        setMessages([trendMessage]);
      }
    }
  }, [location.state]);

  // Main Effect to handle URL changes
  useEffect(() => {
      fetchConversations();
      
      // Always reset state and start new session when URL changes
      // BUT: Don't reset if we're coming from symptom tracker with state
      if (!location.state || location.state.mode !== 'symptom_checker') {
        startNewSession();
      }
      
      if (conversationId && conversationId !== 'new') {
        // If it's a real ID, load it
        loadConversation(conversationId);
      } 
      // If 'new', startNewSession already cleared everything (unless we have location state).
    }, [fetchConversations, conversationId, loadConversation, startNewSession, location.state]);

  // --- HANDLERS ---

  const handleSidebarConversationSelect = (id) => {
    navigate(`/chat/${id}`);
    setIsMobileSidebarOpen(false);
  };

  const createNewConversation = async () => {
    try {
      navigate('/chat/new');
      // Force manual reset in case we are already on /chat/new
      startNewSession();
      fetchConversations();
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  const pinConversation = (conversationId, shouldPin) => {
    handlePinConversation(conversationId, shouldPin);
  };

  const renameConversation = (conversationId, newTitle) => {
    if (conversationId === currentConversationId) {
      setCurrentConversationTitle(newTitle);
    }
    handleRenameConversation(conversationId, newTitle);
  };

  const archiveConversation = (conversationId) => {
    if (conversationId === currentConversationId) {
      navigate('/chat/new');
    }
    handleArchiveConversation(conversationId);
  };

  const deleteConversation = (conversationId) => {
    if (conversationId === currentConversationId) {
      navigate('/chat/new');
    }
    handleDeleteConversation(conversationId);
  };

  const handlePetSelected = (conversationData) => {
    // === CRITICAL FIX: Start a fresh session for the new pet selection ===
    // This invalidates any pending requests from previous views immediately
    const newSessionId = Date.now();
    chatSessionIdRef.current = newSessionId;
    setSessionKey(newSessionId); // Update state-based key to force component remounts
    
    // Explicitly clear ALL assessment-related state from any previous session
    setAssessmentData(null); 
    setIsAnalyzing(false);
    setShowSymptomChecker(false);
    setShowSymptomLogger(false);
    // Clear any lingering messages from previous sessions
    setMessages([]);

    // If backend returned a real conversation ID, navigate there
    if (conversationData.conversation_id) {
        // IMPORTANT: Don't navigate if we're creating a new conversation that shouldn't have old data
        // First clear state, then navigate - the URL effect will handle loading
        navigate(`/chat/${conversationData.conversation_id}`);
    } else {
        // Draft mode (New Chat with Pet Context)
        setCurrentConversationId(null);
        setCurrentPetContext(conversationData.pet_context);
        setCurrentConversationTitle(conversationData.conversation_title || 'New Chat');
        
        const initialMessage = {
            id: `msg-${newSessionId}-init`,
            content: conversationData.initial_message,
            isUser: false,
            sender: 'PawPal',
            timestamp: new Date().toISOString(),
            _sessionId: newSessionId, // Tag message with session ID
        };
        setMessages([initialMessage]);
        
        // Only show symptom checker in symptom_checker mode
        if (chatMode === 'symptom_checker') {
            setShowSymptomChecker(true);
        } else {
            // CRITICAL: In general mode, never show symptom checker
            setShowSymptomChecker(false);
        }
        setShowSymptomLogger(false);
    }
    
    fetchConversations();
  };

  const selectMode = (mode) => {
    // Clear any lingering assessment data when selecting a mode
    setAssessmentData(null);
    setShowSymptomChecker(false);
    setShowSymptomLogger(false);
    setMessages([]);
    
    setChatMode(mode);
    setShowPetSelection(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = messageInput.trim();
    if (!message || loading) return;
    
    const mySessionId = chatSessionIdRef.current;

    const usedChatMode = chatMode || 'general';
    const usedPetContext = currentPetContext || null;

    const userMessage = {
      id: Date.now() + Math.random(),
      content: message,
      isUser: true,
      sender: 'You',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/chatbot/chat/`,
        {
          message: message,
          conversation_id: currentConversationId,
          chat_mode: usedChatMode,
          pet_context: usedPetContext,
          assessment_context: assessmentData
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Token ${token}` : '',
          },
          timeout: 90000,
        }
      );

      // Guard against session switch
      if (chatSessionIdRef.current !== mySessionId) return;

      if (response.data && response.data.response) {
        let aiResponseText = response.data.response;
        let shouldShowLogger = false;
        
        // Check for [[TRIGGER_LOG_UI]] tag
        if (aiResponseText.includes('[[TRIGGER_LOG_UI]]')) {
          // Remove the tag from the response text
          aiResponseText = aiResponseText.replace('[[TRIGGER_LOG_UI]]', '').trim();
          shouldShowLogger = true;
        }
        
        const aiMessage = {
          id: Date.now() + Math.random(),
          content: aiResponseText,
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Open symptom logger if tag was detected
        if (shouldShowLogger && currentPetContext) {
          setShowSymptomLogger(true);
        }
        
        if (response.data.conversation_id && !currentConversationId) {
          setCurrentConversationId(response.data.conversation_id);
          // Update URL silently so reload works
          window.history.replaceState(null, '', `/chat/${response.data.conversation_id}`);
        }
        if (response.data.conversation_title) {
          setCurrentConversationTitle(response.data.conversation_title);
        }
      }
      fetchConversations();
    } catch (error) {
      if (chatSessionIdRef.current === mySessionId) {
        console.error('Error:', error);
        const errorMessage = {
          id: Date.now() + Math.random(),
          content: 'Sorry, there was an error processing your message. Please try again.',
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      if (chatSessionIdRef.current === mySessionId) {
        setLoading(false);
      }
    }
  };

  // Auto-resize handler for textarea and Enter-to-send (shift+Enter for newline)
  const handleInputResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
    setMessageInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Animation variants for staggered message loading
  const listContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const messageItemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownVisible && !event.target.closest('.dropdown-container')) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownVisible]);

  // --- LOGOUT HANDLERS ---
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      setLoading(true);
      await logout();
      navigate('/petowner/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleSymptomCheckerComplete = async (payload) => {
    // === CRITICAL: Verify the callback is from the current session ===
    // The payload includes _sessionId from the ConversationalSymptomChecker
    if (payload._sessionId && payload._sessionId !== chatSessionIdRef.current) {
      console.log('handleSymptomCheckerComplete: Ignoring stale callback from previous session');
      return;
    }
    
    // === CRITICAL: Only process assessments in symptom_checker mode ===
    if (chatMode !== 'symptom_checker') {
      console.log('handleSymptomCheckerComplete: Ignoring callback - not in symptom_checker mode');
      return;
    }
    
    // Capture session ID when assessment starts
    const mySessionId = chatSessionIdRef.current;

    // Hybrid Triage: Combine typed symptoms from text box with chat history
    const recentUserMessages = messages
        .filter(m => m.isUser)
        .slice(-3)
        .map(m => m.content)
        .join(' ');
    
    // Merge user_notes from payload (typed symptoms) with chat history
    const combinedNotes = [payload.user_notes, recentUserMessages]
        .filter(Boolean)
        .join(' ');
        
    setShowSymptomChecker(false);
    setIsAnalyzing(true);
    
    const summaryMessage = {
      id: Date.now() + Math.random(),
      content: `Assessment completed for ${payload.pet_name}`,
      isUser: true,
      sender: 'You',
      timestamp: new Date().toISOString(),
    };
    
    const analyzingMessage = {
      id: Date.now() + Math.random() + 1,
      content: `Analyzing ${payload.pet_name}'s symptoms...`,
      isUser: false,
      sender: 'PawPal',
      timestamp: new Date().toISOString(),
      isAnalyzing: true
    };
    setMessages(prev => [...prev, summaryMessage, analyzingMessage]);
    
    try {
      const predictionPayload = {
        ...payload,
        pet_id: currentPetContext?.id,
        user_notes: combinedNotes // Send combined symptoms to backend
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/symptom-checker/predict/`,
        predictionPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Token ${token}` : '',
          },
          timeout: 90000,
        }
      );
      
      // === RACE CONDITION CHECK ===
      // If user switched chats while waiting, ignore everything.
      if (chatSessionIdRef.current !== mySessionId) {
        console.log('Assessment result discarded: User switched sessions.');
        return;
      }

      if (response.data && response.data.success) {
        setMessages(prev => prev.filter(msg => !msg.isAnalyzing));
        setAssessmentData(response.data);
        
        const assessmentMessage = {
          id: Date.now() + Math.random() + 2,
          content: '',
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString(),
          isAssessment: true,
          assessmentData: response.data
        };
        setMessages(prev => [...prev, assessmentMessage]);
        
        // === AUTO-SAVE: Automatically save assessment to backend for persistence ===
        // This ensures the assessment is available when the user returns to this conversation
        try {
          const saveResponse = await axios.post(
            `${API_BASE_URL}/chatbot/create-ai-diagnosis/`,
            {
              pet_id: currentPetContext?.id,
              symptoms: response.data.symptoms_text || payload.symptoms_text || 'Symptom assessment completed',
              assessment_data: response.data,
              conversation_id: currentConversationId
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Token ${token}` : '',
              },
            }
          );
          
          if (saveResponse.data) {
            console.log('Assessment auto-saved successfully. Case ID:', saveResponse.data.case_id);
            // Update the assessment data with the case_id for reference
            setAssessmentData(prev => ({ ...prev, case_id: saveResponse.data.case_id }));
          }
        } catch (saveError) {
          // Don't fail the whole flow if auto-save fails - assessment is still shown to user
          console.warn('Auto-save of assessment failed:', saveError);
        }
      } else {
        throw new Error(response.data?.error || 'Assessment failed');
      }
    } catch (error) {
      if (chatSessionIdRef.current === mySessionId) {
        console.error('Assessment error:', error);
        setMessages(prev => prev.filter(msg => !msg.isAnalyzing));
        
        const errorDetails = error.response?.data?.error || 'Unknown error';
        const errorMessage = {
          id: Date.now() + Math.random() + 3,
          content: `Sorry, I encountered an error while analyzing the symptoms: ${errorDetails}. Please try again.`,
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      if (chatSessionIdRef.current === mySessionId) {
        setIsAnalyzing(false);
      }
    }
  };
  
  const handleSymptomCheckerCancel = () => {
    setShowSymptomChecker(false);
    setIsAnalyzing(false);
    // Don't clear assessmentData here - only clear the active checker
  };
  
  const handleSaveToAIDiagnosis = async (assessmentDataToSave) => {
    // Check if already saved (has case_id from auto-save)
    if (assessmentDataToSave.case_id) {
      const alreadySavedMessage = {
        id: Date.now() + Math.random(),
        content: `✅ This assessment is already saved to Triage Summary records. Case ID: ${assessmentDataToSave.case_id}`,
        isUser: false,
        sender: 'PawPal',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, alreadySavedMessage]);
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/chatbot/create-ai-diagnosis/`,
        {
          pet_id: currentPetContext?.id,
          symptoms: assessmentDataToSave.symptoms_text || 'Symptom assessment completed',
          assessment_data: assessmentDataToSave,
          conversation_id: currentConversationId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Token ${token}` : '',
          },
        }
      );
      
      if (response.data) {
        const successMessage = {
          id: Date.now() + Math.random(),
          content: `✅ Assessment saved to AI Diagnosis records. Case ID: ${response.data.case_id}`,
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, successMessage]);
        // Update assessmentData with case_id
        setAssessmentData(prev => ({ ...prev, case_id: response.data.case_id }));
      }
    } catch (error) {
      console.error('Save to AI Diagnosis error:', error);
      const errorMessage = {
        id: Date.now() + Math.random(),
        content: 'Sorry, there was an error saving the assessment. Please try again.',
        isUser: false,
        sender: 'PawPal',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };
  
  const handleStartNewAssessment = () => {
    // If not in symptom_checker mode, switch to it first
    if (chatMode !== 'symptom_checker') {
      // Switch to symptom_checker mode
      setChatMode('symptom_checker');
      // If no pet is selected, show pet selection
      if (!currentPetContext) {
        setShowPetSelection(true);
        return;
      }
    }
    
    // Clear previous assessment data
    setAssessmentData(null);
    setIsAnalyzing(false);
    
    // Remove any existing assessment messages from the current conversation
    setMessages(prev => prev.filter(msg => !msg.isAssessment));
    
    // Show the symptom checker
    setShowSymptomChecker(true);
  };
  
  const handleAskFollowUp = () => {
    document.querySelector('input[type="text"]')?.focus();
  };

  const handleLogSymptoms = () => {
    setShowSymptomLogger(true);
  };

  const handleSymptomLogComplete = (response) => {
    setShowSymptomLogger(false);
    
    // Fix: Handle both 'risk_assessment' (old) and 'analysis' (new) formats
    const riskData = response.risk_assessment || response.analysis || {};
    const riskLevel = riskData.level || riskData.urgency_level || 'unknown';
    const riskScore = riskData.score ?? riskData.risk_score ?? 0;
    
    const successMessage = {
      id: Date.now() + Math.random(),
      content: `✅ Symptoms logged successfully for ${currentPetContext.name}! Risk Level: ${riskLevel.toUpperCase()} (${riskScore}/100)`,
      isUser: false,
      sender: 'PawPal',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, successMessage]);
    
    // Check for alerts (support both formats)
    const alertMessage = response.alert?.alert_message || response.analysis?.trend_analysis;
    
    // Check if we need to show the emergency overlay
    const isCritical = (
      riskLevel.toLowerCase() === 'critical' || 
      riskLevel.toLowerCase() === 'high' || 
      response.alert?.alert_type === 'risk_escalation' ||
      response.analysis?.alert_needed
    );

    if (isCritical) {
       setEmergencyAlert(alertMessage || "Critical symptoms detected.");
    } else if (response.alert) {
       // Standard alert message
       const msg = {
          id: Date.now() + Math.random() + 1,
          content: `⚠️ ALERT: ${response.alert.alert_message}`,
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString(),
       };
       setMessages(prev => [...prev, msg]);
    }
  };

  const handleSymptomLogCancel = () => {
    setShowSymptomLogger(false);
  };

  const ModeSelection = () => (
    <div className="flex-1 flex items-center justify-center bg-[#F0F0F0] p-2 md:pt-2 md:pb-6">
      <div className="max-w-xs md:max-w-2xl lg:max-w-6xl w-full">
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-[32px] font-bold text-gray-900 mb-2 md:text-[40px] md:mb-3" style={{ fontFamily: 'Raleway' }}>
            Hello, {user?.username || 'User'}!
          </h1>
          <p className="text-[15px] text-gray-600 md:text-[16px]" style={{ fontFamily: 'Raleway' }}>
            How can I assist you and your furry friend today?
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-8 w-full">
          <div className="flex-shrink-0 mb-4 md:mb-0 w-full flex justify-center items-center md:block md:w-auto">
            <img
              src="/amico.png"
              alt="AI Assistant Illustration"
              className="w-40 h-40 md:w-72 md:h-72 object-contain"
            />
          </div>
          <div className="flex flex-col gap-2 md:gap-4 w-full max-w-xs md:max-w-xl">
            {/* Purple General Card */}
            <div
              onClick={() => selectMode('general')}
              className="rounded-2xl p-6 cursor-pointer w-full min-h-[130px] transition-colors"
              style={{ backgroundColor: '#DCCEF1' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c9b8e8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DCCEF1'}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center">
                  <img
                    src="/Frame.png"
                    alt="Frame icon"
                    className="w-5 h-5"
                    style={{ filter: 'brightness(0) saturate(100%) invert(59%) sepia(23%) saturate(4832%) hue-rotate(278deg) brightness(96%) contrast(90%)' }}
                  />
                </div>
                <span className="text-[16px] font-bold" style={{ fontFamily: 'Raleway', color: '#000000' }}>
                  What&apos;s normal for my pet?
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-gray-700" style={{ fontFamily: 'Raleway' }}>
                Learn about typical behaviors, habits, diet, and health patterns specific to your pet&apos;s breed, age, and species. Perfect for new pet parents or anyone looking to better understand what&apos;s considered &quot;normal&quot; for their furry companion.
              </p>
            </div>
            
            {/* Yellow Symptom Checker Card */}
            <div
              onClick={() => selectMode('symptom_checker')}
              className="bg-[#FFF4C9] rounded-2xl p-6 cursor-pointer hover:bg-[#fff0b3] transition-colors w-full min-h-[130px]"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-9 h-9 bg-yellow-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <span className="text-[16px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                  Symptom Checker
                </span>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                Not sure if your pet&apos;s symptoms are serious? Use our AI-powered Symptom Checker to get insights into possible causes based on current signs and behaviors. While not a replacement for a vet, it&apos;s a helpful first step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col md:flex-row overflow-hidden">
      {/* Emergency Overlay - Shown when critical risk detected */}
      {emergencyAlert && (
        <EmergencyOverlay
          alertMessage={emergencyAlert}
          onDismiss={() => setEmergencyAlert(null)}
          onReassess={() => {
            setEmergencyAlert(null);
            handleStartNewAssessment();
          }}
        />
      )}
      
      <div className="hidden md:block sticky top-0 h-screen z-30">
        <Sidebar
          sidebarVisible={sidebarVisible}
          currentPage="chat"
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          showSearch={true}
          showPinnedChats={true}
          showRecentChats={true}
          conversations={conversations}
          currentConversationId={currentConversationId}
          loadingConversations={loadingConversations}
          onLoadConversation={handleSidebarConversationSelect}
          onCreateNewConversation={createNewConversation}
          onPinConversation={pinConversation}
          onRenameConversation={renameConversation}
          onArchiveConversation={archiveConversation}
          onDeleteConversation={deleteConversation}
          isMobileOverlay={false}
        />
      </div>

      <div
        className={`
          md:hidden fixed inset-0 z-50 flex
          transition-opacity duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`
            w-80 h-full
            transition-transform duration-300 ease-in-out transform
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            bg-[#DCCEF1]
          `}
        >
          <Sidebar
            sidebarVisible={true}
            currentPage="chat"
            onToggleSidebar={() => setIsMobileSidebarOpen(false)}
            showSearch={true}
            showPinnedChats={true}
            showRecentChats={true}
            conversations={conversations}
            currentConversationId={currentConversationId}
            loadingConversations={loadingConversations}
            onLoadConversation={handleSidebarConversationSelect}
            onCreateNewConversation={() => {
              createNewConversation();
              setIsMobileSidebarOpen(false);
            }}
            onPinConversation={pinConversation}
            onRenameConversation={renameConversation}
            onArchiveConversation={archiveConversation}
            onDeleteConversation={deleteConversation}
            isMobileOverlay={true}
          />
        </div>
        
        <div 
          className="flex-1 bg-black bg-opacity-50" 
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        ></div>
      </div>

      <div className="flex-1 flex flex-col bg-[#F0F0F0] h-screen w-full">
        <div className="border-b p-2 md:p-4 flex flex-row items-center justify-between gap-2 md:gap-0 sticky top-0 z-20 bg-[#F0F0F0]">
          <div
            className="flex items-center gap-2 md:hidden w-full justify-between"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              zIndex: 100,
              background: '#DCCEF1',
              padding: '0.5rem 1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div className="flex items-center gap-2">
              <img src="/pat-removebg-preview 1.png" alt="PawPal Logo" className="w-8 h-8" />
              <span className="font-bold text-lg text-[#815FB3]" style={{ fontFamily: 'Raleway' }}>PAWPAL</span>
              <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 ml-2" aria-label="Open sidebar">
                <img src="/sidebar-expand-icon.png" alt="Sidebar Toggle" className="w-6 h-6" style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
          <div className="hidden md:flex items-center gap-2 md:gap-4 w-full justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <h2 className="text-lg md:text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                {currentConversationTitle}
              </h2>
            </div>
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
        </div>
        <div className="md:hidden px-4 pt-2 pb-0" style={{ background: '#F0F0F0', paddingTop: '56px' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            {currentConversationTitle}
          </h2>
        </div>

        <div 
          ref={chatContainerRef}
          className={`flex-1 overflow-y-auto bg-[#F0F0F0] px-2 pt-2 md:p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 ${
            (conversationId === 'new' || !conversationId) && messages.length === 0 && !currentPetContext 
              ? 'pb-6' 
              : 'pb-40'
          }`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9CA3AF #F0F0F0',
            paddingTop: (conversationId === 'new' || !conversationId) ? '20px' : '0',
          }}
        >
          <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto w-full">
            {(conversationId === 'new' || !conversationId) && messages.length === 0 && !currentPetContext && (
              <div className="hidden md:block">
                <ModeSelection />
              </div>
            )}

            {(conversationId === 'new' || !conversationId) && messages.length === 0 && !currentPetContext && (
              <div className="block md:hidden">
                <div className="flex-1 flex items-center justify-center bg-[#F0F0F0] p-2 pt-2 pb-4">
                  <div className="max-w-xs w-full">
                    <div className="text-center mb-4">
                      <h1 className="text-[30px] font-bold text-gray-900 mb-1" style={{ fontFamily: 'Raleway' }}>
                        Hello, {user?.username || 'User'}!
                      </h1>
                      <p className="text-[12px] text-gray-600" style={{ fontFamily: 'Raleway' }}>
                        How can I assist you and your furry friend today?
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-4 w-full">
                      <div className="mb-2 flex justify-center">
                        <img
                          src="/amico.png"
                          alt="AI Assistant Illustration"
                          className="w-45 h-45 object-contain mx-auto"
                        />
                      </div>
                      <div className="flex flex-col gap-4 w-full">
                        <div
                          onClick={() => selectMode('general')}
                          className="rounded-[10px] p-4 cursor-pointer w-full min-h-[90px] transition-all border border-transparent hover:border-[#815FB3]"
                          style={{ backgroundColor: '#DCCEF1', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c9b8e8'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#DCCEF1'}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center">
                              <img
                                src="/Frame.png"
                                alt="Frame icon"
                                className="w-4 h-4"
                                style={{ filter: 'brightness(0) saturate(100%) invert(59%) sepia(23%) saturate(4832%) hue-rotate(278deg) brightness(96%) contrast(90%)' }}
                              />
                            </div>
                            <span className="text-[14px] font-bold text-[#000000]" style={{ fontFamily: 'Raleway' }}>
                              What&apos;s normal for my pet?
                            </span>
                          </div>
                          <p className="text-[12px] leading-relaxed text-gray-700" style={{ fontFamily: 'Raleway' }}>
                            Learn about typical behaviors, habits, diet, and health patterns specific to your pet&apos;s breed, age, and species. Perfect for new pet parents or anyone looking to better understand what&apos;s considered &quot;normal&quot; for their furry companion.
                          </p>
                        </div>
                        
                        <div
                          onClick={() => selectMode('symptom_checker')}
                          className="bg-[#FFF4C9] rounded-[10px] p-4 cursor-pointer w-full min-h-[90px] transition-all border border-transparent hover:border-[#F4D06F]"
                          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-7 h-7 bg-[#FFF4C9] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            <span className="text-[14px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                              Symptom Checker
                            </span>
                          </div>
                          <p className="text-[12px] text-gray-700 leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                            Not sure if your pet&apos;s symptoms are serious? Use our AI-powered Symptom Checker to get insights into possible causes based on current signs and behaviors. While not a replacement for a vet, it&apos;s a helpful first step.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {chatMode && messages.length > 0 && (
              <div className="flex justify-center mb-4">
                <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                  chatMode === 'general'
                    ? 'bg-[#E4DEED] text-[#34113F]'
                    : 'bg-[#FFF4C9] text-[#574103]'
                }`} style={{ fontFamily: 'Raleway' }}>
                  {chatMode === 'general' ? (
                    <>
                      <img src="/mdi_paw.png" alt="Paw" className="w-4 h-4" />
                      General Pet Health
                    </>
                  ) : (
                    <>
                      <img 
                        src="/mingcute_search-fill.png" 
                        alt="Symptom Checker" 
                        className="w-4 h-4"
                      />
                      <span>Symptom Checker</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <motion.div variants={listContainerVariants} initial="hidden" animate="show" className="flex flex-col">
              {messages.map((message) => {
              // === CRITICAL: Only render assessment results in symptom_checker mode ===
              // This prevents assessments from appearing in "general" mode conversations
              if (message.isAssessment && message.assessmentData) {
                // Don't render assessment if we're in general mode
                if (chatMode !== 'symptom_checker') {
                  console.log('Skipping assessment render: Not in symptom_checker mode');
                  return null;
                }
                return (
                  <motion.div key={message.id} variants={messageItemVariants} className="flex justify-start mb-4">
                    <AssessmentResults
                      assessmentData={message.assessmentData}
                      onSaveToAIDiagnosis={handleSaveToAIDiagnosis}
                      onStartNewAssessment={handleStartNewAssessment}
                      onAskFollowUp={handleAskFollowUp}
                      onLogSymptoms={handleLogSymptoms}
                    />
                  </motion.div>
                );
              }
              
              // === RISK ALERT: Special UI for high/critical risk from symptom logging ===
              if (message.isRiskAlert) {
                return (
                  <div key={message.id} className="flex justify-start mb-4">
                    <div 
                      className="max-w-[80vw] md:max-w-xs lg:max-w-md px-4 md:px-5 py-4 rounded-lg shadow-lg border-l-4"
                      style={{ 
                        backgroundColor: '#FEE2E2', 
                        borderLeftColor: '#DC2626',
                        borderLeftWidth: '4px'
                      }}
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                          <h3 className="text-[15px] md:text-[16px] font-bold text-red-800 mb-1" style={{ fontFamily: 'Raleway' }}>
                            Concern Detected
                          </h3>
                          <p className="text-[13px] md:text-[14px] text-red-700 mb-3" style={{ fontFamily: 'Raleway' }}>
                            {message.content}
                          </p>
                          <p className="text-[12px] md:text-[13px] text-red-600 mb-4" style={{ fontFamily: 'Raleway' }}>
                            Based on your log, {message.petName}&apos;s condition is worsening. We recommend a quick re-evaluation.
                          </p>
                          <button
                            onClick={handleStartNewAssessment}
                            className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-[13px] md:text-[14px] transition-colors shadow-sm"
                            style={{ fontFamily: 'Raleway' }}
                          >
                            Start Emergency Re-Assessment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              if (!message.isUser) {
                // Split by SINGLE newline to handle headers and lists properly
                const lines = message.content.split('\n');
                
                return (
                  <motion.div key={message.id} variants={messageItemVariants} className="flex justify-start mb-4">
                    <div 
                      className="max-w-[85vw] md:max-w-xl lg:max-w-2xl px-4 py-3 rounded-lg text-[#111827] shadow-sm"
                      style={{ backgroundColor: '#FFFFF2' }}
                    >
                      {lines.map((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={idx} className="h-2" />; // Spacer for empty lines

                        // 1. Handle Headers (### Title)
                        if (trimmed.startsWith('###')) {
                          return (
                            <h3 key={idx} className="text-[15px] md:text-[16px] font-bold mt-3 mb-2 text-[#815FB3]" style={{ fontFamily: 'Raleway' }}>
                              {renderFormattedText(trimmed.replace(/^###\s*/, ''))}
                            </h3>
                          );
                        }

                        // 2. Handle Bullet Points (* Item or - Item)
                        if (/^[-*]\s/.test(trimmed)) {
                          return (
                            <div key={idx} className="flex items-start ml-2 mb-1">
                              <span className="mr-2 text-[#815FB3] text-lg leading-none">•</span>
                              <div className="text-[13px] md:text-[14px] leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                                {renderFormattedText(trimmed.replace(/^[-*]\s*/, ''))}
                              </div>
                            </div>
                          );
                        }

                        // 3. Handle Numbered Lists (1. Item)
                        if (/^\d+\.\s/.test(trimmed)) {
                           const numberMatch = trimmed.match(/^(\d+\.)/);
                           const number = numberMatch ? numberMatch[0] : '';
                           return (
                            <div key={idx} className="flex items-start ml-2 mb-1">
                              <span className="mr-2 font-bold text-[#815FB3] text-[13px]">{number}</span>
                              <div className="text-[13px] md:text-[14px] leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                                {renderFormattedText(trimmed.replace(/^\d+\.\s*/, ''))}
                              </div>
                            </div>
                           );
                        }

                        // 4. Regular Text (Paragraphs)
                        return (
                          <p key={idx} className="text-[13px] md:text-[14px] leading-relaxed mb-1" style={{ fontFamily: 'Raleway' }}>
                            {renderFormattedText(trimmed)}
                          </p>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              }
              return (
                <motion.div key={message.id} variants={messageItemVariants} className="flex justify-end mb-4">
                  <div 
                    className="max-w-[80vw] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: '#815FB3' }}
                  >
                    <p className="text-[13px] md:text-[14px] leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                      {renderFormattedText(message.content)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            </motion.div>
            
            {showSymptomChecker && currentPetContext && (
              <div className="flex justify-start mb-4">
                <div className="w-full max-w-2xl">
                  {/* Key uses state-based sessionKey to ensure proper remounting on session changes */}
                  <ConversationalSymptomChecker
                    key={sessionKey}
                    sessionId={sessionKey}
                    selectedPet={{
                      id: currentPetContext.id,
                      name: currentPetContext.name,
                      species: currentPetContext.species,
                      breed: currentPetContext.breed,
                      age: currentPetContext.age
                    }}
                    onComplete={handleSymptomCheckerComplete}
                    onCancel={handleSymptomCheckerCancel}
                  />
                </div>
              </div>
            )}
            
            {showSymptomLogger && currentPetContext && (
              <div className="flex justify-start mb-4">
                <div className="w-full">
                  <SymptomLogger
                    key={sessionKey}
                    pet={{
                      id: currentPetContext.id,
                      name: currentPetContext.name,
                      animal_type: currentPetContext.species?.toLowerCase(),
                      age: currentPetContext.age
                    }}
                    onComplete={handleSymptomLogComplete}
                  />
                  <div className="mt-2 flex justify-center">
                    <button
                      onClick={handleSymptomLogCancel}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {loading && <TypingIndicator />}
          </div>
        </div>

        {/* Only show chat input when NOT on the new chat mode selection page */}
        {!((conversationId === 'new' || !conversationId) && messages.length === 0 && !currentPetContext) && (
          <div className="p-2 md:p-6 md:border-t bg-[#F0F0F0] md:flex-shrink-0 fixed bottom-0 left-0 w-full md:relative md:w-auto z-30">
            <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
              {currentPetContext && (
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => {
                      createNewConversation();
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                    style={{ fontFamily: 'Raleway' }}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Change Mode
                  </button>
                  <div className="text-sm font-semibold flex items-center gap-2" style={{ color: '#815FB3' }}>
                    <img src="/mdi_paw.png" alt="Paw" className="w-4 h-4" />
                    {currentPetContext.name} ({currentPetContext.species})
                  </div>
                </div>
              )}
              
              <form 
                onSubmit={handleSubmit} 
                className="relative flex items-end gap-2 bg-[#E4DEED] rounded-xl px-2 py-2 md:px-4 border border-transparent focus-within:border-[#815FB3] focus-within:ring-1 focus-within:ring-[#815FB3] transition-all"
              >
                <textarea
                  rows={1}
                  value={messageInput}
                  onChange={handleInputResize}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    showSymptomChecker
                      ? "Complete the questionnaire above first..."
                      : chatMode === 'general' || !chatMode
                      ? "Ask about your pet's health..."
                      : assessmentData
                      ? "Ask a follow-up question..."
                      : "Describe your pet's symptoms..."
                  }
                  className="w-full bg-transparent border-none appearance-none focus:outline-none focus:ring-0 resize-none text-[#34113F] placeholder-gray-500 text-[15px] md:text-[16px] py-2 max-h-[120px] overflow-y-auto custom-scrollbar"
                  style={{ fontFamily: 'Raleway', outline: 'none', border: 'none' }}
                  disabled={loading || showSymptomChecker || showSymptomLogger}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !messageInput.trim()}
                  className="mb-1 p-2 bg-[#815FB3] hover:bg-[#6a4c9c] rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <img
                    src="/Vector.png"
                    alt="Send"
                    className="w-4 h-4 md:w-5 md:h-5 object-contain filter brightness-0 invert" 
                  />
                </button>
              </form>
              
              <p className="text-xs md:text-[13px] text-gray-500 mt-1 md:mt-2 text-center" style={{ fontFamily: 'Raleway', marginBottom: '-1px' }}>
                PawPal is an AI-powered assistant designed to provide guidance on pet health and care. It does not replace professional veterinary consultation.
              </p>
            </div>
          </div>
        )}

        <PetSelectionModal
          isOpen={showPetSelection}
          onClose={() => {
            setShowPetSelection(false);
            if (!currentConversationId && messages.length === 0) {
              setChatMode(null);
            }
          }}
          onSelectPet={handlePetSelected}
          conversationType={chatMode}
        />

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={handleLogoutCancel}
          onConfirm={handleLogoutConfirm}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Chat;

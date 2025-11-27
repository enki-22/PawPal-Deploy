import axios from 'axios';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../context/ConversationsContext';
import LogoutModal from './LogoutModal';
import PetSelectionModal from './PetSelectionModal';
import ProfileButton from './ProfileButton';
import Sidebar from './Sidebar';
import ConversationalSymptomChecker from './ConversationalSymptomChecker';
import AssessmentResults from './AssessmentResults';
import SymptomLogger from './SymptomLogger';

const Chat = () => {
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
  
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  
  useEffect(() => {
    if (!user) {
      window.location.replace('/petowner/login');
    }
  }, [user]);

  const {
    conversations,
    loadingConversations,
    fetchConversations,
    handlePinConversation,
    handleRenameConversation,
    handleArchiveConversation,
    handleDeleteConversation
  } = useConversations();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const loadConversation = useCallback(async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chatbot/conversations/${conversationId}/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });
      if (response.data) {
        setCurrentConversationId(conversationId);
        setCurrentConversationTitle(response.data.conversation.title);
        
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.isUser,
          sender: msg.sender,
          timestamp: msg.timestamp,
        }));
        
        if (response.data.assessment_data) {
          const assessmentData = response.data.assessment_data;
          setAssessmentData(assessmentData);
          
          const hasAssessmentMessage = formattedMessages.some(msg => msg.isAssessment);
          if (!hasAssessmentMessage) {
            const assessmentMessage = {
              id: `assessment-${conversationId}-${Date.now()}`,
              content: '',
              isUser: false,
              sender: 'PawPal',
              timestamp: assessmentData.case_id ? new Date().toISOString() : new Date().toISOString(),
              isAssessment: true,
              assessmentData: assessmentData
            };
            formattedMessages.push(assessmentMessage);
          }
        } else {
          setAssessmentData(null);
        }
        
        setMessages(formattedMessages);
        if (response.data.conversation.title.includes('Symptom Check:')) {
          setChatMode('symptom_checker');
        } else if (response.data.conversation.title.includes('Pet Care:')) {
          setChatMode('general');
        }
      } else {
        setMessages([]);
        setAssessmentData(null);
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setMessages([]);
      setAssessmentData(null);
    }
  }, [API_BASE_URL, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    fetchConversations();
    
    if (conversationId && conversationId !== 'new') {
      loadConversation(conversationId);
      // Reset specialized UI when loading a generic conversation ID
      setShowSymptomChecker(false);
      setShowSymptomLogger(false);
    } else {
      // Reset everything for a new chat
      setCurrentConversationId(null);
      setCurrentConversationTitle('New Chat');
      setMessages([]);
      setChatMode(null);
      setCurrentPetContext(null);
      setShowSymptomChecker(false);
      setShowSymptomLogger(false);
      setAssessmentData(null);
    }
  }, [fetchConversations, conversationId, loadConversation]);

  const createNewConversation = async () => {
    try {
      navigate('/chat/new');
      setCurrentConversationId(null);
      setCurrentConversationTitle('New Chat');
      setChatMode(null);
      setMessages([]);
      setCurrentPetContext(null);
      // Explicitly reset these flags to prevent "ghost" questionnaires
      setShowSymptomChecker(false);
      setShowSymptomLogger(false);
      setAssessmentData(null);
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
    setCurrentConversationId(conversationData.conversation_id);
    setCurrentPetContext(conversationData.pet_context);
    setCurrentConversationTitle(conversationData.conversation_title || 'New Chat');
    const initialMessage = {
      id: Date.now(),
      content: conversationData.initial_message,
      isUser: false,
      sender: 'PawPal',
      timestamp: new Date().toISOString(),
    };
    setMessages([initialMessage]);
    
    // IMPORTANT: Only show symptom checker if the mode matches
    if (chatMode === 'symptom_checker') {
      setShowSymptomChecker(true);
    } else {
      setShowSymptomChecker(false);
    }
    // Ensure symptom logger is off initially
    setShowSymptomLogger(false);
    
    fetchConversations();
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
                Learn about typical behaviors, habits, diet, and health patterns specific to your pet&apos;s breed, age, and species. Perfect for new pet parents or anyone looking to better understand what&apos;s considered &ldquo;normal&rdquo; for their furry companion.
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

  const selectMode = (mode) => {
    setChatMode(mode);
    setShowPetSelection(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = messageInput.trim();
    if (!message || loading) return;
    
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
          timeout: 30000,
        }
      );
      if (response.data && response.data.response) {
        const aiMessage = {
          id: Date.now() + Math.random(),
          content: response.data.response,
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
        if (response.data.conversation_id) {
          setCurrentConversationId(response.data.conversation_id);
        }
        if (response.data.conversation_title) {
          setCurrentConversationTitle(response.data.conversation_title);
        }
      }
      fetchConversations();
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + Math.random(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        isUser: false,
        sender: 'PawPal',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
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
    // Combine recent user messages to give context
    const recentUserMessages = messages
        .filter(m => m.isUser)
        .slice(-3) // Take last 3 user messages
        .map(m => m.content)
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
    setMessages(prev => [...prev, summaryMessage]);
    
    const analyzingMessage = {
      id: Date.now() + Math.random() + 1,
      content: `Analyzing ${payload.pet_name}'s symptoms...`,
      isUser: false,
      sender: 'PawPal',
      timestamp: new Date().toISOString(),
      isAnalyzing: true
    };
    setMessages(prev => [...prev, analyzingMessage]);
    
    try {
      const predictionPayload = {
        ...payload,
        pet_id: currentPetContext?.id,
        user_notes: recentUserMessages
      };
      
      console.log('Symptom Checker Prediction Payload:', predictionPayload);
      
      const response = await axios.post(
        `${API_BASE_URL}/symptom-checker/predict/`,
        predictionPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Token ${token}` : '',
          },
          timeout: 30000,
        }
      );
      
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
      } else {
        throw new Error(response.data?.error || 'Assessment failed');
      }
    } catch (error) {
      console.error('Assessment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
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
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleSymptomCheckerCancel = () => {
    setShowSymptomChecker(false);
  };
  
  const handleSaveToAIDiagnosis = async (assessmentData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/chatbot/create-ai-diagnosis/`,
        {
          pet_id: currentPetContext?.id,
          symptoms: assessmentData.symptoms_text || 'Symptom assessment completed',
          assessment_data: assessmentData,
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
    setAssessmentData(null);
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
    
    const successMessage = {
      id: Date.now() + Math.random(),
      content: `✅ Symptoms logged successfully for ${currentPetContext.name}! Risk Level: ${response.risk_assessment.level.toUpperCase()} (${response.risk_assessment.score}/100)`,
      isUser: false,
      sender: 'PawPal',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, successMessage]);
    
    if (response.alert) {
      const alertMessage = {
        id: Date.now() + Math.random() + 1,
        content: `⚠️ ALERT: ${response.alert.alert_message}`,
        isUser: false,
        sender: 'PawPal',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, alertMessage]);
    }
  };

  const handleSymptomLogCancel = () => {
    setShowSymptomLogger(false);
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col md:flex-row overflow-hidden">
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
          onLoadConversation={loadConversation}
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
            onLoadConversation={(id) => {
              loadConversation(id);
              setIsMobileSidebarOpen(false);
            }}
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
              <img src="/pat-removebg-preview 2.png" alt="PawPal Logo" className="w-8 h-8" />
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
          className="flex-1 overflow-y-auto bg-[#F0F0F0] px-2 pt-2 pb-40 md:p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9CA3AF #F0F0F0',
            paddingTop: (conversationId === 'new' || !conversationId) ? '20px' : '0',
          }}
        >
          <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto w-full">
            {/* Desktop greeting prompt (new chat) */}
            {(conversationId === 'new' || !conversationId) && messages.length === 0 && !currentPetContext && (
              <div className="hidden md:block">
                <ModeSelection />
              </div>
            )}

            {/* Mobile greeting prompt (new chat) */}
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
                        {/* Mobile General Card */}
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
                        
                        {/* Mobile Symptom Card */}
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
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  chatMode === 'general'
                    ? 'bg-[#E4DEED] text-[#34113F]'
                    : 'bg-[#FFF4C9] text-[#574103]'
                }`} style={{ fontFamily: 'Raleway' }}>
                  {chatMode === 'general' ? '🐾 General Pet Health' : '🔍 Symptom Checker'}
                </div>
              </div>
            )}

            {messages.map((message) => {
              if (message.isAssessment && message.assessmentData) {
                return (
                  <div key={message.id} className="flex justify-start mb-4">
                    <AssessmentResults
                      assessmentData={message.assessmentData}
                      onSaveToAIDiagnosis={handleSaveToAIDiagnosis}
                      onStartNewAssessment={handleStartNewAssessment}
                      onAskFollowUp={handleAskFollowUp}
                      onLogSymptoms={handleLogSymptoms}
                    />
                  </div>
                );
              }
              
              if (!message.isUser) {
                const paragraphs = message.content.split(/\n\n+/);
                return (
                  <div key={message.id} className="flex justify-start mb-4">
                    <div 
                      className="max-w-[80vw] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg text-[#111827] shadow-sm"
                      style={{ backgroundColor: '#FFFFF2' }}
                    >
                      {paragraphs.map((para, idx) => {
                        if (/^(\s*[-*]|\d+\.)/.test(para.trim())) {
                          const lines = para.split(/\n+/).filter(l => l.trim());
                          const isNumbered = /^\d+\./.test(lines[0].trim());
                          return isNumbered ? (
                            <ol className="list-decimal ml-4 mb-2" key={idx}>
                              {lines.map((line, i) => (
                                <li key={i} className="text-[13px] md:text-[14px] leading-relaxed" style={{ fontFamily: 'Raleway' }}>{line.replace(/^\d+\.\s*/, '')}</li>
                              ))}
                            </ol>
                          ) : (
                            <ul className="list-disc ml-4 mb-2" key={idx}>
                              {lines.map((line, i) => (
                                <li key={i} className="text-[13px] md:text-[14px] leading-relaxed" style={{ fontFamily: 'Raleway' }}>{line.replace(/^[-*]\s*/, '')}</li>
                              ))}
                            </ul>
                          );
                        }
                        return (
                          <p key={idx} className="text-[13px] md:text-[14px] leading-relaxed mb-2" style={{ fontFamily: 'Raleway' }}>
                            {para}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return (
                <div key={message.id} className="flex justify-end mb-4">
                  <div 
                    className="max-w-[80vw] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg text-white shadow-sm"
                    style={{ backgroundColor: '#815FB3' }}
                  >
                    <p className="text-[13px] md:text-[14px] leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                      {message.content}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {showSymptomChecker && currentPetContext && (
              <div className="flex justify-start mb-4">
                <div className="w-full max-w-2xl">
                  <ConversationalSymptomChecker
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
            
            {loading && (
              <div className="flex justify-start">
                <div className="text-gray-900 px-3 md:px-4 py-2 rounded-lg" style={{ backgroundColor: '#FFFFF2' }}>
                  <p className="text-[13px] md:text-[14px] animate-pulse" style={{ fontFamily: 'Raleway' }}>
                    Typing...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-2 md:p-6 md:border-t bg-[#F0F0F0] md:flex-shrink-0 fixed bottom-0 left-0 w-full md:relative md:w-auto z-30">
          <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
            {currentPetContext && (
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    setChatMode(null);
                    setMessages([]);
                    setCurrentConversationTitle('New Chat');
                    setCurrentPetContext(null);
                    setShowSymptomChecker(false);
                    setShowSymptomLogger(false);
                    setAssessmentData(null);
                    navigate('/chat/new');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                  style={{ fontFamily: 'Raleway' }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Change Mode
                </button>
                <div className="text-sm font-semibold" style={{ color: '#815FB3' }}>
                  🐾 {currentPetContext.name} ({currentPetContext.species})
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={
                  showSymptomChecker
                    ? "Complete the questionnaire above first..."
                    : chatMode === 'general' || !chatMode
                    ? "Ask about your pet's health..."
                    : assessmentData
                    ? "Ask a follow-up question about the assessment..."
                    : "Describe your pet's symptoms..."
                }
                className="w-full px-2 md:px-6 py-2 md:py-3 pr-10 md:pr-16 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-xs md:text-[15px] lg:text-[18px] bg-[#E4DEED] font-medium placeholder-gray-500 text-[#34113F]"
                style={{ fontFamily: 'Raleway', marginBottom: '6px' }}
                disabled={loading || showSymptomChecker || showSymptomLogger}
                required
              />
              <div className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 flex items-center">
                <button
                  type="submit"
                  disabled={loading || !messageInput.trim()}
                  className="p-0 bg-transparent hover:opacity-70 transition-opacity disabled:opacity-30"
                >
                  <img
                    src="/Vector.png"
                    alt="Send message"
                    className="w-5 h-5 md:w-6 md:h-6 object-contain pb-1 md: pb-1"
                  />
                </button>
              </div>
            </form>
            
            <p className="text-xs md:text-[13px] text-gray-500 mt-1 md:mt-2 text-center" style={{ fontFamily: 'Raleway', marginBottom: '-1px' }}>
              PawPal is an AI-powered assistant designed to provide guidance on pet health and care. It does not replace professional veterinary consultation.
            </p>
          </div>
        </div>

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
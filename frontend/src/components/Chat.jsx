

import axios from 'axios';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../context/ConversationsContext';
import LogoutModal from './LogoutModal';
import PetSelectionModal from './PetSelectionModal';
import ProfileButton from './ProfileButton';
import Sidebar from './Sidebar';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const { conversationId } = useParams();
  const [currentConversationTitle, setCurrentConversationTitle] = useState('New Chat');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  // State for mobile sidebar overlay
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [chatMode, setChatMode] = useState(null); 
  // Removed unused showModeSelection state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [currentPetContext, setCurrentPetContext] = useState(null);
  
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  // Redirect unauthenticated users to login page
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
  // Show mode selection is now handled by chatMode and currentPetContext
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.isUser,
          sender: msg.sender,
          timestamp: msg.timestamp,
        }));
        setMessages(formattedMessages);
        if (response.data.conversation.title.includes('Symptom Check:')) {
          setChatMode('symptom_checker');
        } else if (response.data.conversation.title.includes('Pet Care:')) {
          setChatMode('general');
        }
      } else {
        setMessages([]);
      }
    } catch (err) {
      setMessages([]);
    }
  }, [API_BASE_URL, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // --- THIS IS THE CORRECTED useEffect ---
  // Load conversations on component mount or when conversationId changes
  useEffect(() => {
    fetchConversations();
    
    if (conversationId && conversationId !== 'new') {
      // Load an existing conversation
      loadConversation(conversationId);
    } else {
      // This is a new chat
      setCurrentConversationId(null);
      setCurrentConversationTitle('New Chat');
      // --- THIS IS THE FIX ---
      // Set to false to show the chat input field with the welcome message
  // Show mode selection is now handled by chatMode and currentPetContext
      setMessages([]);
      setChatMode(null);
      setCurrentPetContext(null);
    }
  }, [fetchConversations, conversationId, loadConversation]);


  const createNewConversation = async () => {
    try {
      // We don't need to call the backend here, just reset the state
      // and the URL navigation will trigger the useEffect above.
      navigate('/chat/new');
      
      // Manually reset state as well for instant UI update
      setCurrentConversationId(null);
      setCurrentConversationTitle('New Chat');
  // Show mode selection is now handled by chatMode and currentPetContext
      setChatMode(null);
      setMessages([]);
      setCurrentPetContext(null); 
      
      // Fetch conversations to update sidebar
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
      navigate('/chat/new'); // Navigate to new chat
    }
    handleArchiveConversation(conversationId);
  };

  const deleteConversation = (conversationId) => {
    if (conversationId === currentConversationId) {
      navigate('/chat/new'); // Navigate to new chat
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
    // Update sidebar only, do not navigate
    fetchConversations();
  };

  // Mode Selection Component
  const ModeSelection = () => (
    <div className="flex-1 flex items-center justify-center bg-[#F0F0F0] p-2 md:p-6">
      <div className="max-w-xs md:max-w-2xl lg:max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-[40px] font-bold text-gray-900 mb-3" style={{ fontFamily: 'Raleway' }}>
            Hello, {user?.username || 'User'}!
          </h1>
          <p className="text-[16px] text-gray-600" style={{ fontFamily: 'Raleway' }}>
            How can I assist you and your furry friend today?
          </p>
        </div>

        {/* Main content area with illustration and cards side by side */}
  <div className="flex flex-col md:flex-row items-start justify-center gap-4 md:gap-8 w-full">
          {/* Illustration */}
          <div className="flex-shrink-0 mb-4 md:mb-0">
            <img
              src="/amico.png"
              alt="AI Assistant Illustration"
              className="w-40 h-40 md:w-72 md:h-72 object-contain mx-auto"
            />
          </div>
          
          {/* Quick action buttons - stacked vertically */}
          <div className="flex flex-col gap-2 md:gap-4 w-full max-w-xs md:max-w-xl">
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

  // Simplified handleSubmit: no image logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    const message = messageInput.trim();
    if (!message || loading) return;
    
    // Always allow sending, default to general mode and no pet context
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
          pet_context: usedPetContext
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

  // Handle logout and dropdown functionality
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

  // Logout modal handlers
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


  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar - hidden on mobile */}
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

      {/* --- MODIFIED --- */}
      {/* Mobile Sidebar Overlay with Transitions */}
      <div
        className={`
          md:hidden fixed inset-0 z-50 flex
          transition-opacity duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        role="dialog"
        aria-modal="true"
      >
        {/* Sidebar Component (The sliding part) */}
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
        
        {/* Overlay Background (The fading part) */}
        <div 
          className="flex-1 bg-black bg-opacity-50" 
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        ></div>
      </div>
      {/* --- END OF MODIFIED BLOCK --- */}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#F0F0F0] h-screen w-full">
        {/* Header - Stationary */}
        {/* Header - Mobile: logo, sidebar toggle, profile. Desktop: unchanged. */}
        <div className="border-b p-2 md:p-4 flex flex-row items-center justify-between gap-2 md:gap-0 sticky top-0 z-20 bg-[#DCCEF1] md:bg-[#f0f1f1]">
          {/* Mobile header */}
          <div className="flex items-center gap-2 md:hidden w-full justify-between">
            <div className="flex items-center gap-2">
              <img src="/pat-removebg-preview 2.png" alt="PawPal Logo" className="w-8 h-8" />
              <span className="font-bold text-lg text-[#815FB3]" style={{ fontFamily: 'Raleway' }}>PAWPAL</span>
              <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 ml-2" aria-label="Open sidebar">
                {/* Flipped sidebar-expand-icon.png to face right */}
                <img src="/sidebar-expand-icon.png" alt="Sidebar Toggle" className="w-6 h-6" style={{ transform: 'scaleX(-1)' }} />
              </button>
            </div>
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
          {/* Desktop header */}
          <div className="hidden md:flex items-center gap-2 md:gap-4 w-full justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <h2 className="text-lg md:text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
                {currentConversationTitle}
              </h2>
            </div>
            <ProfileButton onLogoutClick={handleLogoutClick} />
          </div>
        </div>
        {/* Page name below header for mobile */}
        <div className="md:hidden px-4 pt-2 pb-1" style={{ background: '#F0F0F0' }}>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
            {currentConversationTitle}
          </h2>
        </div>

        {/* Main Content - Chat Messages (Scrollable) */}
        <div className="flex-1 overflow-y-auto bg-[#F0F0F0] p-2 md:p-6">
          <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto w-full">
            {/* --- WELCOME/MODE SELECTION LOGIC ---
              This now renders *inside* the scrolling area
              It shows if:
              1. It's a new chat (no conversationId or 'new')
              2. No messages have been sent (messages.length === 0)
              3. No pet has been selected yet (!currentPetContext)
            */}
            {(conversationId === 'new' || !conversationId) && messages.length === 0 && !currentPetContext && (
              <ModeSelection />
            )}

            {/* Mode indicator */}
            {chatMode && messages.length > 0 && (
              <div className="flex justify-center mb-4">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  chatMode === 'general'
                    ? 'bg-pink-100 text-pink-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`} style={{ fontFamily: 'Raleway' }}>
                  {chatMode === 'general' ? '🐾 General Pet Health' : '🔍 Symptom Checker'}
                </div>
              </div>
            )}

            {/* Render Messages */}
              {messages.map((message) => {
                // Format AI messages for neatness
                if (!message.isUser) {
                  // Split by double line breaks for paragraphs
                  const paragraphs = message.content.split(/\n\n+/);
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-[80vw] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                        {paragraphs.map((para, idx) => {
                          // Render bullet/numbered lists if detected
                          if (/^(\s*[-*]|\d+\.)/.test(para.trim())) {
                            // Split lines and render as list
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
                          // Otherwise, render as paragraph
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
                // User messages unchanged
                return (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[80vw] md:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg bg-[#815FB3] text-white">
                      <p className="text-[13px] md:text-[14px] leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-3 md:px-4 py-2 rounded-lg">
                  <p className="text-[13px] md:text-[14px] animate-pulse" style={{ fontFamily: 'Raleway' }}>
                    Typing...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Input Area - Now always visible */}
        <div className="p-2 md:p-6 border-t bg-[#F0F0F0] flex-shrink-0">
          <div className="max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
            {/* This section is only shown if a pet is selected */}
            {currentPetContext && (
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                      setChatMode(null);
                      setMessages([]);
                      setCurrentConversationTitle('New Chat');
                      setCurrentPetContext(null);
                      navigate('/chat/new'); // Go back to new chat URL
                    }}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                  style={{ fontFamily: 'Raleway' }}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Change Mode
                </button>
                <div className="text-sm text-blue-600">
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
                  chatMode === 'general' || !chatMode
                    ? "Ask about your pet's health..."
                    : "Describe your pet's symptoms..."
                }
                className="w-full px-2 md:px-6 py-2 md:py-3 pr-10 md:pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-xs md:text-[15px] lg:text-[18px] bg-[#E4DEED] font-medium"
                style={{ fontFamily: 'Raleway', marginBottom: '6px' }}
                disabled={loading}
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
                    className="w-5 h-5 md:w-6 md:h-8"
                  />
                </button>
              </div>
            </form>
            {/* Move info text closer to chat field and button */}
            <p className="text-xs md:text-[14px] text-gray-500 mt-1 md:mt-2 text-center" style={{ fontFamily: 'Raleway', marginBottom: '-10px' }}>
              PawPal is an AI-powered assistant designed to provide guidance on pet health and care. It does not replace professional veterinary consultation.
            </p>
          </div>
        </div>

        {/* Modals are outside the main layout */}
        <PetSelectionModal
          isOpen={showPetSelection}
          onClose={() => {
            setShowPetSelection(false);
            // If they close the modal without picking a pet, and it's a new chat,
            // go back to the mode selection screen by resetting chatMode
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
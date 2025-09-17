import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import ProfileButton from './ProfileButton';


const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversationTitle, setCurrentConversationTitle] = useState('New Chat');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [chatMode, setChatMode] = useState(null); // 'general' or 'symptom_checker'
  const [showModeSelection, setShowModeSelection] = useState(true);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();


  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';


  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);


  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };


  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await axios.get(`${API_BASE_URL}/chatbot/conversations/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });


      if (response.data && response.data.conversations) {
        setConversations(response.data.conversations);
       
        // If no current conversation and conversations exist, load the most recent one
        if (!currentConversationId && response.data.conversations.length > 0) {
          const mostRecent = response.data.conversations[0];
          loadConversation(mostRecent.id);
        } else if (response.data.conversations.length === 0) {
          // No conversations exist, show mode selection
          setShowModeSelection(true);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };


  const loadConversation = async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chatbot/conversations/${conversationId}/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });


      if (response.data) {
        setCurrentConversationId(conversationId);
        setCurrentConversationTitle(response.data.conversation.title);
        setShowModeSelection(false);
       
        // Convert messages to frontend format
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isUser: msg.isUser,
          sender: msg.sender,
          timestamp: msg.timestamp,
        }));
       
        setMessages(formattedMessages);
       
        // Determine chat mode from conversation title
        if (response.data.conversation.title.includes('Symptom Check:')) {
          setChatMode('symptom_checker');
        } else if (response.data.conversation.title.includes('Pet Care:')) {
          setChatMode('general');
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };


  const createNewConversation = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chatbot/conversations/new/`, {}, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });


      if (response.data && response.data.conversation) {
        setCurrentConversationId(response.data.conversation.id);
        setCurrentConversationTitle(response.data.conversation.title);
        setShowModeSelection(true);
        setChatMode(null);
        setMessages([]);
       
        // Reload conversations to update sidebar
        loadConversations();
      }
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  const pinConversation = async (conversationId, shouldPin) => {
    try {
      console.log('Attempting to toggle pin for conversation:', conversationId);
      const response = await axios.post(`${API_BASE_URL}/chatbot/conversations/${conversationId}/pin/`, {}, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });

      console.log('Pin toggle response:', response.data);
      if (response.data) {
        // Reload conversations to update sidebar
        loadConversations();
      }
    } catch (error) {
      console.error('Error pinning/unpinning conversation:', error);
      console.error('Error details:', error.response?.data);
    }
  };


  // Mode Selection Component
  const ModeSelection = () => (
    <div className="flex-1 flex items-center justify-center bg-[#F0F0F0] p-6">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-[40px] font-bold text-gray-900 mb-3" style={{ fontFamily: 'Raleway' }}>
            Hello, {user?.username || 'User'}!
          </h1>
          <p className="text-[16px] text-gray-600" style={{ fontFamily: 'Raleway' }}>
            How can I assist you and your furry friend today?
          </p>
        </div>


        {/* Main content area with illustration and cards side by side */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full">
          {/* Illustration */}
          <div className="flex-shrink-0">
            <img
              src="/amico.png"
              alt="AI Assistant Illustration"
              className="w-72 h-72 object-contain"
            />
          </div>
         
          {/* Quick action buttons - stacked vertically */}
          <div className="flex flex-col gap-4 w-full max-w-xl">
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
    setShowModeSelection(false);
   
    // Set initial message based on mode
    const initialMessage = mode === 'general'
      ? "Hi! I'm here to help you understand what's normal and healthy for your pet. Feel free to ask about typical behaviors, diet, exercise needs, or general care tips for your furry friend!"
      : "Hello! I'm your AI symptom checker. Please describe any symptoms or unusual behaviors you've noticed in your pet, and I'll help you understand what they might indicate. Remember, this doesn't replace professional veterinary care.";
    setMessages([{
      id: Date.now(),
      content: initialMessage,
      isUser: false,
      sender: 'PawPal',
      timestamp: new Date().toISOString(),
    }]);
   
    setCurrentConversationTitle(mode === 'general' ? 'Pet Health Guide' : 'Symptom Checker');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
   
    const message = messageInput.trim();
    if (!message || loading) return;
   
    // Add user message to UI immediately
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
          chat_mode: chatMode // Add chat mode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Token ${token}` : '',
          }
        }
      );


      if (response.data && response.data.response) {
        // Add AI response to UI
        const aiMessage = {
          id: Date.now() + Math.random(),
          content: response.data.response,
          isUser: false,
          sender: 'PawPal',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
       
        // Update conversation info
        if (response.data.conversation_id) {
          setCurrentConversationId(response.data.conversation_id);
        }
        if (response.data.conversation_title) {
          setCurrentConversationTitle(response.data.conversation_title);
        }
       
        // Reload conversations to update sidebar
        loadConversations();
      } else {
        throw new Error('Invalid response format');
      }
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


  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <div className="h-screen bg-[#F0F0F0] flex overflow-hidden">
      {/* Left Sidebar */}
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
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F0F0F0]">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#f0f1f1' }}>
          <div className="flex items-center space-x-4">
            <h2 className="text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
              {currentConversationTitle}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <ProfileButton />
          </div>
        </div>


        {/* Chat Messages Area - Conditional */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#F0F0F0]">
          {showModeSelection ? (
            <ModeSelection />
          ) : (
            <>
              {/* Messages Container */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 w-full scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#9CA3AF #F0F0F0'
                }}
              >
                <div className="max-w-4xl mx-auto w-full">
                  {/* Welcome Message - Show only when no user messages */}
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                      <div className="mb-6">
                        <h1 className="text-[40px] font-bold text-gray-900 mb-3" style={{ fontFamily: 'Raleway' }}>
                          Hello, {user?.username || 'User'}!
                        </h1>
                        <p className="text-[16px] text-gray-600" style={{ fontFamily: 'Raleway' }}>
                          How can I assist you and your furry friend today?
                        </p>
                      </div>
                     
                      {/* Main content area with illustration and cards side by side */}
                      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 max-w-6xl w-full">
                        {/* Illustration */}
                        <div className="flex-shrink-0">
                          <img
                            src="/amico.png"
                            alt="AI Assistant Illustration"
                            className="w-72 h-72 object-contain"
                          />
                        </div>
                       
                        {/* Quick action buttons - stacked vertically */}
                        <div className="flex flex-col gap-4 w-full max-w-xl">
                          <div
                            onClick={() => selectMode('general')}
                            className="rounded-2xl p-6 cursor-pointer w-full min-h-[130px]"
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

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isUser
                            ? 'bg-[#815FB3] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-[14px] leading-relaxed" style={{ fontFamily: 'Raleway' }}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <p className="text-[14px] animate-pulse" style={{ fontFamily: 'Raleway' }}>
                          Typing...
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Input Area */}
              <div className="p-6 border-t bg-[#F0F0F0] flex-shrink-0">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => {
                        setShowModeSelection(true);
                        setChatMode(null);
                        setMessages([]);
                        setCurrentConversationTitle('New Chat');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                      style={{ fontFamily: 'Raleway' }}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Change Mode
                    </button>
                  </div>
                 
                  <form onSubmit={handleSubmit} className="relative">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={chatMode === 'general' ? "Ask about your pet's health..." : "Describe your pet's symptoms..."}
                      className="w-full px-6 py-5 pr-32 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#815FB3] text-[18px] bg-[#E4DEED] font-medium"
                      style={{ fontFamily: 'Raleway' }}
                      disabled={loading}
                      required
                    />
                    <div className="absolute right-5 top-1/2 transform -translate-y-1/2 flex items-center space-x-5">
                      <button
                        type="button"
                        className="p-0 bg-transparent hover:opacity-70 transition-opacity"
                      >
                        <img
                          src="/material-symbols_image.png"
                          alt="Attach image"
                          className="w-8 h-8"
                        />
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !messageInput.trim()}
                        className="p-0 bg-transparent hover:opacity-70 transition-opacity disabled:opacity-30"
                      >
                        <img
                          src="/Vector.png"
                          alt="Send message"
                          className="w-8 h-8"
                        />
                      </button>
                    </div>
                  </form>
                 
                  <p className="text-[14px] text-gray-500 mt-3 text-center" style={{ fontFamily: 'Raleway' }}>
                    PawPal is an AI-powered assistant designed to provide guidance on pet health and care. It does not replace professional veterinary consultation.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


export default Chat;
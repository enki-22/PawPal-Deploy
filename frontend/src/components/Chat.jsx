import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import pawIcon from '../Assets/Images/paw-icon.png';
import { useAuth } from '../context/AuthContext';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! I'm your AI veterinary assistant. How can I help you with your pet today?",
      isUser: false,
      sender: 'PawPal',
      timestamp: new Date(),
    }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const addMessage = (text, isUser, sender) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      content: text,
      isUser,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const message = messageInput.trim();
    if (!message || loading) return;
    
    addMessage(message, true, 'You');
    setMessageInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/chatbot/chat/',
        { message: message },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Token ${token}` : '',
          }
        }
      );

      if (response.data && response.data.response) {
        addMessage(response.data.response, false, 'AI Vet');
      } else {
        addMessage('Sorry, there was an error processing your message.', false, 'AI Vet');
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage('Sorry, there was an error processing your message.', false, 'AI Vet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className={`${sidebarVisible ? 'w-64' : 'w-0'} bg-[#C8B5E6] transition-all duration-300 ease-in-out overflow-hidden flex flex-col`}>
        <div className="p-4 min-w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <img src={pawIcon} alt="Paw" className="w-8 h-8 mr-2" 
                   style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(18%) saturate(1234%) hue-rotate(237deg) brightness(96%) contrast(86%)' }} />
              <h1 className="text-[#815FB3] text-[20px] font-black text-center" 
                  style={{ fontFamily: 'MuseoModerno', fontWeight: 900, lineHeight: 'normal' }}>
                PAWPAL
              </h1>
            </div>
            <button 
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="p-2 hover:bg-purple-200 rounded-lg transition-colors text-[#815FB3]"
              title="Hide sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <button className="w-full bg-[#FFF07B] text-black py-3 px-4 rounded-lg mb-6 text-[16px] font-medium" 
                  style={{ fontFamily: 'Raleway' }}>
            + New Chat
          </button>

          {/* Menu Items */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center space-x-3 text-[#815FB3] cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-[16px] font-medium" style={{ fontFamily: 'Raleway' }}>AI Diagnosis</span>
            </div>
            <div className="flex items-center space-x-3 text-[#815FB3] cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[16px] font-medium" style={{ fontFamily: 'Raleway' }}>Pet Health Records</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-white bg-opacity-50 rounded-lg py-2 px-4 pl-10 text-[14px]"
              style={{ fontFamily: 'Raleway' }}
            />
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Pinned Chats */}
          <div className="mb-6">
            <h3 className="text-[14px] font-medium text-gray-700 mb-3" style={{ fontFamily: 'Raleway' }}>
              Pinned Chats
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-[14px] text-gray-700 cursor-pointer p-2 rounded">
                <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                <span style={{ fontFamily: 'Raleway' }}>Cat&apos;s Favorite Foods</span>
              </div>
            </div>
          </div>

          {/* Recent Chats */}
          <div className="flex-1">
            <h3 className="text-[14px] font-medium text-gray-700 mb-3" style={{ fontFamily: 'Raleway' }}>
              Recent Chats
            </h3>
            <div className="space-y-2">
              <div className="bg-[#FFF07B] p-2 rounded text-[14px] text-black cursor-pointer" style={{ fontFamily: 'Raleway' }}>
                New Conversation
              </div>
              <div className="flex items-center space-x-2 text-[14px] text-gray-700 cursor-pointer p-2 rounded">
                <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                <span style={{ fontFamily: 'Raleway' }}>Pet Health Concern</span>
              </div>
              <div className="flex items-center space-x-2 text-[14px] text-gray-700 cursor-pointer p-2 rounded">
                <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
                <span style={{ fontFamily: 'Raleway' }}>Symptom Checker</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-[#F0F0F0] p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!sidebarVisible && (
              <button 
                onClick={() => setSidebarVisible(true)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                title="Show sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h2 className="text-[24px] font-bold text-gray-900" style={{ fontFamily: 'Raleway' }}>
              Hello, {user?.username || 'User'}!
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[14px] text-gray-600" style={{ fontFamily: 'Raleway' }}>
              {user?.username}
            </span>
            <div className="relative dropdown-container">
              <button
                onClick={() => setDropdownVisible(!dropdownVisible)}
                className="w-8 h-8 bg-[#815FB3] rounded-full flex items-center justify-center hover:bg-[#6d4a96] transition-colors"
              >
                <span className="text-white text-sm font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </button>
              
              {/* Dropdown Menu */}
              {dropdownVisible && (
                <div className="absolute right-0 top-10 bg-[#FFF07B] rounded-lg shadow-lg py-2 min-w-48 z-50">
                  <div className="px-4 py-2 border-b border-yellow-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#815FB3] rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-black font-medium text-[16px]" style={{ fontFamily: 'Raleway' }}>
                        {user?.username || 'User'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 hover:bg-yellow-200 flex items-center space-x-3 text-[#815FB3]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[14px] font-medium" style={{ fontFamily: 'Raleway' }}>Settings</span>
                    </button>
                    
                    <button className="w-full text-left px-4 py-2 hover:bg-yellow-200 flex items-center space-x-3 text-[#815FB3]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[14px] font-medium" style={{ fontFamily: 'Raleway' }}>Terms & Policy</span>
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-yellow-200 flex items-center space-x-3 text-[#815FB3]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-[14px] font-medium" style={{ fontFamily: 'Raleway' }}>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F0F0F0]"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm px-4 py-3 rounded-lg shadow-sm ${
                    message.isUser
                      ? 'bg-[#815FB3] text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
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
                <div className="bg-white text-gray-800 border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none shadow-sm">
                  <p className="text-[14px] animate-pulse" style={{ fontFamily: 'Raleway' }}>
                    Typing...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-[#F0F0F0]" 
               style={{ borderRadius: '10px 10px 0 0' }}>
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="How can I help you today?"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#815FB3] focus:border-transparent text-[14px] bg-[#E4DEED]"
                  style={{ fontFamily: 'Raleway' }}
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  disabled={loading || !messageInput.trim()}
                  className="bg-[#815FB3] hover:bg-[#6d4a96] text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-3 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
              </form>
              
              <p className="text-[12px] text-gray-500 mt-3 text-center" style={{ fontFamily: 'Raleway' }}>
                PawPal is an AI-powered assistant designed to provide guidance on pet health and care. It does not replace professional veterinary consultation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! I'm your AI veterinary assistant. How can I help you with your pet today?",
      isUser: false,
      sender: 'AI Vet',
      timestamp: new Date(),
    }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatContainerRef = useRef(null);
  const { user, token } = useAuth();

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        'http://localhost:8000/chatbot/chat/',
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
    <Layout title={`Welcome ${user?.username}! - AI Veterinary Assistant`} showLogout={true}>
      {/* Chat Container */}
      <div 
        ref={chatContainerRef}
        id="chat-container"
        className="h-96 overflow-y-auto border border-gray-300 p-2.5 mb-5 bg-gray-50"
      >
        <div id="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
            >
              <strong>{message.sender}:</strong> {message.content}
            </div>
          ))}
          {loading && (
            <div className="message bot-message">
              <strong>AI Vet:</strong> 
              <span className="ml-2 animate-pulse-custom">Typing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Form */}
      <form id="chat-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            id="message-input"
            name="message"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Ask about your pet's health..."
            className="form-input"
            required
            disabled={loading}
          />
        </div>
        <button 
          type="submit" 
          className="btn"
          disabled={loading || !messageInput.trim()}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </Layout>
  );
};

export default Chat;
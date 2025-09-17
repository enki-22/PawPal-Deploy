import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const ConversationsContext = createContext();

export const ConversationsProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const { token } = useAuth();

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const fetchConversations = async (force = false) => {
    // Don't fetch if already loaded and not forcing refresh
    if (conversationsLoaded && !force) {
      return;
    }

    try {
      setLoadingConversations(true);
      const response = await axios.get(`${API_BASE_URL}/chatbot/conversations/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });
      
      // Ensure we always set an array
      const conversationsData = response.data?.conversations || response.data || [];
      setConversations(Array.isArray(conversationsData) ? conversationsData : []);
      setConversationsLoaded(true);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
      setConversationsLoaded(false);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handlePinConversation = async (conversationId, shouldPin) => {
    try {
      console.log('Attempting to toggle pin for conversation:', conversationId);
      const response = await axios.post(`${API_BASE_URL}/chatbot/conversations/${conversationId}/pin/`, {}, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });

      console.log('Pin toggle response:', response.data);
      if (response.data) {
        // Force reload conversations to update the list
        fetchConversations(true);
      }
    } catch (error) {
      console.error('Error pinning/unpinning conversation:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  // Reset conversations when token changes (login/logout)
  useEffect(() => {
    if (token) {
      fetchConversations();
    } else {
      setConversations([]);
      setConversationsLoaded(false);
      setLoadingConversations(false);
    }
  }, [token]);

  const value = {
    conversations,
    loadingConversations,
    conversationsLoaded,
    fetchConversations,
    handlePinConversation,
    refreshConversations: () => fetchConversations(true)
  };

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
};

export const useConversations = () => {
  const context = useContext(ConversationsContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationsProvider');
  }
  return context;
};

export default ConversationsContext;
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

  const fetchConversations = React.useCallback(async () => {
    try {
      setLoadingConversations(true);
      const response = await axios.get(`${API_BASE_URL}/chatbot/conversations/`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
  }, [API_BASE_URL, token]);

  const handlePinConversation = async (conversationId) => {
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

  const handleRenameConversation = async (conversationId, newTitle) => {
    try {
      console.log('Attempting to rename conversation:', conversationId, 'to:', newTitle);
      
      const response = await axios.patch(`${API_BASE_URL}/chatbot/conversations/${conversationId}/update/`, {
        title: newTitle
      }, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      console.log('Rename response:', response.data);
      if (response.status === 200) {
        // Update the conversations list locally first for immediate UI feedback
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === conversationId 
              ? { ...conv, title: newTitle }
              : conv
          )
        );
        
        // Then fetch fresh data to ensure consistency
        await fetchConversations();
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleArchiveConversation = async (conversationId) => {
    try {
      console.log('Attempting to archive conversation:', conversationId);
      const response = await axios.post(`${API_BASE_URL}/chatbot/conversations/${conversationId}/archive/`, {}, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });

      console.log('Archive response:', response.data);
      if (response.data) {
        // Force reload conversations to update the list
        fetchConversations(true);
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      console.log('Attempting to delete conversation:', conversationId);
      const response = await axios.delete(`${API_BASE_URL}/chatbot/conversations/${conversationId}/delete/`, {
        headers: {
          'Authorization': token ? `Token ${token}` : '',
        }
      });

      console.log('Delete response:', response.status);
      if (response.status === 204 || response.status === 200) {
        // Force reload conversations to update the list
        fetchConversations(true);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
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
  }, [token, fetchConversations]);

  const value = {
    conversations,
    loadingConversations,
    conversationsLoaded,
    fetchConversations,
    handlePinConversation,
    handleRenameConversation,
    handleArchiveConversation,
    handleDeleteConversation,
    refreshConversations: fetchConversations
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
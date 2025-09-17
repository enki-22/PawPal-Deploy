import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const useConversations = () => {
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

  const fetchConversations = async () => {
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
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleLoadConversation = (conversationId) => {
    // Navigate to chat page with the selected conversation
    navigate(`/chat?conversation=${conversationId}`);
  };

  const handleCreateNewConversation = () => {
    // Navigate to chat page for a new conversation
    navigate('/chat');
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
        // Reload conversations to update the list
        fetchConversations();
      }
    } catch (error) {
      console.error('Error pinning/unpinning conversation:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  return {
    conversations,
    loadingConversations,
    fetchConversations,
    handleLoadConversation,
    handleCreateNewConversation,
    handlePinConversation
  };
};

export default useConversations;
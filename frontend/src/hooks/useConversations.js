import { useNavigate } from 'react-router-dom';
import { useConversations as useConversationsContext } from '../context/ConversationsContext';

// Enhanced hook that combines context with navigation
const useConversations = () => {
  const navigate = useNavigate();
  const contextData = useConversationsContext();

  const handleLoadConversation = (conversationId) => {
    // Navigate to chat page with the selected conversation
    navigate(`/chat?conversation=${conversationId}`);
  };

  const handleCreateNewConversation = () => {
    // Navigate to chat page for a new conversation
    navigate('/chat');
  };

  return {
    ...contextData,
    handleLoadConversation,
    handleCreateNewConversation
  };
};

export default useConversations;
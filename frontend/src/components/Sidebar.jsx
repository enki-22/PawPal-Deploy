import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
import ConversationMenu from './ConversationMenu';
import './custom-scrollbar.css';

const Sidebar = ({ 
  sidebarVisible = true, 
  currentPage = '',
  showSearch = true,
  showPinnedChats = true,
  showRecentChats = true,
  onToggleSidebar = null,
  conversations = [],
  currentConversationId = null,
  loadingConversations = false,
  onLoadConversation = null,
  onCreateNewConversation = null,
  onPinConversation = null,
  onRenameConversation = null,
  onArchiveConversation = null,
  onDeleteConversation = null,
  isMobileOverlay = false // New prop to detect mobile mode
}) => {
  const navigate = useNavigate();
  const [renamingConversationId, setRenamingConversationId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Ensure conversations is always an array
  const safeConversations = Array.isArray(conversations) ? conversations : [];

  const handleStartRename = (conversationId) => {
    setRenamingConversationId(conversationId);
  };

  const handleCancelRename = () => {
    setRenamingConversationId(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (conversationId) => {
    setSearchTerm('');
    setShowSuggestions(false);
    if (onLoadConversation) {
      onLoadConversation(conversationId);
    }
    // Removed navigation to prevent full page reload
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  const filteredSuggestions = searchTerm
    ? safeConversations.filter(conv =>
        conv.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const menuItems = [
    {
      id: 'ai-diagnosis',
      label: 'AI Diagnosis',
      path: '/ai-diagnosis',
      icon: (
        <img 
          src="/material-symbols_diagnosis-outline.png" 
          alt="AI Diagnosis" 
          className="w-6 h-6" 
        />
      )
    },
    {
      id: 'pet-health-records',
      label: 'Pet Health Records',
      path: '/pet-health-records',
      icon: (
        <img 
          src="/Group 111.png" 
          alt="Pet Health Records" 
          className="w-6 h-6" 
        />
      )
    }
  ];

  return (
    <div className={
      `${isMobileOverlay ? 'w-full' : (sidebarVisible ? 'w-80' : 'w-15')} 
      bg-[#DCCEF1] min-h-screen flex flex-col h-full relative 
      ${isMobileOverlay ? 'overflow-y-auto' : 'overflow-hidden'} 
      ${!isMobileOverlay ? 'transition-width duration-300 ease-in-out' : ''}`
    }>
      {/* Minimized Header - Always visible */}
      <div className={`p-4 flex ${(sidebarVisible || isMobileOverlay) ? 'flex-row items-center justify-between' : 'flex-col items-center space-y-2'}`}>
        <div className={`flex ${(sidebarVisible || isMobileOverlay) ? 'items-center' : 'flex-col items-center w-full'}`}>
          <img 
            src="/pawpalicon.png" 
            alt="PawPal" 
            className={`transition-[width,height] duration-300 flex-shrink-0 ${(sidebarVisible || isMobileOverlay) ? 'w-12 h-12' : 'w-10 h-10'}`} 
          />
          <h1 className={`text-2xl text-[#815FB3] font-extrabold ml-2 transition-[opacity,width] duration-300 ease-in-out ${(sidebarVisible || isMobileOverlay) ? 'opacity-100' : 'opacity-0 w-0'}`} style={{ fontFamily: 'Raleway' }}>
            PAWPAL
          </h1>
        </div>
        {onToggleSidebar && (
          <button 
            onClick={onToggleSidebar}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
            title={isMobileOverlay ? "Close sidebar" : (sidebarVisible ? 'Hide sidebar' : 'Show sidebar')}
          >
            {/* Use sidebar-expand-icon.png for mobile overlay, no rotation or flipping */}
            <img 
              src="/sidebar-expand-icon.png" 
              alt="Toggle sidebar" 
              className="transition-transform duration-300 w-6 h-6"
              style={{ transform: isMobileOverlay ? 'none' : (sidebarVisible ? 'rotate(0deg)' : 'rotate(180deg)') }}
            />
          </button>
        )}
      </div>

      {/* Expandable Content - Only visible when sidebar is expanded */}
      {(sidebarVisible || isMobileOverlay) && (
        <div className="px-4 flex-1 flex flex-col custom-scrollbar">
          {/* New Chat Button */}
          <button 
            onClick={currentPage === 'chat' && onCreateNewConversation ? onCreateNewConversation : () => navigate('/chat/new')}
            className="w-full bg-[#FFF4C9] text-black py-2 px-4 rounded-xl mb-5 text-[15px] font-extrabold shadow-md hover:shadow-lg transition-shadow duration-200" 
            style={{ fontFamily: 'Raleway' }}
          >
            + New Chat
          </button>

          {/* Menu Items */}
          <div className="space-y-2 mb-6">
            {menuItems.map((item) => (
              <div 
                key={item.id}
                className={`flex items-center space-x-3 text-black cursor-pointer p-2.5 rounded-lg transition-colors ${
                  currentPage === item.id 
                    ? 'bg-[#FFF4C9]' 
                    : 'hover:bg-purple-100'
                }`}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <span className="text-[16px] font-extrabold" style={{ fontFamily: 'Raleway' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-b-2 border-black mb-5"></div>

          {/* Search */}
          {showSearch && (
            <div className="relative mb-5">
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-white bg-opacity-50 rounded-lg py-2.5 px-4 pl-10 text-[14px] font-regular"
                style={{ fontFamily: 'Raleway' }}
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleSearchBlur}
              />
              <svg className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuggestions.map(conv => (
                    <div
                      key={conv.id}
                      className="px-4 py-2 cursor-pointer hover:bg-purple-100 text-[14px] truncate"
                      style={{ fontFamily: 'Raleway' }}
                      onMouseDown={() => handleSuggestionClick(conv.id)}
                    >
                      {conv.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pinned Chats */}
          {showPinnedChats && (
            <div className="mb-5">
              <h3 className="text-[14px] font-medium text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>
                Pinned Chats
              </h3>
              <div className="space-y-1">
                {loadingConversations && conversations.length === 0 ? (
                  <div className="text-center text-gray-600 text-sm">Loading...</div>
                ) : (
                  safeConversations.filter(conv => conv.is_pinned).map(conversation => (
                    <div
                      key={conversation.id}
                      className={`p-2 rounded cursor-pointer text-[14px] transition-colors group ${
                        currentConversationId === conversation.id
                          ? 'bg-[#FFF4C9] text-black'
                          : 'text-gray-700 hover:bg-purple-100'
                      }`}
                      style={{ fontFamily: 'Raleway' }}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center space-x-2 flex-1 min-w-0"
                          onClick={() => {
                              if (renamingConversationId === conversation.id) return;
                              if (onLoadConversation) {
                                onLoadConversation(conversation.id);
                              }
                              // Removed navigation to prevent full page reload
                            }}
                        >
                          <img 
                            src="/lets-icons_chat-alt.png" 
                            alt="Chat" 
                            className="w-[14px] h-[14px] flex-shrink-0" 
                          />
                          {renamingConversationId === conversation.id ? (
                            <ConversationMenu
                              conversation={conversation}
                              onPin={onPinConversation}
                              onRename={(id, title) => {
                                console.log('Pinned chat rename callback called:', { id, title });
                                if (onRenameConversation) {
                                  onRenameConversation(id, title);
                                }
                                setRenamingConversationId(null);
                              }}
                              onArchive={onArchiveConversation}
                              onDelete={onDeleteConversation}
                              isRenaming={true}
                              onStartRename={handleStartRename}
                              onCancelRename={handleCancelRename}
                              className="flex-1"
                            />
                          ) : (
                            <span className="truncate">{conversation.title}</span>
                          )}
                        </div>
                        {renamingConversationId !== conversation.id && (
                          <ConversationMenu
                            conversation={conversation}
                            onPin={onPinConversation}
                            onRename={onRenameConversation}
                            onArchive={onArchiveConversation}
                            onDelete={onDeleteConversation}
                            onStartRename={handleStartRename}
                            onCancelRename={handleCancelRename}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Recent Chats */}
          {showRecentChats && (
            <div className="flex-1 flex flex-col">
              <h3 className="text-[14px] font-medium text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>
                Recent Chats
              </h3>
              <div className="space-y-1 max-h-[320px] overflow-y-auto w-full pr-1 flex-1">
                {loadingConversations && conversations.length === 0 ? (
                  <div className="text-center text-gray-600 text-sm">Loading...</div>
                ) : (
                  safeConversations.map(conversation => (
                    <div
                      key={conversation.id}
                      className={`p-2 rounded cursor-pointer text-[14px] transition-colors group ${
                        currentConversationId === conversation.id
                          ? 'bg-[#FFF4C9] text-black'
                          : 'text-gray-700 hover:bg-purple-100'
                      }`}
                      style={{ fontFamily: 'Raleway' }}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center space-x-2 flex-1 min-w-0"
                          onClick={() => {
                              if (renamingConversationId === conversation.id) return;
                              if (onLoadConversation) {
                                onLoadConversation(conversation.id);
                              }
                              // Removed navigation to prevent full page reload
                            }}
                        >
                          <img 
                            src="/lets-icons_chat-alt.png" 
                            alt="Chat" 
                            className="w-[14px] h-[14px] flex-shrink-0" 
                          />
                          {renamingConversationId === conversation.id ? (
                            <ConversationMenu
                              conversation={conversation}
                              onPin={onPinConversation}
                              onRename={(id, title) => {
                                console.log('Recent chat rename callback called:', { id, title });
                                if (onRenameConversation) {
                                  onRenameConversation(id, title);
                                }
                                setRenamingConversationId(null);
                              }}
                              onArchive={onArchiveConversation}
                              onDelete={onDeleteConversation}
                              isRenaming={true}
                              onStartRename={handleStartRename}
                              onCancelRename={handleCancelRename}
                              className="flex-1"
                            />
                          ) : (
                            <>
                              <span className="truncate">{conversation.title}</span>
                              {conversation.is_pinned && (
                                <svg className="w-3 h-3 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              )}
                            </>
                          )}
                        </div>
                        {renamingConversationId !== conversation.id && (
                          <ConversationMenu
                            conversation={conversation}
                            onPin={onPinConversation}
                            onRename={onRenameConversation}
                            onArchive={onArchiveConversation}
                            onDelete={onDeleteConversation}
                            onStartRename={handleStartRename}
                            onCancelRename={handleCancelRename}
                          />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;

import React, { useState, useEffect, useRef } from 'react';

const ConversationMenu = ({ 
  conversation, 
  onPin, 
  onRename, 
  onArchive, 
  onDelete,
  className = "",
  isRenaming = false,
  onStartRename,
  onCancelRename
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [showingAbove, setShowingAbove] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen) {
        const clickedInsideButton = buttonRef.current && buttonRef.current.contains(event.target);
        const clickedInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
        
        if (!clickedInsideButton && !clickedInsideDropdown) {
          setIsOpen(false);
          if (isRenaming && onCancelRename) {
            onCancelRename();
          }
        }
      }
    };

    const handleResize = () => {
      if (isOpen) {
        setIsOpen(false); // Close menu on window resize
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isRenaming, onCancelRename, isOpen]);

  // Update newTitle when conversation title changes
  useEffect(() => {
    setNewTitle(conversation.title);
  }, [conversation.title]);

  // Focus input when renaming starts
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
      // Calculate position when opening the menu
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Estimate dropdown height (approximate based on 4 menu items)
      const dropdownHeight = 180; // More accurate estimate for 4 items with padding
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // Determine if dropdown should appear above or below
      // Show above if: not enough space below AND there's enough space above
      const shouldShowAbove = spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight;
      setShowingAbove(shouldShowAbove);
      
      // Calculate horizontal position (ensure it doesn't go off-screen)
      const dropdownWidth = 128; // min-w-32 = 128px
      let rightPosition = window.innerWidth - buttonRect.right - scrollLeft;
      
      // If dropdown would go off the left edge, adjust position
      if (buttonRect.right - dropdownWidth < 0) {
        rightPosition = window.innerWidth - buttonRect.left - dropdownWidth - scrollLeft;
      }
      
      // Calculate top position with bounds checking
      let topPosition;
      if (shouldShowAbove) {
        topPosition = Math.max(8, buttonRect.top + scrollTop - dropdownHeight - 4);
      } else {
        topPosition = buttonRect.bottom + scrollTop + 4;
        // Ensure dropdown doesn't go below viewport
        const maxTop = scrollTop + viewportHeight - dropdownHeight - 8;
        topPosition = Math.min(topPosition, maxTop);
      }
      
      setDropdownPosition({
        top: topPosition,
        right: Math.max(8, rightPosition) // Ensure at least 8px from edge
      });
    }
    
    setIsOpen(!isOpen);
  };

  const handlePinClick = (e) => {
    e.stopPropagation();
    onPin(conversation.id);
    setIsOpen(false);
  };

  const handleRenameClick = (e) => {
    e.stopPropagation();
    if (onStartRename) {
      onStartRename(conversation.id);
    }
    setIsOpen(false);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const trimmedTitle = newTitle.trim();
    console.log('Rename submit triggered:', { 
      newTitle: trimmedTitle, 
      originalTitle: conversation.title, 
      onRename,
      conversationId: conversation.id 
    });
    
    // Only proceed if title has actually changed and is not empty
    if (trimmedTitle && trimmedTitle !== conversation.title && onRename) {
      console.log('Calling onRename with:', conversation.id, trimmedTitle);
      onRename(conversation.id, trimmedTitle);
    }
    
    // Always call cancel rename to exit rename mode
    if (onCancelRename) {
      onCancelRename();
    }
  };

  const handleRenameCancel = (e) => {
    e.stopPropagation();
    setNewTitle(conversation.title);
    if (onCancelRename) {
      onCancelRename();
    }
  };

  const handleArchiveClick = (e) => {
    e.stopPropagation();
    onArchive(conversation.id);
    setIsOpen(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      if (onDelete) {
        onDelete(conversation.id);
      }
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleRenameCancel(e);
    } else if (e.key === 'Enter') {
      handleRenameSubmit(e);
    }
  };

  if (isRenaming) {
    return (
      <form onSubmit={handleRenameSubmit} className={`flex items-center ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-sm flex-1 min-w-0 w-full text-inherit"
          maxLength={100}
          autoFocus
        />
      </form>
    );
  }

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={handleMenuClick}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded flex items-center justify-center"
        title="More options"
      >
        <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`fixed bg-white border border-gray-200 rounded-md shadow-lg py-1 z-[9999] min-w-32 ${
            showingAbove ? 'shadow-xl' : 'shadow-lg'
          }`}
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          {/* Pin/Unpin Option */}
          <button
            onClick={handlePinClick}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            {conversation.is_pinned ? (
              <>
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Unpin</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>Pin</span>
              </>
            )}
          </button>

          {/* Rename Option */}
          <button
            onClick={handleRenameClick}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Rename</span>
          </button>

          {/* Archive Option */}
          <button
            onClick={handleArchiveClick}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6H5z" />
            </svg>
            <span>{conversation.is_archived ? 'Unarchive' : 'Archive'}</span>
          </button>

          {/* Delete Option */}
          <button
            onClick={handleDeleteClick}
            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ConversationMenu;
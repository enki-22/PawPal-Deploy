import React, { useState, useEffect, useRef } from 'react';
import DeleteConversationModal from './DeleteConversationModal';

const ConversationMenu = ({ 
  conversation, 
  onPin, 
  onRename, 
  onDelete,
  className = "",
  isRenaming = false,
  onStartRename,
  onCancelRename
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // const [showingAbove, setShowingAbove] = useState(false); // Removed: unused variable
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
  // Determine if dropdown should appear above or below
  // Show above if: not enough space below AND there's enough space above
  const showAbove = spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight;
      
      // Calculate horizontal position (ensure it doesn't go off-screen)
      const dropdownWidth = 128; // min-w-32 = 128px
      let rightPosition = window.innerWidth - buttonRect.right - scrollLeft;
      
      // If dropdown would go off the left edge, adjust position
      if (buttonRect.right - dropdownWidth < 0) {
        rightPosition = window.innerWidth - buttonRect.left - dropdownWidth - scrollLeft;
      }
      
      // Calculate top position with bounds checking
      let topPosition;
      if (showAbove) {
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

  const handleRenameSubmit = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmedTitle = newTitle.trim();
    // Only proceed if title has actually changed and is not empty
    if (trimmedTitle && trimmedTitle !== conversation.title && onRename) {
      onRename(conversation.id, trimmedTitle);
    }
    // Always call cancel rename to exit rename mode
    if (onCancelRename) {
      onCancelRename();
    }
  }, [newTitle, conversation.title, conversation.id, onRename, onCancelRename]);

  const handleRenameCancel = (e) => {
    e.stopPropagation();
    setNewTitle(conversation.title);
    if (onCancelRename) {
      onCancelRename();
    }
  };

  // Removed: handleArchiveClick (unused)

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
    setIsOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    if (onDelete) {
      await onDelete(conversation.id);
    }
    setDeleteLoading(false);
    setShowDeleteModal(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleRenameCancel(e);
    } else if (e.key === 'Enter') {
      handleRenameSubmit(e);
    }
  };

  useEffect(() => {
    if (!isRenaming) return;
    function handleOutsideClick(event) {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        handleRenameSubmit(event);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isRenaming, handleRenameSubmit]);

  if (isRenaming) {
    return (
      <form onSubmit={handleRenameSubmit} className={`flex items-center ${className}`} style={{position: 'relative', width: '100%', background: '#EFE8BE', borderRadius: '10px', padding: '8px 12px 16px 12px', minWidth: 0}}>
        <input
          ref={inputRef}
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'Raleway',
            fontWeight: 800,
            fontSize: 14,
            color: '#34113F',
            flex: 1,
            minWidth: 0,
            paddingRight: 32,
            lineHeight: '16px',
          }}
          maxLength={100}
          autoFocus
        />
        {/* Check button to finish renaming */}
        <button
          type="submit"
          style={{
            position: 'absolute',
            right: 12,
            top: 8,
            background: 'none',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Finish renaming"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#815FB3">
            <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.192 9.192-4.242-4.242a1 1 0 0 0-1.414 1.414l4.949 4.95a1 1 0 0 0 1.414 0l9.899-9.896z"/>
          </svg>
        </button>
        {/* Line under input to indicate edit mode */}
        <div style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 8,
          height: 2,
          background: '#815FB3',
          borderRadius: 2,
        }} />
      </form>
    );
  }

  return (
    <>
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
          <>
            <style>{`
              .conversation-menu-btn {
                display: flex; align-items: center; gap: 8px;
                width: 100%; border: none; outline: none;
                font-family: Raleway; font-weight: 800; font-size: 14px;
                line-height: 16px; text-align: center; cursor: pointer;
                padding-left: 12px; padding-right: 12px;
                background: none; color: #34113F;
                transition: background 0.15s, color 0.15s;
              }
              .conversation-menu-btn:hover, .conversation-menu-btn:active {
                background: #815FB3 !important;
                color: #fff !important;
              }
              .conversation-menu-btn svg {
                margin-right: 8px;
              }
            `}</style>
            <div 
              ref={dropdownRef}
              className="z-[9999]"
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                right: `${dropdownPosition.right}px`,
                width: '111px',
                height: '92px',
                background: '#EFE8BE',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 0,
                overflow: 'hidden'
              }}
            >
              {/* Rename Option */}
              <button
                onClick={handleRenameClick}
                className="conversation-menu-btn"
                style={{height: '33px'}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 21h2.5l12.1-12.1c.4-.4.4-1 0-1.4l-2.1-2.1c-.4-.4-1-.4-1.4 0L4 17.5V21zm14.7-13.3c.4-.4.4-1 0-1.4l-2.1-2.1c-.4-.4-1-.4-1.4 0l-1.1 1.1 3.5 3.5 1.1-1.1z"/>
                </svg>
                Rename
              </button>

              {/* Pin/Unpin Option */}
              <button
                onClick={handlePinClick}
                className="conversation-menu-btn"
                style={{height: '26px'}}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 2c-.6 0-1 .4-1 1v2.1c-1.7.4-3 2-3 3.9v2.1l-5.3 5.3c-.4.4-.4 1 0 1.4l2.1 2.1c.4.4 1 .4 1.4 0l5.3-5.3h2.1c1.9 0 3.5-1.3 3.9-3V3c0-.6-.4-1-1-1h-2zm-1 7.1V5h2v4.1c-.3.7-1 1.2-1.7 1.2h-2.1l-5.3 5.3-1.4-1.4 5.3-5.3V5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v2.1c.7.3 1.2 1 1.2 1.7v2.1c0 .7-.5 1.4-1.2 1.7z"/>
                </svg>
                {conversation.is_pinned ? 'Unpin' : 'Pin'}
              </button>

              {/* Delete Option */}
              <button
                onClick={handleDeleteClick}
                className="conversation-menu-btn"
                style={{height: '33px'}}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm3.5-9h1v6h-1v-6zm3 0h1v6h-1v-6zM18 4h-3.5l-1-1h-5l-1 1H6v2h12V4z"/>
                </svg>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
      {/* Delete Confirmation Modal */}
      <DeleteConversationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </>
  );
};

export default ConversationMenu;
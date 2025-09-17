import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileButton = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownVisible && !event.target.closest('.profile-dropdown-container')) {
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

  const handleSettingsClick = () => {
    setDropdownVisible(false);
    navigate('/profile-settings');
  };

  return (
    <div className="relative profile-dropdown-container">
      <button
        onClick={() => setDropdownVisible(!dropdownVisible)}
        className="flex items-center space-x-3 px-4 py-2 bg-[#F0E4B3] hover:bg-[#E6D45B] rounded-full transition-colors"
      >
        <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Raleway' }}>
          {user?.username || 'User'}
        </span>
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          {/* Placeholder for profile image */}
          <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      </button>
      
      {/* Dropdown Menu */}
      {dropdownVisible && (
        <div className="absolute right-0 top-12 bg-[#EFE8BE] rounded-xl shadow-lg py-2 min-w-56 z-50 border border-gray-200">
          <button 
            onClick={handleSettingsClick}
            className="w-full text-left px-5 py-3 hover:bg-[#D4C34A] transition-colors flex items-center space-x-4 text-[#34113F]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[16px]" style={{ fontFamily: 'Raleway', fontWeight: '800' }}>Settings</span>
          </button>
            
            <button 
              onClick={() => console.log('Terms & Policy clicked')}
              className="w-full text-left px-5 py-3 hover:bg-[#D4C34A] transition-colors flex items-center space-x-4 text-[#34113F]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[16px]" style={{ fontFamily: 'Raleway', fontWeight: '800' }}>Terms and Policy</span>
            </button>
            
            <button 
              onClick={handleLogout}
              className="w-full text-left px-5 py-3 hover:bg-[#D4C34A] transition-colors flex items-center space-x-4 text-[#34113F]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-[16px]" style={{ fontFamily: 'Raleway', fontWeight: '800' }}>Logout</span>
            </button>
        </div>
      )}
    </div>
  );
};

export default ProfileButton;

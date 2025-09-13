import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ 
  sidebarVisible = true, 
  currentPage = '',
  showSearch = true,
  showPinnedChats = true,
  showRecentChats = true,
  onToggleSidebar = null
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
    <>
      {/* Minimized Sidebar - Show only PawPal logo when collapsed */}
      {!sidebarVisible && onToggleSidebar && (
        <div className="w-16 bg-[#DCCEF1] flex flex-col items-center py-4 h-screen">
          <div className="mb-4">
            <img src="/pawpalicon.png" alt="PawPal" className="w-8 h-8" />
          </div>
          <button 
            onClick={onToggleSidebar}
            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
            title="Show sidebar"
          >
            <img 
              src="/sidebar-expand-icon.png" 
              alt="Expand sidebar" 
              className="w-4 h-4"
            />
          </button>
        </div>
      )}
      
      {/* Full Sidebar */}
      <div className={`${sidebarVisible ? 'w-80' : 'w-0'} bg-[#DCCEF1] transition-all duration-300 ease-in-out overflow-hidden flex flex-col h-screen`}>
      <div className="p-4 min-w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <img src="/pawpalicon.png" alt="PawPal" className="w-12 h-12 mr-4" />
            <h1 className="text-[#815FB3] text-2xl font-extrabold" style={{ fontFamily: 'Raleway' }}>
              PAWPAL
            </h1>
          </div>
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
              title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
            >
              <img 
                src="/sidebar-expand-icon.png" 
                alt="Toggle sidebar" 
                className="w-6 h-6 transition-transform duration-300"
                style={{ transform: sidebarVisible ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
          )}
        </div>

        {/* New Chat Button */}
        <button 
          onClick={() => navigate('/chat')}
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
            />
            <svg className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}

        {/* Pinned Chats */}
        {showPinnedChats && (
          <div className="mb-5">
            <h3 className="text-[14px] font-medium text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>
              Pinned Chats
            </h3>
            <div className="space-y-1">
              {/* Pinned chats will be populated dynamically */}
            </div>
          </div>
        )}

        {/* Recent Chats */}
        {showRecentChats && (
          <div className="flex-1">
            <h3 className="text-[14px] font-medium text-gray-700 mb-2" style={{ fontFamily: 'Raleway' }}>
              Recent Chats
            </h3>
            <div className="space-y-1">
              {/* Recent chats will be populated dynamically */}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar;

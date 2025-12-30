import React, { useState } from 'react';
import LogoutModal from '../LogoutModal';
import { Settings, LogOut } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminTopNav({ activePage = '' }) {
  const { admin, adminLogout, isMaster, isFrontDesk, adminAxios } = useAdminAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Base navigation links visible to all admin roles
  const navLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    ...(!isFrontDesk ? [{ href: '/admin/reports', label: 'Reports' }] : []),
    { href: '/admin/clients', label: 'Clients' },
    { href: '/admin/pets', label: 'Pets' },
    // Admin Roles link only visible to MASTER admins
    ...(isMaster ? [{ href: '/admin/roles', label: 'Admin Roles' }] : []),
    { href: '/admin/announcements', label: 'Announcements' },
  ];

  // Resolve profile image URL robustly (accept multiple field names and handle relative URLs)
  const _rawAvatar = (
    admin?.profile_image || admin?.profileImage || admin?.avatar || admin?.profile || ''
  ).toString().trim();

  // If backend returns a relative path (starting with '/'), prefix with origin so image loads across pages
  const profileImage = (() => {
    if (!_rawAvatar) return '/pat-removebg-preview 1.png';
    try {
      if (_rawAvatar.startsWith('//')) return window.location.protocol + _rawAvatar; // protocol-relative
      if (_rawAvatar.startsWith('/')) {
        // If admin Axios is available, derive backend origin from its baseURL (strip trailing /api)
        try {
          const base = adminAxios?.defaults?.baseURL || '';
          const backendOrigin = base ? base.replace(/\/api\/?$/, '') : window.location.origin;
          return backendOrigin + _rawAvatar;
        } catch (e) {
          return window.location.origin + _rawAvatar;
        }
      }
      return _rawAvatar; // assume absolute URL
    } catch (e) {
      return '/pat-removebg-preview 1.png';
    }
  })();

  // Debug to help trace avatar issues across pages
  console.debug('AdminTopNav: admin', admin, 'resolvedProfileImage', profileImage);

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#57166b] h-[80px] flex items-center justify-between px-[28px] z-50">
      {/* Logo + Nav group */}
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <div className="w-[40px] h-[40px] relative">
            <img src="/pat__1_-removebg-preview 3.png" alt="PAWPAL Logo" className="w-full h-full object-contain" />
          </div>
          <img src="/pawpal-main.png" alt="PAWPAL" className="h-[26.25px] ml-4 object-contain" />
        </div>
        <nav className="flex items-center gap-x-10 ml-20">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={
                `${activePage === link.label ? 'text-[#fff07b]' : 'text-white'} hover:text-[#fff07b] transition-colors font-['Raleway:SemiBold',sans-serif] text-[18px] tracking-[0.9px]`
              }
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3 relative">
        <div
          className="w-[40px] h-[40px] rounded-full overflow-hidden bg-white border-2 border-[#fff07b] cursor-pointer"
          onClick={() => setProfileMenuOpen((open) => !open)}
          style={{ position: 'relative', zIndex: 51 }}
        >
          {/* UPDATED: Dynamic Profile Image */}
          <img src={profileImage} alt="User Avatar" className="w-full h-full object-cover" />
        </div>
        {profileMenuOpen && (
          <div
            className="absolute right-0 w-[170px] bg-[#f0e4b3] rounded shadow-lg z-50 border border-[#e5e5c3]"
            style={{ top: 'calc(100% + 4px)' }}
          >
            <div className="absolute -top-2 right-6 w-4 h-4" style={{pointerEvents: 'none'}}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 0 L16 16 L0 16 Z" fill="#f0e4b3" />
              </svg>
            </div>
            <div className="flex flex-col py-3 px-4 gap-3">
              <button
                className="flex items-center gap-3 text-[#57166B] font-bold text-[18px] hover:bg-[#e5e5c3] rounded px-2 py-1"
                onClick={() => { window.location.href = '/admin/profile-settings'; }}
              >
                <Settings className="w-6 h-6" />
                Settings
              </button>
              <button className="flex items-center gap-3 text-[#57166B] font-bold text-[18px] hover:bg-[#e5e5c3] rounded px-2 py-1" onClick={() => setLogoutModalOpen(true)}>
                <LogOut className="w-6 h-6" />
                Logout
              </button>
              <LogoutModal
                isOpen={logoutModalOpen}
                loading={logoutLoading}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={async () => {
                  setLogoutLoading(true);
                  await adminLogout();
                  setLogoutLoading(false);
                  setLogoutModalOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

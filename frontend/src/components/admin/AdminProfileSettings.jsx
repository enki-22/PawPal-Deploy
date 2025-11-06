import React, { useState, useEffect } from 'react';
import AdminTopNav from './AdminTopNav';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminProfileSettings() {
  const { admin: authAdmin, adminAxios } = useAdminAuth();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminAxios]);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAxios.get('/admin/profile');
      
      if (response.data.success && response.data.admin) {
        setAdmin(response.data.admin);
      } else {
        // Fallback to auth admin data if profile endpoint fails
        setAdmin(authAdmin);
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError('Failed to load profile data');
      // Fallback to auth admin data
      setAdmin(authAdmin);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <AdminTopNav activePage="" />
        <div className="pt-[100px] px-8 max-w-3xl mx-auto">
          <div className="text-center text-gray-500 py-12">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <AdminTopNav activePage="" />
      <div className="pt-[100px] px-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8" style={{fontFamily: 'Raleway, sans-serif'}}>Profile Settings</h2>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {!admin ? (
          <div className="text-center text-gray-500 py-12">
            No profile data found.
          </div>
        ) : (
          <>
            <div className="bg-[#fffbe9] rounded-xl p-8 mb-8 flex items-center gap-8 shadow">
              <div className="relative">
                <div className="w-[120px] h-[120px] rounded-full bg-[#815fb3] flex items-center justify-center overflow-hidden">
                  {admin.profile_image ? (
                    <img src={admin.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <img src="/pat-removebg-preview 2.png" alt="Profile" className="w-[80px] h-[80px] object-contain" />
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-[#fff07b] rounded-full p-2 border border-[#815fb3] cursor-pointer">
                  <svg width="24" height="24" fill="none" stroke="#815fb3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 9.94a2 2 0 0 1-1.74 3.06H5.69a2 2 0 0 1-1.74-3.06L9.69 8a2 2 0 0 1 3.62 0z"/></svg>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold" style={{fontFamily: 'Raleway, sans-serif'}}>
                  {admin.name || admin.full_name || admin.username || 'Admin User'}
                </div>
                <div className="text-[#888] font-semibold mb-2">{admin.role || 'Admin'}</div>
                <div className="flex items-center gap-2 text-[#57166b] mb-1">
                  <svg width="18" height="18" fill="none" stroke="#57166b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="16" height="12" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
                  {admin.email || 'No email'}
                </div>
                <div className="flex items-center gap-2 text-[#57166b] mb-1">
                  <svg width="18" height="18" fill="none" stroke="#57166b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 2v2m0 12v2m8-8h-2M4 10H2m15.07 7.07l-1.41-1.41M6.34 6.34L4.93 4.93"/></svg>
                  {admin.clinic_info || admin.clinic_name || admin.clinic || 'No clinic info'}
                </div>
                <div className="flex items-center gap-2 text-[#57166b]">
                  <svg width="18" height="18" fill="none" stroke="#57166b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.72 3.06a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.99.35 2.01.59 3.06.72A2 2 0 0 1 21 16.91z"/></svg>
                  {admin.contact_number || admin.phone || admin.contact || 'No phone'}
                </div>
              </div>
            </div>
            <div className="bg-[#fffbe9] rounded-xl p-8 shadow">
              <div className="text-xl font-bold mb-2" style={{fontFamily: 'Raleway, sans-serif'}}>SECURITY INFO</div>
              <div className="text-[#888] mb-6">Manage your login and recovery details to keep your clinic data safe.</div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <svg width="22" height="22" fill="none" stroke="#57166b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="8" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span className="font-semibold">Password</span>
                    <span className="text-xs text-[#888] ml-2">
                      Last Updated: {admin.password_updated_at 
                        ? new Date(admin.password_updated_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Never'}
                    </span>
                  </div>
                  <button className="bg-[#815fb3] text-white px-6 py-2 rounded font-bold" style={{fontFamily: 'Raleway, sans-serif'}}>Change</button>
                </div>
                <div className="flex items-center justify-between border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <svg width="22" height="22" fill="none" stroke="#57166b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
                    <span className="font-semibold">Recovery Email</span>
                    <span className={`text-xs ml-2 ${admin.recovery_email_verified ? 'text-green-600' : 'text-[#e74c3c]'}`}>
                      {admin.recovery_email 
                        ? (admin.recovery_email_verified ? 'Verified' : 'Not Verified')
                        : 'Not Configured'}
                    </span>
                    {admin.recovery_email && (
                      <span className="text-xs text-[#888] ml-2">({admin.recovery_email})</span>
                    )}
                  </div>
                  <button className="bg-[#fff07b] text-[#57166b] px-6 py-2 rounded font-bold border border-[#e5e5c3]" style={{fontFamily: 'Raleway, sans-serif'}}>
                    {admin.recovery_email ? 'Change' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

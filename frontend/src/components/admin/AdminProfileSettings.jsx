import React, { useState, useEffect, useRef } from 'react';

// --- MOCKED DEPENDENCIES FOR STANDALONE PREVIEW ---
// In your actual project, you would import these from their respective files.

const AdminTopNav = () => (
  <div className="fixed top-0 left-0 right-0 h-[80px] bg-[#57166b] flex items-center justify-between px-8 z-50 shadow-md">
    <div className="flex items-center gap-2">
       <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-[#57166b] font-bold text-xs">
         <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
       </div>
       <span className="text-white font-bold text-xl tracking-wider">PAWPAL</span>
    </div>
    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border-2 border-white">
      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
    </div>
  </div>
);

// Mocking the auth hook
const useAdminAuth = () => {
  return {
    admin: {
      name: 'DR. MIRA C. SANTOS',
      role: 'Veterinarian',
      email: 'mirasantos.pawpal@gmail.com',
      contact_number: '0905 - xxx - xxxx',
      clinic_info: 'Southvalley Veterinary Clinic\n- Santa Rosa, Laguna',
      profile_image: null, // Set to null to test fallback
      recovery_email: null,
      password_updated_at: null
    },
    adminAxios: {
      get: () => Promise.resolve({ 
        data: { 
          success: true, 
          admin: {
            name: 'DR. MIRA C. SANTOS',
            role: 'Veterinarian',
            email: 'mirasantos.pawpal@gmail.com',
            contact_number: '0905 - xxx - xxxx',
            clinic_info: 'Southvalley Veterinary Clinic\n- Santa Rosa, Laguna',
            profile_image: null,
            recovery_email: null,
            password_updated_at: null
          } 
        } 
      })
    }
  };
};
// --------------------------------------------------


export default function AdminProfileSettings() {
  const { admin: authAdmin, adminAxios } = useAdminAuth();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Mapped icons to relative paths as requested
  const icons = {
    paw: "/mdi_paw1.png",
    email: "/email.png",
    location: "/location.png",
    phone: "/phone.png",
    password: "/mdi_password.png",
    camera: "/camera-icon.png" 
  };

  useEffect(() => {
    fetchAdminProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const response = await adminAxios.get('/admin/profile');
      
      if (response.data.success && response.data.admin) {
        setAdmin(response.data.admin);
      } else {
        setAdmin(authAdmin);
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
      setError('Failed to load profile data');
      setAdmin(authAdmin);
    } finally {
      setLoading(false);
    }
  };

  // Handler for clicking the camera button
  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  // Handler for file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create form data to send
    const formData = new FormData();
    formData.append('profile_image', file);

    try {
      alert(`Selected file: ${file.name}. This would upload to the server in production.`);
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  const handleChangePassword = () => {
    console.log("Change password clicked");
  };

  const handleRecoveryEmailAction = () => {
    console.log("Recovery email action clicked");
  };

  

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0]">
        <AdminTopNav />
        <div className="pt-[120px] px-8 max-w-3xl mx-auto">
          <div className="text-center text-gray-500 py-12 font-sans animate-pulse">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-sans pb-20">
      <AdminTopNav />
      
      <div className="pt-[120px] px-4 md:px-8 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-[#1a1a1a]" style={{fontFamily: 'Raleway, sans-serif'}}>
          Profile Settings
        </h2>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
            <p>{error}</p>
          </div>
        )}

        {!admin ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow">
            No profile data found.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* PROFILE CARD */}
            <div className="bg-[#FFFFF0] rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar Section */}
              <div className="relative shrink-0">
                <div className="w-40 h-40 rounded-full bg-[#815fb3] flex items-center justify-center overflow-hidden shadow-inner border-[6px] border-white relative z-10">
                  {admin.profile_image ? (
                    <img src={admin.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    // Placeholder icon (Paw)
                    <div className="flex items-center justify-center w-full h-full bg-[#815fb3]">
                         {/* Using an SVG fallback if the png is missing in preview, representing mdi_paw1.png */}
                        <img 
                          src={icons.paw} 
                          onError={(e) => {
                              e.target.style.display='none';
                              e.target.nextSibling.style.display='block';
                          }}
                          alt="Paw Placeholder" 
                          className="w-20 h-20 object-contain opacity-90" 
                        />
                        <svg style={{display:'none'}} className="w-20 h-20 text-[#F0E68C]" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A1.5,1.5 0 0,0 10.5,7.5A1.5,1.5 0 0,0 12,9A1.5,1.5 0 0,0 13.5,7.5A1.5,1.5 0 0,0 12,6M8,8A1.5,1.5 0 0,0 6.5,9.5A1.5,1.5 0 0,0 8,11A1.5,1.5 0 0,0 9.5,9.5A1.5,1.5 0 0,0 8,8M16,8A1.5,1.5 0 0,0 14.5,9.5A1.5,1.5 0 0,0 16,11A1.5,1.5 0 0,0 17.5,9.5A1.5,1.5 0 0,0 16,8M9,13C8.5,13 8.08,13.23 7.79,13.59C7.26,13.22 6.62,13 5.92,13C4.12,13 2.63,14.36 2.5,16.11C3.18,17.21 4.4,18 5.92,18C6.62,18 7.26,17.78 7.79,17.41C8.08,17.77 8.5,18 9,18C9.85,18 10.64,17.64 11.21,17.06C11.78,17.64 12.57,18 13.42,18C14.27,18 15.06,17.64 15.63,17.06C16.2,17.64 16.99,18 17.84,18C18.34,18 18.76,17.77 19.05,17.41C19.58,17.78 20.22,18 20.92,18C22.44,18 23.66,17.21 24.34,16.11C24.21,14.36 22.72,13 20.92,13C20.22,13 19.58,13.22 19.05,13.59C18.76,13.23 18.34,13 17.84,13C16.99,13 16.2,13.36 15.63,13.94C15.06,13.36 14.27,13 13.42,13C12.57,13 11.78,13.36 11.21,13.94C10.64,13.36 9.85,13 9,13Z" /></svg>
                    </div>
                  )}
                </div>
                
                {/* Camera Button */}
                <button 
                  onClick={handleCameraClick}
                  className="absolute bottom-2 right-0 bg-[#3C2A4D] hover:bg-[#2a1d36] rounded-full p-2 border-2 border-white shadow-lg transition-transform active:scale-95 flex items-center justify-center z-20 cursor-pointer"
                  title="Update Profile Picture"
                >
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                   </svg>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Details Section */}
              <div className="flex-1 flex flex-col gap-2 text-center md:text-left pt-2 w-full">
                <h3 className="text-2xl font-bold text-[#1a1a1a] uppercase tracking-wide mb-1" style={{fontFamily: 'Raleway, sans-serif'}}>
                  {admin.name || 'DR. MIRA C. SANTOS'}
                </h3>
                <p className="text-gray-500 text-lg font-medium mb-4">
                  {admin.role || 'Veterinarian'}
                </p>

                <div className="flex flex-col gap-3 w-full">
                  {/* Email */}
                  <div className="flex items-center justify-center md:justify-start gap-3 text-gray-600">
                    <div className="w-5 flex justify-center">
                        {/* Using SVG directly for reliability in preview if image fails */}
                        <img src={icons.email} alt="" className="w-5 h-5 object-contain opacity-70" onError={e => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
                        <svg className="w-5 h-5 text-[#815fb3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{display: 'none'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <span className="text-base font-medium">{admin.email || 'mirasantos.pawpal@gmail.com'}</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-start justify-center md:justify-start gap-3 text-gray-600">
                    <div className="w-5 flex justify-center mt-0.5">
                        <img src={icons.location} alt="" className="w-5 h-5 object-contain opacity-70" onError={e => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
                        <svg className="w-5 h-5 text-[#815fb3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{display: 'none'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <span className="text-base font-medium leading-tight text-left">
                      {admin.clinic_info || 'Southvalley Veterinary Clinic\n- Santa Rosa, Laguna'}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-center md:justify-start gap-3 text-gray-600">
                    <div className="w-5 flex justify-center">
                        <img src={icons.phone} alt="" className="w-5 h-5 object-contain opacity-70" onError={e => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
                        <svg className="w-5 h-5 text-[#815fb3]" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{display: 'none'}}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </div>
                    <span className="text-base font-medium">{admin.contact_number || '0905 - xxx - xxxx'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECURITY INFO CARD */}
            <div className="bg-[#FFFFF0] rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-black mb-2 uppercase" style={{fontFamily: 'Raleway, sans-serif'}}>
                Security Info
              </h3>
              <p className="text-gray-500 mb-8 font-medium text-sm md:text-base">
                Manage your login and recovery details to keep your clinic data safe.
              </p>

              <div className="flex flex-col gap-5">
                {/* Password Row */}
                <div className="bg-[#FFFFF2] border border-gray-300 rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center w-full md:w-auto gap-4">
                    <div className="w-5 h-5 flex items-center justify-center">
                        <img src={icons.password} alt="Lock" className="w-full h-full object-contain" onError={e => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24" style={{display: 'none'}}><path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 5a3 3 0 016 0v3H9V7z"/></svg>
                    </div>
                    <span className="font-semibold text-gray-800 text-lg">Password</span>
                  </div>
                  
                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex items-center gap-2 text-gray-500 font-medium whitespace-nowrap">
                      <span className="text-black font-semibold">Last Updated:</span>
                      <span>
                        {admin.password_updated_at 
                          ? new Date(admin.password_updated_at).toLocaleDateString() 
                          : 'Never'}
                      </span>
                    </div>
                    <button 
                      onClick={handleChangePassword}
                      className="bg-[#815fb3] hover:bg-[#6f4ea0] text-white px-8 py-2.5 rounded-lg font-bold transition-colors shadow-sm w-full md:w-auto"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Recovery Email Row */}
                <div className="bg-[#FFFFF2] border border-gray-300 rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center w-full md:w-auto gap-4">
                    <div className="w-5 h-5 flex items-center justify-center">
                        <img src={icons.email} alt="Email" className="w-full h-full object-contain" onError={e => {e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
                        <svg className="w-4 h-4 text-[#815fb3]" fill="currentColor" viewBox="0 0 20 20" style={{display: 'none'}}><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path></svg>
                    </div>
                    <span className="font-semibold text-gray-800 text-lg">Recovery Email</span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 w-full md:w-auto justify-between md:justify-end">
                    {/* Status Indicator */}
                    {admin.recovery_email ? (
                      <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full whitespace-nowrap">
                         <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                         {admin.recovery_email}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500 font-medium whitespace-nowrap">
                         <div className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">!</div>
                         Not Configured
                      </div>
                    )}

                    {/* Action Button */}
                    <button 
                      onClick={handleRecoveryEmailAction}
                      className={`${
                        admin.recovery_email 
                          ? 'bg-[#815fb3] text-white hover:bg-[#6f4ea0]' 
                          : 'bg-[#FFF59D] text-black hover:bg-[#FFF176] border border-yellow-200'
                      } px-10 py-2.5 rounded-lg font-bold transition-colors shadow-sm w-full md:w-auto`}
                    >
                      {admin.recovery_email ? 'Change' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";
// Temporary SVG paths
const svgPaths = {
  p26a65980: "M2 2C2 2.55228 1.55228 3 1 3C0.447715 3 0 2.55228 0 2C0 1.44772 0.447715 1 1 1C1.55228 1 2 1.44772 2 2Z M2 8C2 8.55228 1.55228 9 1 9C0.447715 9 0 8.55228 0 8C0 7.44772 0.447715 7 1 7C1.55228 7 2 7.44772 2 8Z M2 14C2 14.5523 1.55228 15 1 15C0.447715 15 0 14.5523 0 14C0 13.4477 0.447715 13 1 13C1.55228 13 2 13.4477 2 14Z",
  p1351f980: "M12.5 11H11.71L11.43 10.73C12.41 9.59 13 8.11 13 6.5C13 2.91 10.09 0 6.5 0C2.91 0 0 2.91 0 6.5C0 10.09 2.91 13 6.5 13C8.11 13 9.59 12.41 10.73 11.43L11 11.71V12.5L16 17.49L17.49 16L12.5 11ZM6.5 11C4.01 11 2 8.99 2 6.5C2 4.01 4.01 2 6.5 2C8.99 2 11 4.01 11 6.5C11 8.99 8.99 11 6.5 11Z",
  p134c4200: "M4.5 0L9 5H0L4.5 0Z",
  p158ce200: "M5 0L10 7H0L5 0ZM5 14L10 7H0L5 14Z",
  p34a09400: "M0 10.5L10.5 21V0L0 10.5Z"
};

export default function AdminRoles() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { adminAxios } = useAdminAuth();

  const fetchAdmins = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAxios.get('/admin/roles');
      if (response.data.success) {
        setAdmins(response.data.results || []);
      } else {
        setError('Failed to load admin accounts');
      }
    } catch (err) {
      console.error('❌ AdminRoles fetch error:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error response data:', err.response?.data);
      console.error('❌ Error response status:', err.response?.status);
      
      if (err.response?.status === 403) {
        setError('Access denied. Only Master Admin can access this page.');
      } else if (err.response?.status === 401) {
        const errorData = err.response?.data || {};
        const errorMsg = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        const errorCode = errorData.code || 'UNKNOWN';
        console.error(`❌ 401 Error: ${errorMsg} (code: ${errorCode})`);
        console.error('❌ Full error response data:', JSON.stringify(errorData, null, 2));
        if (errorData.debug_info) {
          console.error('❌ Debug info:', errorData.debug_info);
        }
        setError(`Authentication failed: ${errorMsg}. Please login again.`);
      } else {
        setError('Failed to load admin accounts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [adminAxios]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Loading state
    if (loading) {
      return null;
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#f0f0f0] relative size-full" data-name="Admin Roles">
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAdmins}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f0f0] relative size-full" data-name="Admin Roles">
      {/* Header */}
      <div className="absolute bg-[#57166b] h-[80px] left-0 top-0 w-[1535px]" />
      {/* Logo */}
      <div className="absolute left-[28px] size-[40px] top-[20px] flex items-center justify-center bg-white rounded-full" data-name="pat__1_-removebg-preview 3">
        <span role="img" aria-label="logo" style={{fontSize: "32px"}}>🐾</span>
      </div>
      {/* PAWPAL Text */}
      <p className="absolute font-['MuseoModerno:Black',sans-serif] font-black leading-[normal] left-[155px] text-[#fff07b] text-[35px] text-center text-nowrap top-[13px] translate-x-[-50%] whitespace-pre">PAWPAL</p>
      {/* Navigation */}
      <p className="absolute font-['Raleway:SemiBold',sans-serif] font-semibold leading-[normal] left-[298px] text-[18px] text-nowrap text-white top-[31px] tracking-[0.9px] whitespace-pre">Dashboard</p>
      <p className="absolute font-['Raleway:SemiBold',sans-serif] font-semibold leading-[normal] left-[436px] text-[18px] text-nowrap text-white top-[31px] tracking-[0.9px] whitespace-pre">Reports</p>
      <p className="absolute font-['Raleway:SemiBold',sans-serif] font-semibold leading-[normal] left-[545px] text-[18px] text-nowrap text-white top-[31px] tracking-[0.9px] whitespace-pre">Clients</p>
      <p className="absolute font-['Raleway:SemiBold',sans-serif] font-semibold leading-[normal] left-[647px] text-[18px] text-nowrap text-white top-[31px] tracking-[0.9px] whitespace-pre">Pets</p>
      <p className="absolute font-['Raleway:SemiBold',sans-serif] font-semibold leading-[normal] left-[724px] text-[#fff07b] text-[18px] text-nowrap top-[32px] tracking-[0.9px] whitespace-pre">Admin Roles</p>
      <p className="absolute font-['Raleway:SemiBold',sans-serif] font-semibold leading-[normal] left-[881px] text-[18px] text-nowrap text-white top-[32px] tracking-[0.9px] whitespace-pre">Announcements</p>
      {/* Profile Menu Icon */}
      <div className="absolute left-[1429px] size-[24px] top-[28px]" data-name="fe:elipsis-v">
        <div className="absolute inset-[16.67%_41.67%]" data-name="Vector">
          <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 240, 123, 1)" }}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 16">
              <path clipRule="evenodd" d={svgPaths.p26a65980} fill="var(--fill-0, #FFF07B)" fillRule="evenodd" id="Vector" />
            </svg>
          </div>
        </div>
      </div>
      {/* Profile Picture */}
      <div className="absolute bg-white left-[1456px] rounded-[100px] size-[40px] top-[20px] flex items-center justify-center" data-name="Profile">
        <span role="img" aria-label="profile" style={{fontSize: "28px"}}>👤</span>
        <div aria-hidden="true" className="absolute border-2 border-[#fff07b] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </div>
      {/* Page Title */}
      <p className="absolute font-['Raleway:Bold',sans-serif] font-bold leading-[normal] left-[129px] text-[20px] text-black text-nowrap top-[108px] tracking-[1px] whitespace-pre">Admin Roles</p>
      {/* Add Admin Button */}
      <div className="absolute bg-[rgba(187,159,228,0.8)] h-[31px] left-[394px] rounded-[5px] top-[100px] w-[121px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[417px] not-italic text-[12px] text-black text-nowrap top-[108px] whitespace-pre">+ Add Admin</p>
      {/* Search Bar */}
      <div className="absolute h-[31px] left-[536px] rounded-[5px] top-[100px] w-[465px]">
        <div aria-hidden="true" className="absolute border border-[#888888] border-solid inset-0 pointer-events-none rounded-[5px]" />
      </div>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[571px] not-italic text-[#888888] text-[12px] text-nowrap top-[108px] whitespace-pre">Search</p>
      <div className="absolute left-[542px] size-[24px] top-[104px]" data-name="material-symbols:search-rounded">
        <div className="absolute inset-[12.5%_14.27%_14.27%_12.5%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
            <path d={svgPaths.p1351f980} fill="var(--fill-0, #888888)" id="Vector" />
          </svg>
        </div>
      </div>
      {/* Role Filter */}
      <div className="absolute bg-[#f0e4b3] h-[31px] left-[1158px] rounded-[5px] top-[100px] w-[121px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[1167px] not-italic text-[12px] text-black text-nowrap top-[108px] whitespace-pre">Role</p>
      <div className="absolute flex items-center justify-center left-[1259px] size-[12px] top-[110px]">
        <div className="flex-none scale-y-[-100%]">
          <div className="relative size-[12px]" data-name="ep:arrow-up">
            <div className="absolute inset-[32.66%_13.69%_26.3%_13.69%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 5">
                <path d={svgPaths.p134c4200} fill="var(--fill-0, black)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* Status Filter */}
      <div className="absolute bg-[#f0e4b3] h-[31px] left-[1296px] rounded-[5px] top-[100px] w-[122px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[1311px] not-italic text-[12px] text-black text-nowrap top-[108px] whitespace-pre">Status</p>
      <div className="absolute flex items-center justify-center left-[1398px] size-[12px] top-[110px]">
        <div className="flex-none scale-y-[-100%]">
          <div className="relative size-[12px]" data-name="ep:arrow-up">
            <div className="absolute inset-[32.66%_13.69%_26.3%_13.69%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9 5">
                <path d={svgPaths.p134c4200} fill="var(--fill-0, black)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* Table Container */}
      <div className="absolute bg-[#fffff2] h-[537px] left-[118px] overflow-clip top-[148px] w-[1300px]">
        {/* Table Header */}
        <div className="absolute contents left-0 top-0">
          <div className="absolute bg-[#fffff2] h-[40px] left-0 rounded-tl-[10px] rounded-tr-[10px] top-0 w-[1300px]">
            <div aria-hidden="true" className="absolute border-[#888888] border-[0px_0px_1px] border-solid inset-0 pointer-events-none rounded-tl-[10px] rounded-tr-[10px]" />
          </div>
          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[75px] not-italic text-[#888888] text-[12px] text-nowrap top-[12px] whitespace-pre">Registered User</p>
          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[325px] not-italic text-[#888888] text-[12px] text-nowrap top-[13px] whitespace-pre">Emails</p>
          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[575px] not-italic text-[#888888] text-[12px] text-nowrap top-[12px] whitespace-pre">Role</p>
          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[825px] not-italic text-[#888888] text-[12px] text-nowrap top-[11px] whitespace-pre">Account Status</p>
          <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[1075px] not-italic text-[#888888] text-[12px] text-nowrap top-[12px] whitespace-pre">Date Account Created</p>
          {/* Sort Icons */}
          {/* ...SVG sort icons unchanged... */}
        </div>
        {/* Header Checkbox */}
        <div className="absolute left-[32px] size-[12px] top-[13px]" data-name="Checkbox">
          <div className="absolute bg-[#ededed] inset-0 rounded-[1px]">
            <div aria-hidden="true" className="absolute border border-[#888888] border-solid inset-0 pointer-events-none rounded-[1px]" />
          </div>
        </div>
        {/* Dynamic Table Rows */}
        {admins.length === 0 ? (
          <div className="absolute left-0 top-[40px] w-[1300px] h-[50px] flex items-center justify-center">
            <span className="text-gray-500">No admin accounts found</span>
          </div>
        ) : (
          admins.map((adminItem, idx) => {
            const top = 40 + idx * 50;
            return (
              <div key={adminItem.admin_id || adminItem.id} className="absolute contents left-0" style={{ top: `${top}px` }}>
                <div className="absolute bg-[#fffff2] h-[50px] left-0 top-0 w-[1300px]">
                  <div aria-hidden="true" className="absolute border-[#888888] border-[0px_0px_1px] border-solid inset-0 pointer-events-none" />
                </div>
                <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[normal] left-[75px] not-italic text-[12px] text-black text-nowrap top-[16px] whitespace-pre">{adminItem.name}</p>
                <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[287px] not-italic text-[12px] text-black text-nowrap top-[16px] whitespace-pre">{adminItem.email}</p>
                <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[575px] not-italic text-[12px] text-black text-nowrap top-[17px] whitespace-pre">{adminItem.role_display || adminItem.role}</p>
                <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[1075px] not-italic text-[12px] text-black text-nowrap top-[17px] whitespace-pre">{new Date(adminItem.date_created || adminItem.created_at).toLocaleDateString()}</p>
                {/* Status Badge */}
                <div className={`absolute ${adminItem.status === 'Active' || adminItem.is_active ? 'bg-[#c2f0b3]' : 'bg-[#ffb2a8]'} h-[30px] left-[825px] rounded-[5px] top-[10px] w-[66px]`} />
                <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[841px] not-italic text-[12px] text-black text-nowrap top-[17px] whitespace-pre">{adminItem.status || (adminItem.is_active ? 'Active' : 'Inactive')}</p>
                {/* Row Checkbox */}
                <div className="absolute left-[32px] size-[12px] top-[29px]" data-name="Checkbox">
                  <div className="absolute bg-[#ededed] inset-0 rounded-[1px]">
                    <div aria-hidden="true" className="absolute border border-[#888888] border-solid inset-0 pointer-events-none rounded-[1px]" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Pagination (static for now) */}
      <div className="absolute left-[741px] size-[24px] top-[724px]" data-name="fluent:ios-arrow-24-filled">
        <div className="absolute inset-[8.33%_45.79%_8.29%_10.41%]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 21">
            <path d={svgPaths.p34a09400} fill="var(--fill-0, #888888)" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="absolute bg-[#815fb3] left-[765px] rounded-[5px] size-[27px] top-[722px]" />
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[normal] left-[776px] not-italic text-[12px] text-nowrap text-white top-[728px] whitespace-pre">1</p>
      <div className="absolute flex items-center justify-center left-[792px] size-[24px] top-[724px]">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div className="relative size-[24px]" data-name="fluent:ios-arrow-24-filled">
            <div className="absolute inset-[8.33%_45.79%_8.29%_10.41%]" data-name="Vector">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 21">
                <path d={svgPaths.p34a09400} fill="var(--fill-0, #888888)" id="Vector" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
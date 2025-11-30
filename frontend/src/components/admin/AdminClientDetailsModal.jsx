import React, { useState, useEffect } from 'react';
import showToast from '../../utils/toast';
import { X, MapPin, Phone, Mail, Facebook, Calendar, User as UserIcon } from 'lucide-react';
// FIX: import locations + custom dropdown
import CustomDropdown from '../common/CustomDropdown';
import phLocations from '../../data/ph_locations.json';

const AdminClientDetailsModal = ({ clientId, onClose, adminAxios, onUpdateSuccess }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Close when clicking strictly on the overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (!clientId) return;
    const fetchClientDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await adminAxios.get(`/admin/clients/${clientId}`);
        const apiData = response.data && response.data.client ? response.data.client : response.data;

        // Helper to format Location nicely
        const city = apiData.city || '';
        const province = apiData.province || '';
        const formattedLocation = city && province ? `${city}, ${province}` : (city || province || 'N/A');
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';
        const resolveUrl = (val) => {
          if (!val) return null;
          const isAbsolute = /^(https?:|blob:|data:)/.test(val);
          return isAbsolute ? val : `${API_BASE_URL.replace('/api', '')}${val}`;
        };

        const profilePic = resolveUrl(apiData.profile_image || apiData.profile_picture);
        const pets = (apiData.pets || []).map(p => ({
          ...p,
          photo: resolveUrl(p.photo) || null
        }));

        setClient({
          ...apiData,
          username: apiData.username || '',
          // normalized profile picture (null if none) so we can show the same SVG placeholder as user components
          profile_picture: profilePic || null,
          location_formatted: formattedLocation,
          status_color: apiData.status === 'Active' ? 'bg-[#c2f0b3] text-[#2d5c1f]' : 
                        apiData.status === 'Inactive' ? 'bg-[#f0b3b3] text-[#5c1f1f]' : 
                        'bg-[#fff4c9] text-[#5c4d1f]',
          // normalized pets
          pets: pets
        });
      } catch (err) {
        console.error("Fetch error:", err);
        setError('Could not load client details.');
      } finally {
        setLoading(false);
      }
    };
    fetchClientDetails();
  }, [clientId, adminAxios]);

  // Action / edit state
  // Per-action loading flags are used (verifyLoading, deactivateLoading, editSaving)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showUnverifyModal, setShowUnverifyModal] = useState(false);
  const [unverifyLoading, setUnverifyLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateLoading, setActivateLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    email: '',
    contact_number: '',
    facebook_link: '',
    city: '',
    province: ''
  });
  const [editSaving, setEditSaving] = useState(false);

  // Call the verify endpoint (used by the confirm dialog)
  const doVerifyClient = async () => {
    if (!client || !client.id) return;
    setVerifyLoading(true);
    try {
      const res = await adminAxios.post(`/admin/clients/${client.id}/verify`);
      if (res.data && res.data.success) {
        setClient(prev => ({ ...prev, status: 'Active' }));
        try {
          window.dispatchEvent(new CustomEvent('profileVerified', { detail: { user_id: client.id } }));
        } catch (evErr) {
          console.debug('profileVerified dispatch failed', evErr);
        }
        showToast({ message: res.data.message || 'Client verified', type: 'success' });
      } else {
        console.error('Verify failed', res.data);
        showToast({ message: res.data?.error || 'Failed to verify client', type: 'error' });
      }
    } catch (err) {
      console.error('Verify client error:', err);
      showToast({ message: 'Failed to verify client. See console for details.', type: 'error' });
    } finally {
      setVerifyLoading(false);
      setShowVerifyModal(false);
    }
  };

  // Call unverify endpoint (used by confirm dialog)
  const doUnverifyClient = async () => {
    if (!client || !client.id) return;
    setUnverifyLoading(true);
    try {
      const res = await adminAxios.post(`/admin/clients/${client.id}/unverify`);
      if (res.data && res.data.success) {
        setClient(prev => ({ ...prev, is_verified: false }));
        showToast({ message: res.data.message || 'Client unverified', type: 'success' });
      } else {
        console.error('Unverify failed', res.data);
        showToast({ message: res.data?.error || 'Failed to unverify client', type: 'error' });
      }
    } catch (err) {
      console.error('Unverify client error:', err);
      showToast({ message: 'Failed to unverify client. See console for details.', type: 'error' });
    } finally {
      setUnverifyLoading(false);
      setShowUnverifyModal(false);
    }
  };

  // Call deactivate endpoint (used by confirm dialog)
  const doDeactivateClient = async () => {
    if (!client || !client.id) return;
    setDeactivateLoading(true);
    try {
      const res = await adminAxios.post(`/admin/clients/${client.id}/deactivate`, { reason: 'Deactivated via admin panel' });
      if (res.data && res.data.success) {
        setClient(prev => ({ ...prev, status: 'Inactive' }));
        showToast({ message: res.data.message || 'Client deactivated', type: 'success' });
      } else {
        console.error('Deactivate failed', res.data);
        showToast({ message: res.data?.error || 'Failed to deactivate client', type: 'error' });
      }
    } catch (err) {
      console.error('Deactivate client error:', err);
      showToast({ message: 'Failed to deactivate client. See console for details.', type: 'error' });
    } finally {
      setDeactivateLoading(false);
      setShowDeactivateModal(false);
    }
  };

  // Call activate endpoint (used by confirm dialog)
  const doActivateClient = async () => {
    if (!client || !client.id) return;
    setActivateLoading(true);
    try {
      const res = await adminAxios.post(`/admin/clients/${client.id}/activate`);
      if (res.data && res.data.success) {
        setClient(prev => ({ ...prev, status: 'Active' }));
        try { window.dispatchEvent(new CustomEvent('profileVerified', { detail: { user_id: client.id } })); } catch (e) { console.debug('dispatch failed', e); }
        showToast({ message: res.data.message || 'Client activated', type: 'success' });
      } else {
        console.error('Activate failed', res.data);
        showToast({ message: res.data?.error || 'Failed to activate client', type: 'error' });
      }
    } catch (err) {
      console.error('Activate client error:', err);
      showToast({ message: 'Failed to activate client. See console for details.', type: 'error' });
    } finally {
      setActivateLoading(false);
      setShowActivateModal(false);
    }
  };

  const startEdit = () => {
    if (!client) return;
    setEditForm({
      username: client.username || '',
      name: client.name || '',
      email: client.email || '',
      contact_number: client.contact_number || '',
      facebook_link: client.facebook_link || '',
      city: client.city || '',
      province: client.province || ''
    });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async (e) => {
    e && e.preventDefault();
    console.log('saveEdit called', editForm);
    if (!client || !client.id) {
      console.warn('No client to save');
      return;
    }
    setEditSaving(true);
    try {
      const payload = {
        username: editForm.username,
        name: editForm.name,
        email: editForm.email,
        contact_number: editForm.contact_number,
        // include facebook_link if backend supports updating profile fields
        facebook_link: editForm.facebook_link,
        // FIX: include city + province
        city: editForm.city,
        province: editForm.province
      };
      console.log('PUT payload', payload);
      const res = await adminAxios.put(`/admin/clients/${client.id}`, payload);
      if (res.data && res.data.success) {
        const updated = res.data.client || {};
        // Format new location immediately
        const newCity = updated.city || editForm.city || client.city;
        const newProvince = updated.province || editForm.province || client.province;
        const formattedLoc = newCity && newProvince ? `${newCity}, ${newProvince}` : (newCity || newProvince || 'N/A');

        setClient(prev => ({
          ...prev,
          username: updated.username || editForm.username || prev.username,
          name: updated.name || editForm.name || prev.name,
          email: updated.email || editForm.email || prev.email,
          contact_number: updated.contact_number || editForm.contact_number || prev.contact_number,
          facebook_link: updated.facebook_link || editForm.facebook_link || prev.facebook_link,
          city: newCity,
          province: newProvince,
          location_formatted: formattedLoc
        }));
        if (onUpdateSuccess) onUpdateSuccess();
        setEditMode(false);
        showToast({ message: 'Client updated successfully', type: 'success' });
      } else {
        console.error('Update failed', res.data);
        showToast({ message: `Update failed: ${res.data?.error || 'Unknown error'}`, type: 'error' });
      }
    } catch (err) {
      console.error('Save edit error:', err);
      showToast({ message: 'Failed to update client. See console for details.', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  // prepare provinces/cities for dropdowns
  const provinces = phLocations ? Object.keys(phLocations) : [];
  const cities = editForm.province && phLocations ? (phLocations[editForm.province] || []) : [];

  if (!clientId) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm font-['Inter'] text-[#333]"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-[900px] h-[550px] bg-[#fdfdf5] rounded-[20px] shadow-2xl flex overflow-hidden border border-[#e0e0e0]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 w-[32px] h-[32px] bg-[#ff6b6b] hover:bg-[#ff5252] rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X size={18} strokeWidth={3} />
        </button>

        {loading ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            <div className="w-10 h-10 border-4 border-[#815fb3] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-['Raleway'] font-bold text-[#815fb3]">Loading Profile...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
             <span className="font-['Raleway'] text-red-500 font-bold">{error}</span>
             <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg font-bold">Close</button>
          </div>
        ) : client && (
          <div className="flex w-full h-full">
            
            {/* LEFT COLUMN: Profile & Actions (Approx 30%) */}
            <div className="w-[280px] bg-white h-full border-r border-[#e0e0e0] flex flex-col items-center py-8 px-6">
              
              {/* Profile Image */}
              <div className="w-[140px] h-[140px] rounded-full overflow-hidden border-[4px] border-[#815fb3] mb-4 shadow-md bg-gray-100 flex items-center justify-center">
                {client.profile_picture ? (
                  <img
                    src={client.profile_picture}
                    alt={client.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      // fall back to SVG placeholder by clearing the profile_picture value
                      setClient(prev => ({ ...prev, profile_picture: null }));
                    }}
                  />
                ) : (
                  <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>

              {/* Status Badge */}
              <div className="mb-3 flex flex-col items-center gap-2">
                <div className={`px-4 py-1 rounded-full font-['Inter'] text-[12px] font-bold ${client.status_color}`}>
                  {client.status.toUpperCase()}
                </div>
                {client.is_verified ? (
                  <div className="px-3 py-1 rounded-full bg-[#e6f9ef] text-[#0b6b3a] text-xs font-semibold flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#0b6b3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Verified Southvalley client
                  </div>
                ) : null}
              </div>

              {/* Action Buttons Stack */}
              <div className="w-full flex flex-col gap-3 mt-auto mb-4">
                 {!client?.is_verified ? (
                   <button onClick={() => setShowVerifyModal(true)} disabled={verifyLoading} className="w-full h-[35px] bg-[#FFB773] hover:opacity-90 text-[#2b1a00] rounded-[8px] font-['Raleway'] font-bold text-[13px] transition-colors disabled:opacity-60" style={{ fontFamily: 'Raleway' }}>
                     {verifyLoading ? 'Working...' : 'Verify Client'}
                   </button>
                 ) : (
                   <button onClick={() => setShowUnverifyModal(true)} disabled={unverifyLoading} className="w-full h-[35px] bg-[#F8D7DA] hover:opacity-90 text-[#6b0f1b] rounded-[8px] font-['Raleway'] font-bold text-[13px] transition-colors disabled:opacity-60" style={{ fontFamily: 'Raleway' }}>
                     {unverifyLoading ? 'Working...' : 'Unverify Client'}
                   </button>
                 )}
                 <button onClick={editMode ? cancelEdit : startEdit} className="w-full h-[35px] bg-[#F0E4B3] hover:opacity-90 text-[#2b260a] rounded-[8px] font-['Raleway'] font-bold text-[13px] transition-colors" style={{ fontFamily: 'Raleway' }}>
                   {editMode ? 'Cancel Edit' : 'Edit Account'}
                 </button>
                 {client.status === 'Inactive' ? (
                   <>
                     <button onClick={() => setShowActivateModal(true)} disabled={activateLoading} className="w-full h-[35px] bg-[#C2F0B3] hover:opacity-90 text-[#24521a] rounded-[8px] font-['Raleway'] font-bold text-[13px] transition-colors disabled:opacity-60" style={{ fontFamily: 'Raleway' }}>
                       {activateLoading ? 'Working...' : 'Activate Account'}
                     </button>
                   </>
                 ) : (
                   <button onClick={() => setShowDeactivateModal(true)} disabled={deactivateLoading} className="w-full h-[35px] bg-[#FF8F8F] hover:opacity-90 text-[#4b0d0d] rounded-[8px] font-['Raleway'] font-bold text-[13px] transition-colors disabled:opacity-60" style={{ fontFamily: 'Raleway' }}>
                     {deactivateLoading ? 'Working...' : 'Deactivate Account'}
                   </button>
                 )}
                 <button className="w-full h-[35px] bg-[#B0D4FC] hover:opacity-90 text-[#08243a] rounded-[8px] font-['Raleway'] font-bold text-[13px] transition-colors" style={{ fontFamily: 'Raleway' }}
                    onClick={() => window.location.href = `mailto:${client.email}`}>
                   Send Email
                 </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Details & Pets (Approx 70%) */}
            <div className="flex-1 h-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
              
              {/* Header: Username (preferred) & ID */}
              <div className="mb-8 border-b border-[#e0e0e0] pb-4">
                <h2 className="font-['Raleway'] font-semibold text-[35px] text-[#1f1f1f] leading-tight">
                  {client.username ? client.username : client.name}
                </h2>
                {client.username && client.username !== client.name && (
                  <p className="text-[#6b6b6b] text-[18px] mt-1 font-medium">{client.name}</p>
                )}
                <p className="text-[#6b6b6b] text-[15px] mt-1">
                  Client ID: <span className="font-mono text-[#815fb3]">PO-{String(client.id).padStart(4, '0')}</span>
                </p>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8">
                
                {/* Contact Info Group */}
                <div className="col-span-2">
                   <h3 className="font-['Raleway'] font-bold text-[20px] text-[#815fb3] mb-3 flex items-center gap-1">
                     <UserIcon size={16}/> Personal Information
                   </h3>
                </div>

                {!editMode ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-xs tracking-wider uppercase text-[#6b6b6b] font-semibold mb-1">Username</span>
                      <div className="flex items-center gap-2 text-sm text-[#111] font-medium">
                        <UserIcon size={14} className="text-[#888]" />
                        {client.username || 'N/A'}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs tracking-wider uppercase text-[#6b6b6b] font-semibold mb-1">Email Address</span>
                      <div className="flex items-center gap-2 text-sm text-[#111] font-medium">
                        <Mail size={14} className="text-[#888]" />
                        {client.email}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs tracking-wider uppercase text-[#6b6b6b] font-semibold mb-1">Phone Number</span>
                      <div className="flex items-center gap-2 text-sm text-[#111] font-medium">
                        <Phone size={14} className="text-[#888]" />
                        {client.contact_number || 'N/A'}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs tracking-wider uppercase text-[#6b6b6b] font-semibold mb-1">City & Province</span>
                      <div className="flex items-center gap-2 text-sm text-[#111] font-medium">
                        <MapPin size={14} className="text-[#888]" />
                        {client.location_formatted}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs tracking-wider uppercase text-[#6b6b6b] font-semibold mb-1">Facebook</span>
                      <div className="flex items-center gap-2 text-sm text-[#111] font-medium">
                        <Facebook size={14} className="text-[#888]" />
                        <a href={client.facebook_link} target="_blank" rel="noreferrer" className="hover:text-[#815fb3] hover:underline truncate max-w-[200px]">
                          {client.facebook_link || 'Not Linked'}
                        </a>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs tracking-wider uppercase text-[#6b6b6b] font-semibold mb-1">Date Joined</span>
                      <div className="flex items-center gap-2 text-sm text-[#111] font-medium">
                        <Calendar size={14} className="text-[#888]" />
                        {new Date(client.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>
                  </>
                ) : (
                  <form onSubmit={saveEdit} className="col-span-2 flex flex-col gap-3">
                    {/* Added Username Input */}
                    <label className="text-sm font-semibold text-[#444]">Username</label>
                    <input name="username" value={editForm.username} onChange={handleEditChange} className="form-input" />

                    <label className="text-sm font-semibold text-[#444]">Full name</label>
                    <input name="name" value={editForm.name} onChange={handleEditChange} className="form-input" />

                    <label className="text-sm font-semibold text-[#444]">Email</label>
                    <input name="email" value={editForm.email} onChange={handleEditChange} className="form-input" />

                    <label className="text-sm font-semibold text-[#444]">Phone</label>
                    <input name="contact_number" value={editForm.contact_number} onChange={handleEditChange} className="form-input" />

                    <label className="text-sm font-semibold text-[#444]">Facebook</label>
                    <input name="facebook_link" value={editForm.facebook_link} onChange={handleEditChange} className="form-input" />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-semibold text-[#444]">Province</label>
                        <CustomDropdown
                          options={provinces}
                          value={editForm.province}
                          onChange={(val) => setEditForm(prev => ({ ...prev, province: val, city: '' }))}
                          placeholder="Select province"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-[#444]">City</label>
                        <CustomDropdown
                          options={cities}
                          value={editForm.city}
                          onChange={(val) => setEditForm(prev => ({ ...prev, city: val }))}
                          placeholder={editForm.province ? 'Select city' : 'Select province first'}
                          disabled={!editForm.province}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button type="submit" disabled={editSaving} className="px-4 py-2 bg-[#815fb3] text-white rounded">{editSaving ? 'Saving...' : 'Save'}</button>
                      <button type="button" onClick={cancelEdit} disabled={editSaving} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                    </div>
                  </form>
                )}
              </div>

              {/* Pets Section */}
              <div className="mt-auto pt-6 border-t border-[#e0e0e0]">
                 <h3 className="font-['Raleway'] font-bold text-[16px] text-[#815fb3] mb-4">
                   Registered Pets ({client.pets.length})
                 </h3>
                 
                 {client.pets.length > 0 ? (
                   <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                     {client.pets.map(pet => (
                       <div key={pet.pet_id} className="flex-shrink-0 flex flex-col items-center gap-2 w-[80px]">
                           <div className="w-[60px] h-[60px] rounded-[10px] overflow-hidden bg-white border border-gray-200 shadow-sm relative flex items-center justify-center">
                             {pet.photo ? (
                               <>
                                 <img
                                   src={pet.photo}
                                   alt={pet.name}
                                   className="w-full h-full object-cover"
                                   onError={(e) => {
                                     // hide broken image and reveal letter fallback
                                     e.target.style.display = 'none';
                                     const fallback = e.target.parentNode.querySelector('.letter-fallback');
                                     if (fallback) fallback.style.display = 'flex';
                                   }}
                                 />
                                 <span className="letter-fallback hidden absolute inset-0 flex items-center justify-center bg-[#f8f9fa] text-[#815FB3] font-extrabold font-raleway text-[20px]">
                                   {pet.name ? pet.name.charAt(0).toUpperCase() : ''}
                                 </span>
                               </>
                             ) : (
                               <span className="letter-fallback flex items-center justify-center absolute inset-0 bg-[#f8f9fa] text-[#815FB3] font-extrabold font-raleway text-[20px]">
                                 {pet.name ? pet.name.charAt(0).toUpperCase() : ''}
                               </span>
                             )}
                           </div>
                         <span className="font-['Inter'] text-[11px] font-bold text-[#555] truncate w-full text-center">
                           {pet.name}
                         </span>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-[#888] font-['Inter'] italic text-sm">
                     No pets registered yet.
                   </div>
                 )}
              </div>

            </div>
          </div>
        )}
        
        {/* Verification Confirmation Modal */}
        {showVerifyModal && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg p-6 w-[420px] shadow-lg">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Raleway' }}>Verify Client</h3>
              <p className="text-sm text-gray-700 mb-4">Are you sure you want to mark this client as a verified Southvalley client? This will notify the user via email.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowVerifyModal(false)} disabled={verifyLoading} className="px-4 py-2 rounded bg-gray-100 font-bold">Cancel</button>
                <button onClick={doVerifyClient} disabled={verifyLoading} className="px-4 py-2 rounded bg-[#FFB773] text-[#2b1a00] font-bold">{verifyLoading ? 'Working...' : 'Confirm Verify'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Unverify Confirmation Modal */}
        {showUnverifyModal && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg p-6 w-[420px] shadow-lg">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Raleway' }}>Unverify Client</h3>
              <p className="text-sm text-gray-700 mb-4">This will remove the Southvalley verification status from the client. Are you sure you want to proceed?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowUnverifyModal(false)} disabled={unverifyLoading} className="px-4 py-2 rounded bg-gray-100 font-bold">Cancel</button>
                <button onClick={doUnverifyClient} disabled={unverifyLoading} className="px-4 py-2 rounded bg-[#F8D7DA] text-[#6b0f1b] font-bold">{unverifyLoading ? 'Working...' : 'Confirm Unverify'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivation Confirmation Modal */}
        {showDeactivateModal && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg p-6 w-[420px] shadow-lg">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Raleway' }}>Deactivate Client</h3>
              <p className="text-sm text-gray-700 mb-4">Deactivating this account will prevent the client from logging in. Are you sure you want to proceed?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeactivateModal(false)} disabled={deactivateLoading} className="px-4 py-2 rounded bg-gray-100 font-bold">Cancel</button>
                <button onClick={doDeactivateClient} disabled={deactivateLoading} className="px-4 py-2 rounded bg-[#FF8F8F] text-[#4b0d0d] font-bold">{deactivateLoading ? 'Working...' : 'Confirm Deactivate'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Activation Confirmation Modal */}
        {showActivateModal && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg p-6 w-[420px] shadow-lg">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Raleway' }}>Activate Client</h3>
              <p className="text-sm text-gray-700 mb-4">Activating this account will allow the client to log in again. Are you sure you want to proceed?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowActivateModal(false)} disabled={activateLoading} className="px-4 py-2 rounded bg-gray-100 font-bold">Cancel</button>
                <button onClick={doActivateClient} disabled={activateLoading} className="px-4 py-2 rounded bg-[#C2F0B3] text-[#24521a] font-bold">{activateLoading ? 'Working...' : 'Confirm Activate'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientDetailsModal;

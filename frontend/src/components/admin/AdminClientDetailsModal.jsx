import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AdminClientDetailsModal = ({ clientId, onClose, adminAxios }) => {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Overlay click handler to close modal only when clicking outside modal content
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
        // Backend returns { success: True, client: { ... } }
        const payload = response.data && response.data.client ? response.data.client : response.data;
        // map backend fields to UI fields with sensible fallbacks
        const mapped = {
          id: payload.id || clientId,
          client_id_str: payload.client_id_str || `PO-06-${String(clientId).padStart(3, '0')}`,
          profile_picture: payload.profile_image || payload.profile_picture || 'https://placehold.co/128x128/E1CFFF/333?text=User',
          name: payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'Unknown Client',
          phone: payload.contact_number || (payload.profile && payload.profile.contact_number) || '',
          facebook_link: (payload.profile && payload.profile.facebook_link) || '',
          address: payload.address || (payload.profile && payload.profile.address) || '',
          city_province: payload.city_province || (payload.profile && ((payload.profile.city ? payload.profile.city : '') + (payload.profile.province ? (', ' + payload.profile.province) : ''))) || '',
          // status comes from backend: 'Active', 'Pending Verification', 'Inactive'
          status_text: payload.status || (payload.is_verified ? 'Active - Verified Client' : (payload.is_active ? 'Active - Pending' : 'Inactive')),
          status_color: (payload.status || '').toLowerCase().includes('active') ? '#79D65A' : (payload.status || '').toLowerCase().includes('pending') ? '#FFD600' : '#E64646',
          date_created: payload.date_joined || payload.date_created || null,
          email: payload.email || '',
          pets: (payload.pets || []).map(p => ({ id: p.pet_id || p.id, name: p.name || '', image_url: p.photo || p.image_url || '' }))
        };

        setClient(mapped);
      } catch (err) {
        setError('Could not load client details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchClientDetails();
  }, [clientId, adminAxios]);

  const ActionButton = ({ text, color, onClick }) => (
    <button
      onClick={onClick}
      style={{
        width: '140px',
        height: '25px',
        borderRadius: '5px',
        background: color,
        fontFamily: 'Raleway',
        fontWeight: 700,
        fontSize: '12px',
        color: '#000',
        marginBottom: '10px',
        display: 'block',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {text}
    </button>
  );

  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    contact_number: '',
    address: '',
    city_province: ''
  });
  const [editSaving, setEditSaving] = useState(false);

  const verifyClient = async () => {
    if (!client || !client.id) return;
    setActionLoading(true);
    try {
      const res = await adminAxios.post(`/admin/clients/${client.id}/verify`);
      if (res.data && res.data.success) {
        // Refresh client status locally
        setClient(prev => ({ ...prev, status_text: 'Active - Verified Client', status_color: '#79D65A' }));
        alert('Client verified successfully.');
      } else {
        alert(res.data?.error || 'Failed to verify client.');
      }
    } catch (err) {
      console.error('Verify client error:', err);
      alert('Failed to verify client.');
    } finally {
      setActionLoading(false);
    }
  };

  const deactivateClient = async () => {
    if (!client || !client.id) return;
    if (!confirm('Are you sure you want to deactivate this client account?')) return;
    setActionLoading(true);
    try {
      const res = await adminAxios.post(`/admin/clients/${client.id}/deactivate`, { reason: 'Deactivated via admin panel' });
      if (res.data && res.data.success) {
        setClient(prev => ({ ...prev, status_text: 'Inactive', status_color: '#E64646' }));
        alert('Client deactivated successfully.');
      } else {
        alert(res.data?.error || 'Failed to deactivate client.');
      }
    } catch (err) {
      console.error('Deactivate client error:', err);
      alert('Failed to deactivate client.');
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = () => {
    if (!client) return;
    setEditForm({
      name: client.name || '',
      email: client.email || '',
      contact_number: client.phone || '',
      address: client.address || '',
      city_province: client.city_province || ''
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
    e.preventDefault();
    if (!client || !client.id) return;
    setEditSaving(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        contact_number: editForm.contact_number,
        address: editForm.address,
        city_province: editForm.city_province
      };
      const res = await adminAxios.put(`/admin/clients/${client.id}`, payload);
      if (res.data && res.data.success) {
        // Update UI with returned client info if provided, else use form
        const updated = res.data.client || {};
        setClient(prev => ({
          ...prev,
          name: updated.name || editForm.name || prev.name,
          email: updated.email || editForm.email || prev.email,
          phone: updated.contact_number || editForm.contact_number || prev.phone,
          address: updated.address || editForm.address || prev.address,
          city_province: updated.city_province || editForm.city_province || prev.city_province
        }));
        setEditMode(false);
        alert('Client updated successfully.');
      } else {
        alert(res.data?.error || 'Failed to update client.');
      }
    } catch (err) {
      console.error('Save edit error:', err);
      alert('Failed to update client.');
    } finally {
      setEditSaving(false);
    }
  };

  // Debug: log when modal is rendered
  useEffect(() => {
    if (clientId) {
      console.log('AdminClientDetailsModal rendered for clientId:', clientId);
    }
  }, [clientId]);

  // Prevent modal from closing immediately on render
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(900px, 96vw)',
          height: 'min(473px, 92vh)',
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'row',
          padding: '0',
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          style={{
            position: 'absolute',
            right: '18px',
            top: '18px',
            background: '#E64646',
            borderRadius: '5px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            zIndex: 2,
          }}
          onClick={onClose}
        >
          <X color="#fff" size={24} />
        </button>
        {/* Modal Content */}
        {loading ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Raleway', fontSize: '20px', color: '#666' }}>Loading Client Details...</span>
          </div>
        ) : error ? (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'Raleway', fontSize: '20px', color: '#E64646' }}>{error}</span>
            <button onClick={onClose} style={{ marginTop: '20px', padding: '8px 24px', borderRadius: '5px', background: '#eee', color: '#333', border: 'none', fontWeight: 700 }}>Close</button>
          </div>
        ) : client && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', padding: '0', boxSizing: 'border-box', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
            {/* Header: centered client id and status */}
            <div style={{ position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 2 }}>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '18px', color: '#000' }}>{client.client_id_str}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px', color: client.status_color, marginTop: '6px' }}>{client.status_text}</div>
            </div>
            {/* Left Column: Profile + Actions */}
            <div style={{ width: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '70px', paddingLeft: '20px', boxSizing: 'border-box', flex: '0 0 200px' }}>
              <img
                src={client.profile_picture}
                alt={client.name}
                style={{ width: '150px', height: '190px', borderRadius: '6px', objectFit: 'cover', marginBottom: '18px' }}
              />
              <ActionButton text={actionLoading ? 'Working...' : 'Verify Client'} color="#FFF4C9" onClick={verifyClient} />
              {!editMode ? (
                <ActionButton text="Edit Account" color="#FCD9B6" onClick={startEdit} />
              ) : (
                <ActionButton text="Cancel Edit" color="#FCD9B6" onClick={cancelEdit} />
              )}
              <ActionButton text={actionLoading ? 'Working...' : 'Deactivate Account'} color="#F9BDBD" onClick={deactivateClient} />
              <ActionButton text="Send Email" color="#DCEBFB" onClick={() => window.location.href = `mailto:${client.email}`} />
            </div>
            {/* Middle Column: Info */}
            <div style={{ flex: 1, minWidth: 0, padding: '70px 24px 24px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!editMode ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '16px', color: '#666' }}>Name</div>
                    <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000' }}>{client.name}</div>
                    <div style={{ height: '8px' }} />
                    <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '16px', color: '#666' }}>Phone Number</div>
                    <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000' }}>{client.phone}</div>
                    <div style={{ height: '8px' }} />
                    <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '16px', color: '#666' }}>Facebook Link</div>
                    <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000' }}>{client.facebook_link}</div>
                  </div>
                </>
              ) : (
                <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 24px' }}>
                  <label style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px' }}>Full name</label>
                  <input name="name" value={editForm.name} onChange={handleEditChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <label style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px' }}>Phone</label>
                  <input name="contact_number" value={editForm.contact_number} onChange={handleEditChange} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <label style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px' }}>Facebook Link</label>
                  <input name="facebook_link" value={editForm.facebook_link || ''} onChange={(e) => setEditForm(prev => ({ ...prev, facebook_link: e.target.value }))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="submit" disabled={editSaving} style={{ padding: '8px 16px', borderRadius: '6px', background: '#79D65A', border: 'none', cursor: 'pointer' }}>{editSaving ? 'Saving...' : 'Save'}</button>
                    <button type="button" onClick={cancelEdit} disabled={editSaving} style={{ padding: '8px 16px', borderRadius: '6px', background: '#eee', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              )}
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '16px', color: '#666', marginTop: '6px' }}>Pets</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', marginTop: '6px', alignItems: 'flex-start' }}>
                {client.pets && client.pets.length > 0 ? client.pets.map(pet => {
                  const firstLetter = (pet.name && pet.name.length > 0) ? pet.name.charAt(0).toUpperCase() : 'P';
                  return (
                    <div key={pet.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '64px' }}>
                      {pet.image_url ? (
                        <img
                          src={pet.image_url}
                          alt={pet.name || 'Pet'}
                          title={pet.name || 'Pet'}
                          style={{ width: '56px', height: '56px', borderRadius: '6px', objectFit: 'cover', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                        />
                      ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                          <span style={{ fontFamily: 'Raleway', fontSize: '20px', fontWeight: 700, color: '#fff' }}>{firstLetter}</span>
                        </div>
                      )}
                      <div style={{ fontFamily: 'Raleway', fontSize: '12px', color: '#333', marginTop: '6px', textAlign: 'center', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pet.name || 'Unnamed'}</div>
                    </div>
                  );
                }) : <span style={{ fontFamily: 'Raleway', fontSize: '16px', color: '#888' }}>No pets registered.</span>}
              </div>
            </div>
            {/* Right Column: Account Details */}
            <div style={{ width: '260px', paddingTop: '70px', paddingLeft: '16px', paddingRight: '20px', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box', flex: '0 0 260px' }}>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px', color: '#666' }}>Date Account Created</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '16px', color: '#000' }}>{client.date_created ? new Date(client.date_created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
              <div style={{ height: '8px' }} />
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px', color: '#666' }}>Email</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '16px', color: '#000' }}>{client.email}</div>
              <div style={{ height: '8px' }} />
              {/* Complete Address removed - not available on user side */}
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '14px', color: '#666' }}>City/Province</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '16px', color: '#000' }}>{client.city_province}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientDetailsModal;

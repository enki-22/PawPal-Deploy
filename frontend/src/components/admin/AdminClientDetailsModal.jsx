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
        const apiData = response.data;
        setClient({
          ...apiData,
          id: apiData.id || clientId,
          client_id_str: apiData.client_id_str || `PO-06-${String(clientId).padStart(3, '0')}`,
          profile_picture: apiData.profile_picture || 'https://placehold.co/128x128/E1CFFF/333?text=User',
          name: apiData.name || 'Mal Beausoleil',
          phone: apiData.profile?.phone || '09123456789',
          facebook_link: apiData.profile?.facebook_link || 'facebook.com/mal-beau',
          address: apiData.profile?.address || 'Blk 1 Lt 32 Tierracon Homes',
          city_province: (apiData.profile?.city && apiData.profile?.province)
            ? `${apiData.profile.city}, ${apiData.profile.province}`
            : 'Santa Rosa City, Laguna',
          status_text: apiData.is_verified ? 'Active - Verified Client' : (apiData.is_active ? 'Active - Pending' : 'Inactive'),
          status_color: apiData.is_verified ? '#79D65A' : (apiData.is_active ? '#FFD600' : '#E64646'),
          pets: apiData.pets || [
            { id: 1, name: 'Cat', image_url: 'https://placehold.co/50x50?text=Cat' },
            { id: 2, name: 'Dog', image_url: 'https://placehold.co/50x50?text=Dog' },
            { id: 3, name: 'Hamster', image_url: 'https://placehold.co/50x50?text=Hamster' },
          ]
        });
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
        width: '150px',
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
          width: '900px',
          height: '473px',
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'row',
          padding: '0',
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
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'row', padding: '0' }}>
            {/* Left Column: Profile + Actions */}
            <div style={{ width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '63px' }}>
              <img
                src={client.profile_picture}
                alt={client.name}
                style={{ width: '160px', height: '201px', borderRadius: '5px', objectFit: 'cover', marginBottom: '20px' }}
              />
              <ActionButton text="Verify Client" color="#FFF4C9" onClick={() => {}} />
              <ActionButton text="Edit Account" color="#FCD9B6" onClick={() => {}} />
              <ActionButton text="Deactivate Account" color="#F9BDBD" onClick={() => {}} />
              <ActionButton text="Send Email" color="#DCEBFB" onClick={() => window.location.href = `mailto:${client.email}`} />
            </div>
            {/* Middle Column: Info */}
            <div style={{ flex: 1, padding: '63px 0 0 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '18px', color: '#000', textAlign: 'center', marginBottom: '10px' }}>{client.client_id_str}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '18px', color: client.status_color, marginBottom: '10px' }}>{client.status_text}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#666', marginBottom: '2px' }}>Name</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000', marginBottom: '10px' }}>{client.name}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#666', marginBottom: '2px' }}>Phone Number</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000', marginBottom: '10px' }}>{client.phone}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#666', marginBottom: '2px' }}>Facebook Link</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000', marginBottom: '10px' }}>{client.facebook_link}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#666', marginBottom: '2px' }}>Pets</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {client.pets && client.pets.length > 0 ? client.pets.map(pet => (
                  <img key={pet.id} src={pet.image_url} alt={pet.name} title={pet.name} style={{ width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover', background: '#fff' }} />
                )) : <span style={{ fontFamily: 'Raleway', fontSize: '16px', color: '#888' }}>No pets registered.</span>}
              </div>
            </div>
            {/* Right Column: Account Details */}
            <div style={{ width: '320px', paddingTop: '63px', paddingLeft: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#666', marginBottom: '2px' }}>Date Account Created</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000', marginBottom: '10px' }}>{client.date_created ? new Date(client.date_created).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#666', marginBottom: '2px' }}>Email</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000', marginBottom: '10px' }}>{client.email}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#666', marginBottom: '2px' }}>Complete Address</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000', marginBottom: '10px' }}>{client.address}</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 700, fontSize: '20px', color: '#666', marginBottom: '2px' }}>City/Province</div>
              <div style={{ fontFamily: 'Raleway', fontWeight: 400, fontSize: '18px', color: '#000', marginBottom: '10px' }}>{client.city_province}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClientDetailsModal;

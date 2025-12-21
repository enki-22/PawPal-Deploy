import React, { useEffect, useState } from 'react';
import AdminTopNav from './AdminTopNav';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import AddAnnouncementModal from './AddAnnouncementModal';
import api from "../../services/api";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load from the shared Landing Page storage
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await api.get('/api/admin/announcements');
        setAnnouncements(response.data.announcements);
      } catch (error) {
        console.error("Error fetching admin announcements:", error);
      }
    };
    fetchAnnouncements();
  }, []);

  // Save to storage whenever announcements change
  const updateStorage = (newData) => {
    setAnnouncements(newData);
    localStorage.setItem('pawpal_promotions', JSON.stringify(newData));
  };

  const handleAddAnnouncement = async (newAnnouncement) => {
    try {
      // This sends the data (including the image file) to the central database
      const response = await api.post('/api/admin/announcements', newAnnouncement);
      if (response.data.success) {
        setAnnouncements([response.data.announcement, ...announcements]);
        setModalOpen(false);
      }
    } catch (error) {
      alert("Error saving announcement: " + error.message);
    }
  };

  const handleEditAnnouncement = (updatedAnnouncement) => {
    const newData = announcements.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a);
    updateStorage(newData);
    setModalOpen(false);
    setEditAnnouncement(null);
  };

  const handleDeleteAnnouncement = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    const newData = announcements.filter(a => a.id !== deleteId);
    updateStorage(newData);
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <AdminTopNav activePage="Announcements" />
      <div className="pt-[110px] pb-12 flex flex-col items-center w-full">
        <div className="w-full max-w-[900px]">
          <div className="flex flex-row items-center justify-between mb-8 w-full">
            <div>
              <h2 className="font-bold text-[32px] text-black">Announcement Management</h2>
              <p className="text-sm text-gray-500 mt-1">These announcements appear on the Landing Page Carousel</p>
            </div>
            <button
              className="bg-[#815FB3] hover:bg-[#6d4fa1] text-white font-semibold px-6 py-3 rounded-xl shadow transition-all flex items-center gap-2"
              onClick={() => { setModalOpen(true); setEditAnnouncement(null); }}
            >
              <span>+ Add Promotion</span>
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {announcements.length > 0 ? (
              announcements.map((card) => (
                <div key={card.id} className="bg-white rounded-[20px] p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex gap-6 items-center">
                    {/* Thumbnail - UPDATED to respect aspect ratio and fit */}
                    <div className="w-[140px] aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                    {card.image ? (
                      <img 
                        src={card.image} 
                        alt={card.title} 
                        className="w-full h-full object-contain" 
                        style={{
                          transform: `scale(${card.style?.zoom || 1})`,
                          objectPosition: `${card.style?.posX ?? 50}% ${card.style?.posY ?? 50}%`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon size={24} />
                      </div>
                    )}
                    </div>
                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-[#181818] mb-1">{card.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{card.description}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pr-4">
                    <button className="p-2 hover:bg-purple-50 rounded-lg text-[#815FB3] transition-colors" title="Edit" onClick={() => { setEditAnnouncement(card); setModalOpen(true); }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                    </button>
                    <button className="p-2 hover:bg-purple-50 rounded-lg text-[#815FB3] transition-colors" title="Delete" onClick={() => handleDeleteAnnouncement(card.id)}>
                        <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400">
                No promotions active. Add one to update the landing page.
              </div>
            )}
          </div>
        </div>
      </div>
      <AddAnnouncementModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditAnnouncement(null); }}
        onAdd={handleAddAnnouncement}
        onEdit={handleEditAnnouncement}
        editData={editAnnouncement}
      />

      {/* Custom Confirm Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[18px] shadow-2xl w-full max-w-[350px] overflow-hidden flex flex-col animate-fade-in-up">
            <div className="p-6 flex flex-col items-center">
              <h3 className="font-bold text-lg text-[#181818] mb-2">Delete Promotion?</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">Are you sure you want to delete this promotion? This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-2 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2 rounded-xl bg-[#815FB3] text-white font-bold shadow-lg hover:bg-[#6d4fa1] transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
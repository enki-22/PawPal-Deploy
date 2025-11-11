import React from 'react';
import AdminTopNav from './AdminTopNav';
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import AddAnnouncementModal from './AddAnnouncementModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import EditAnnouncementModal from './EditAnnouncementModal';
// Inline SVG paths to avoid import error
const svgPaths = {
  p337ed400: "M45 0C69.8528 0 90 20.1472 90 45C90 69.8528 69.8528 90 45 90C20.1472 90 0 69.8528 0 45C0 20.1472 20.1472 0 45 0ZM45 10C25.67 10 10 25.67 10 45C10 64.33 25.67 80 45 80C64.33 80 80 64.33 80 45C80 25.67 64.33 10 45 10Z",
  p42c7280: "M45 0C69.8528 0 90 20.1472 90 45C90 69.8528 69.8528 90 45 90C20.1472 90 0 69.8528 0 45C0 20.1472 20.1472 0 45 0ZM45 10C25.67 10 10 25.67 10 45C10 64.33 25.67 80 45 80C64.33 80 80 64.33 80 45C80 25.67 64.33 10 45 10Z",
  p36599200: "M40 0C62.0914 0 80 17.9086 80 40C80 62.0914 62.0914 80 40 80C17.9086 80 0 62.0914 0 40C0 17.9086 17.9086 0 40 0ZM40 8C22.327 8 8 22.327 8 40C8 57.673 22.327 72 40 72C57.673 72 72 57.673 72 40C72 22.327 57.673 8 40 8Z",
  p31c3c2f0: "M12.5 0C19.4036 0 25 5.59644 25 12.5C25 19.4036 19.4036 25 12.5 25C5.59644 25 0 19.4036 0 12.5C0 5.59644 5.59644 0 12.5 0ZM12.5 2.08333C6.69792 2.08333 2.08333 6.69792 2.08333 12.5C2.08333 18.3021 6.69792 22.9167 12.5 22.9167C18.3021 22.9167 22.9167 18.3021 22.9167 12.5C22.9167 6.69792 18.3021 2.08333 12.5 2.08333Z",
  p3eb8a280: "M2 2L21 21M21 2L2 21",
  paa21800: "M10.5 0C16.299 0 21 4.70101 21 10.5C21 16.299 16.299 21 10.5 21C4.70101 21 0 16.299 0 10.5C0 4.70101 4.70101 0 10.5 0ZM10.5 2.08333C5.69792 2.08333 2.08333 5.69792 2.08333 10.5C2.08333 15.3021 5.69792 18.9167 10.5 18.9167C15.3021 18.9167 18.9167 15.3021 18.9167 10.5C18.9167 5.69792 15.3021 2.08333 10.5 2.08333Z"
};

function renderIcon(iconType) {
  switch (iconType) {
    case 'syringe':
      return (
        <div className="w-[50px] h-[50px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90 90">
            <path clipRule="evenodd" d={svgPaths.p337ed400} fill="var(--fill-0, #57166B)" fillRule="evenodd" />
          </svg>
        </div>
      );
    case 'checkup':
      return (
        <div className="w-[50px] h-[50px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 90 90">
            <path clipRule="evenodd" d={svgPaths.p42c7280} fill="var(--fill-0, #57166B)" fillRule="evenodd" />
          </svg>
        </div>
      );
    case 'paw':
      return (
        <div className="w-[50px] h-[50px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 80 80">
            <g clipPath="url(#clip0_1_97)">
              <path d={svgPaths.p36599200} fill="var(--fill-0, #57166B)" />
            </g>
            <defs>
              <clipPath id="clip0_1_97">
                <rect fill="white" height="80" width="80" />
              </clipPath>
            </defs>
          </svg>
        </div>
      );
    default:
      return null;
  }
}


// This would be fetched from backend in a real app

import { useEffect } from 'react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState(() => {
    const stored = localStorage.getItem('admin_announcements');
    return stored ? JSON.parse(stored) : [];
  });
  // Persist announcements to localStorage on change
  useEffect(() => {
    localStorage.setItem('admin_announcements', JSON.stringify(announcements));
  }, [announcements]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState(null);

  const handleAddAnnouncement = (newAnnouncement) => {
    setAnnouncements(prev => [
      {
        ...newAnnouncement,
        id: Date.now(),
        icon: 'paw', // Default icon, or you can add icon selection to modal
        validUntil: newAnnouncement.validity ? new Date(newAnnouncement.validity).toLocaleDateString() : 'Ongoing',
      },
      ...prev,
    ]);
  };

  const handleEditAnnouncement = (updatedAnnouncement) => {
    setAnnouncements(prev => prev.map(a =>
      a.id === updatedAnnouncement.id
        ? {
            ...a,
            title: updatedAnnouncement.title,
            validUntil: updatedAnnouncement.validity ? new Date(updatedAnnouncement.validity).toLocaleDateString() : 'Ongoing',
            description: updatedAnnouncement.description,
          }
        : a
    ));
    setEditModalOpen(false);
    setAnnouncementToEdit(null);
  };

  const handleDeleteAnnouncement = (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    setDeleteModalOpen(false);
    setAnnouncementToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      <AdminTopNav activePage="Announcements" />
      {/* Main Content */}
      <div className="pt-[110px] pb-12 flex flex-col items-center w-full">
        <div className="w-full max-w-[900px]">
          <div className="flex flex-row items-center justify-between mb-4 w-full" style={{alignItems: 'center'}}>
            <h2
              className="font-['Raleway',sans-serif] font-bold"
              style={{
                fontFamily: 'Raleway',
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '32px',
                lineHeight: '38px',
                letterSpacing: '0.05em',
                color: '#000000',
                whiteSpace: 'nowrap',
              }}
            >
              Announcement Management
            </h2>
            <button
              className="bg-[#bba0e4] hover:bg-[#a88ad2] text-black font-['Inter:Semi_Bold',sans-serif] font-semibold px-[12.4px] py-[4.14px] rounded-[10.33px] shadow flex items-center justify-center"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setModalOpen(true)}
            >
              <span className="text-[14.4585px] w-full text-center">+ New Announcement</span>
            </button>
          </div>
          <div className="flex flex-col gap-[21px]">
            {announcements.length > 0 ? (
              announcements.map((card) => (
                <div key={card.id} className="bg-[#f7f5fc] rounded-[33.75px] border border-[#d1c4e9] shadow px-[18px] py-[16px] flex flex-col md:flex-row justify-center relative w-full" style={{ minHeight: '180px' }}>
                  <div className="mb-6 md:mb-0 md:mr-12 flex-shrink-0 flex items-center justify-center" style={{ minWidth: 105 }}>
                    {renderIcon(card.icon)}
                  </div>
                  <div className="flex-1 w-full flex flex-col justify-center">
                    <h3 className="font-['Raleway:Bold',sans-serif] font-bold text-[21.56px] text-black mb-1.5 tracking-[2.1px]">{card.title}</h3>
                    <p className="font-['Raleway:Light',sans-serif] text-[11.64px] text-[#57166B] mb-3 tracking-[1.125px]">Valid until: {card.validUntil}</p>
                    <p className="font-['Raleway:Light',sans-serif] text-[13.8px] text-black tracking-[1.5px]">{card.description}</p>
                  </div>
                  <div className="absolute right-6 top-6 flex gap-2">
                    <button
                      className="p-1 rounded-[2px] hover:bg-[#f3f0fa] border border-[#bba0e4]"
                      title="Edit"
                      onClick={() => {
                        setAnnouncementToEdit(card);
                        setEditModalOpen(true);
                      }}
                    >
                      <Pencil className="w-2.25 h-2.25 text-[#57166B]" />
                    </button>
                    <button
                      className="p-1 rounded-[2px] hover:bg-[#f3f0fa] border border-[#bba0e4]"
                      title="Delete"
                      onClick={() => {
                        setAnnouncementToDelete(card.id);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="w-1.875 h-1.875 text-[#57166B]" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center" style={{ minHeight: '220px' }}>
                <span className="text-gray-500 text-2xl font-semibold">No announcement yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <AddAnnouncementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddAnnouncement}
      />
      <EditAnnouncementModal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setAnnouncementToEdit(null); }}
        onSave={handleEditAnnouncement}
        announcement={announcementToEdit}
      />
      <ConfirmDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setAnnouncementToDelete(null); }}
        onConfirm={() => handleDeleteAnnouncement(announcementToDelete)}
      />
    </div>
  );
}
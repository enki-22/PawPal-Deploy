import React from 'react';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-[16px] shadow-lg w-[350px] p-8 relative">
        <h2 className="text-[20px] font-bold text-[#57166B] mb-4 text-center">Delete Announcement</h2>
        <p className="text-center text-gray-700 mb-8">Are you sure you want to delete this announcement?</p>
        <div className="flex justify-end gap-3">
          <button
            className="px-5 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2 rounded bg-[#d32f2f] text-white font-bold hover:bg-[#b71c1c]"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

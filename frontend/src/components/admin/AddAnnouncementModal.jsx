import React, { useState, useEffect } from 'react';

function getToday() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export default function AddAnnouncementModal({ isOpen, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [validity, setValidity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset fields when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setValidity('');
      setDescription('');
    }
  }, [isOpen]);

  const handleAdd = async () => {
    setLoading(true);
    await onAdd({ title, validity, description });
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-[16px] shadow-lg w-[400px] p-8 relative">
        <h2 className="text-[22px] font-bold text-[#57166B] mb-6 text-center">Add Announcement</h2>
        <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold" onClick={onClose}>&times;</button>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Title</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#57166B]"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter announcement title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Valid Until</label>
            <input
              type="date"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#57166B]"
              value={validity}
              min={getToday()}
              onChange={e => setValidity(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#57166B]"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Enter announcement details"
            />
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <button
            className="bg-[#815FB3] text-white font-bold px-6 py-2 rounded hover:bg-[#6d4fa1] transition-colors"
            onClick={handleAdd}
            disabled={loading || !title || !description}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

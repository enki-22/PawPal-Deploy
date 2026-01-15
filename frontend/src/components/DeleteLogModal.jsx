import React from 'react';

const DeleteLogModal = ({ isOpen, onClose, onConfirm, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-[90%] p-6 relative animate-scale-in" style={{ fontFamily: 'Raleway' }}>
        <h2 className="text-xl font-bold text-[#34113F] mb-4">Delete Symptom Log?</h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this symptom record? This action cannot be undone and will remove the AI analysis associated with this entry.
        </p>
        
        <div className="flex flex-col md:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 rounded-lg font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-semibold text-white transition-colors ${
              loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? 'Deleting...' : 'Delete Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteLogModal;

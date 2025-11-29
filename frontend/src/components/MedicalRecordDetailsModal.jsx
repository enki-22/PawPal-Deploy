import React, { useState, useEffect } from 'react';

const MedicalRecordDetailsModal = ({ isOpen, onClose, record, onDelete, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableRecord, setEditableRecord] = useState(record);
  const [error, setError] = useState('');

  useEffect(() => {
    setEditableRecord(record);
    setError('');
  }, [record, isOpen]);

  if (!isOpen || !record) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableRecord(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on change
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableRecord(record);
    setError('');
  };

  const handleSave = () => {
    // Validation
    if (editableRecord.date && editableRecord.followUpDate) {
      if (new Date(editableRecord.followUpDate) < new Date(editableRecord.date)) {
        setError('Follow-up date cannot be earlier than the date of service.');
        return;
      }
    }

    onSave(editableRecord);
    setIsEditing(false);
  };

  // Fields now have fixed, matching heights for both view and edit modes
  const renderField = (label, name, value, isTextArea = false) => {
    const baseClasses = "w-full border rounded px-3 py-2";
    if (isEditing) {
      const editClasses = `${baseClasses} border-gray-300`;
      if (name === 'serviceType') {
        return (
          <select
            name="serviceType"
            id="serviceType"
            value={value || 'Check-up'}
            onChange={handleChange}
            className={`${editClasses} h-11`}
          >
            <option>Check-up</option>
            <option>Vaccination</option>
            <option>Surgery</option>
            <option>Emergency</option>
            <option>Other</option>
          </select>
        );
      }
      if (name === 'date' || name === 'followUpDate') {
        return (
          <input
            type="date"
            name={name}
            id={name}
            value={value || ''}
            onChange={handleChange}
            // Add min date constraint to followUpDate input
            min={name === 'followUpDate' ? editableRecord.date : undefined}
            className={`${editClasses} h-11`}
          />
        );
      }
      return isTextArea ? (
        <textarea
          name={name} id={name} value={value || ''} onChange={handleChange}
          className={`${editClasses} h-24`}
        />
      ) : (
        <input
          type="text" name={name} id={name} value={value || ''} onChange={handleChange}
          className={`${editClasses} h-11`}
        />
      );
    }
    // VIEWING MODE
    const viewClasses = `${baseClasses} bg-gray-50 border-gray-200`;
    return isTextArea ? (
      <div className={`${viewClasses} h-24 overflow-y-auto`}>
        {value || ''}
      </div>
    ) : (
      <div className={`${viewClasses} h-11 flex items-center`}>
        {value || ''}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      {/* Main modal container: flex flex-col, fixed height, matches AddMedicalRecordModal */}
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-8 relative flex flex-col h-[650px]" style={{ fontFamily: 'Raleway' }}>
        {/* Header - flex-shrink-0 */}
        <div className="flex-shrink-0 flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Medical Record' : 'Medical Record Details'}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700" aria-label="Close">×</button>
        </div>
        {/* Form: flex-grow, overflow-y-auto, pr-4 for scrollbar */}
        <form onSubmit={e => e.preventDefault()} className="flex-grow overflow-y-auto pr-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="serviceType" className="block text-sm mb-1">Service Type</label>
              {renderField('Service Type', 'serviceType', editableRecord.serviceType)}
            </div>
            <div>
              <label htmlFor="provider" className="block text-sm mb-1">Provider</label>
              {renderField('Provider', 'provider', editableRecord.provider)}
            </div>
            <div>
              <label htmlFor="date" className="block text-sm mb-1">Date</label>
              {renderField('Date', 'date', editableRecord.date)}
            </div>
            <div>
              <label htmlFor="followUpDate" className="block text-sm mb-1">Follow-up Date (Optional)</label>
              {renderField('Follow-up Date', 'followUpDate', editableRecord.followUpDate)}
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="diagnosis" className="block text-sm mb-1">Diagnosis/Reason</label>
            {renderField('Diagnosis/Reason', 'diagnosis', editableRecord.diagnosis, true)}
          </div>
          <div className="mb-4">
            <label htmlFor="treatment" className="block text-sm mb-1">Treatment/Action</label>
            {renderField('Treatment/Action', 'treatment', editableRecord.treatment, true)}
          </div>
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm mb-1">Notes (Optional)</label>
            {renderField('Notes', 'notes', editableRecord.notes, true)}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
              {error}
            </div>
          )}
        </form>
        {/* Footer: flex-shrink-0, pt-6 for spacing above buttons */}
        <div className="flex-shrink-0 flex justify-end items-center gap-4 pt-6">
          {isEditing ? (
            <>
              <button type="button" onClick={handleCancel} className="bg-gray-300 text-gray-800 px-6 py-2 rounded font-semibold hover:bg-gray-400">Cancel</button>
              <button type="button" onClick={handleSave} className="bg-[#815FB3] text-white px-6 py-2 rounded font-semibold hover:bg-[#6d4ca1]">Save Changes</button>
            </>
          ) : (
            <>
              <button type="button" onClick={onDelete} className="bg-red-500 text-white px-6 py-2 rounded font-semibold hover:bg-red-600">Delete</button>
              <button type="button" onClick={handleEdit} className="bg-[#815FB3] text-white px-6 py-2 rounded font-semibold hover:bg-[#6d4ca1]">Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordDetailsModal;
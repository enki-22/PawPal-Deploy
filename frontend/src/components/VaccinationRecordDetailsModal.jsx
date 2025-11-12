import React, { useState, useEffect } from 'react';

const VaccinationRecordDetailsModal = ({ isOpen, onClose, record, onDelete, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableRecord, setEditableRecord] = useState(record);

  useEffect(() => {
    setEditableRecord(record);
  }, [record]);

  if (!isOpen || !record) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableRecord(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableRecord(record);
  };

  const handleSave = () => {
    onSave(editableRecord);
    setIsEditing(false);
  };

  const renderField = (label, name, value, isTextArea = false) => {
    const commonProps = {
      name: name,
      id: name,
      value: value || '',
      onChange: handleChange,
      className: "w-full border rounded px-3 py-2 border-gray-300",
    };
    if (isEditing) {
      if (name === 'vaccineType') {
        return (
          <select {...commonProps}>
            <option>Rabies</option>
            <option>Distemper</option>
            <option>Parvovirus</option>
            <option>Adenovirus</option>
            <option>Parainfluenza</option>
            <option>Leptospirosis</option>
            <option>Bordetella</option>
            <option>Lyme Disease</option>
            <option>Canine Influenza</option>
            <option>Feline Leukemia</option>
            <option>FVRCP</option>
            <option>Panleukopenia</option>
            <option>Calicivirus</option>
            <option>Other</option>
          </select>
        );
      }
      if (name === 'dateAdministered' || name === 'nextDueDate') {
        return (
          <input type="date" {...commonProps} />
        );
      }
      return isTextArea ? (
        <textarea {...commonProps} rows={3} />
      ) : (
        <input type="text" {...commonProps} />
      );
    }
    return <div className="w-full border rounded px-3 py-2 bg-gray-50 min-h-[42px]">{value || ''}</div>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-8 relative" style={{ fontFamily: 'Raleway' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Vaccination Record' : 'Vaccination Record Details'}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700" aria-label="Close">×</button>
        </div>
        <form onSubmit={e => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="vaccineType" className="block text-sm mb-1">Vaccine Type</label>
              {renderField('Vaccine Type', 'vaccineType', editableRecord.vaccineType)}
            </div>
            <div>
              <label htmlFor="administeredBy" className="block text-sm mb-1">Administered By</label>
              {renderField('Administered By', 'administeredBy', editableRecord.administeredBy)}
            </div>
            <div>
              <label htmlFor="dateAdministered" className="block text-sm mb-1">Date Administered</label>
              {renderField('Date Administered', 'dateAdministered', editableRecord.dateAdministered)}
            </div>
            <div>
              <label htmlFor="nextDueDate" className="block text-sm mb-1">Next Due Date (Optional)</label>
              {renderField('Next Due Date', 'nextDueDate', editableRecord.nextDueDate)}
            </div>
          </div>
          <div className="flex justify-end items-center gap-4">
            {isEditing ? (
              <>
                <button type="button" onClick={handleCancel} className="bg-gray-300 text-gray-800 px-6 py-2 rounded font-semibold hover:bg-gray-400">Cancel</button>
                <button type="button" onClick={handleSave} className="bg-green-500 text-white px-6 py-2 rounded font-semibold hover:bg-green-600">Save Changes</button>
              </>
            ) : (
              <>
                <button type="button" onClick={onDelete} className="bg-red-500 text-white px-6 py-2 rounded font-semibold hover:bg-red-600">Delete</button>
                <button type="button" onClick={handleEdit} className="bg-[#815FB3] text-white px-6 py-2 rounded font-semibold hover:bg-[#6d4ca1]">Edit</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaccinationRecordDetailsModal;

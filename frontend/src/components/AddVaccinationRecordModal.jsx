import React, { useState } from 'react';

const AddVaccinationRecordModal = ({ isOpen, onClose, onSave }) => {
  const [vaccineType, setVaccineType] = useState('Rabies');
  const [administeredBy, setAdministeredBy] = useState('');
  const [dateAdministered, setDateAdministered] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave && onSave({ vaccineType, administeredBy, dateAdministered, nextDueDate });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-8 relative" style={{ fontFamily: 'Raleway' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add Vaccination Record</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700" aria-label="Close">×</button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Vaccine Type</label>
              <select value={vaccineType} onChange={e => setVaccineType(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring">
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
            </div>
            <div>
              <label className="block text-sm mb-1">Administered By</label>
              <input type="text" value={administeredBy} onChange={e => setAdministeredBy(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" placeholder="Provider" />
            </div>
            <div>
              <label className="block text-sm mb-1">Date Administered</label>
              <input type="date" value={dateAdministered} onChange={e => setDateAdministered(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" />
            </div>
            <div>
              <label className="block text-sm mb-1">Next Due Date (Optional)</label>
              <input type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" />
            </div>
          </div>
          {/* Footer */}
          <div className="flex justify-end items-center gap-4 mt-6">
            <button type="button" onClick={onClose} className="text-gray-500 px-4 py-2 rounded hover:text-gray-700">Cancel</button>
            <button type="submit" className="bg-[#815FB3] text-white px-6 py-2 rounded font-semibold hover:bg-[#6d4ca1]">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVaccinationRecordModal;

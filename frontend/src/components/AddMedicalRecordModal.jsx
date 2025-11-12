import React, { useState, useEffect } from 'react';

const AddMedicalRecordModal = ({ isOpen, onClose, onSave }) => {
  const [serviceType, setServiceType] = useState('Check-up');
  const [provider, setProvider] = useState('');
  const [date, setDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form fields when modal is opened
  useEffect(() => {
    if (isOpen) {
      setServiceType('Check-up');
      setProvider('');
      setDate('');
      setFollowUpDate('');
      setDiagnosis('');
      setTreatment('');
      setNotes('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave && onSave({ serviceType, provider, date, followUpDate, diagnosis, treatment, notes });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-8 relative" style={{ fontFamily: 'Raleway' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add New Medical Record</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700" aria-label="Close">×</button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Service Type</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring">
                <option>Check-up</option>
                <option>Vaccination</option>
                <option>Surgery</option>
                <option>Emergency</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Provider</label>
              <input type="text" value={provider} onChange={e => setProvider(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" placeholder="Provider" />
            </div>
            <div>
              <label className="block text-sm mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" />
            </div>
            <div>
              <label className="block text-sm mb-1">Follow-up Date (Optional)</label>
              <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Diagnosis/Reason</label>
            <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" rows={2} />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-1">Treatment/Action</label>
            <textarea value={treatment} onChange={e => setTreatment(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" rows={2} />
          </div>
          <div className="mb-6">
            <label className="block text-sm mb-1">Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" rows={2} />
          </div>
          {/* Footer */}
          <div className="flex justify-end items-center gap-4">
            <button type="button" onClick={onClose} className="text-gray-500 px-4 py-2 rounded hover:text-gray-700">Cancel</button>
            <button type="submit" className="bg-[#815FB3] text-white px-6 py-2 rounded font-semibold hover:bg-[#6d4ca1]">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicalRecordModal;

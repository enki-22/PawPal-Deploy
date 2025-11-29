import React, { useState, useEffect } from 'react';

const AddMedicalRecordModal = ({ isOpen, onClose, onSave }) => {
  const [serviceType, setServiceType] = useState('Check-up');
  const [provider, setProvider] = useState('');
  const [date, setDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

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
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Date Validation
    if (date && followUpDate) {
      if (new Date(followUpDate) < new Date(date)) {
        setError('Follow-up date cannot be earlier than the service date.');
        return;
      }
    }

    onSave && onSave({ serviceType, provider, date, followUpDate, diagnosis, treatment, notes });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-3 md:p-8 relative max-h-[80vh] md:max-h-none flex flex-col overflow-hidden" style={{ fontFamily: 'Raleway' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Add New Medical Record</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700" aria-label="Close">×</button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0" aria-label="Add medical record form">
          {/* Added pl-1 to prevent the focus ring from being clipped on the left */}
          <div className="overflow-y-auto pl-1 pr-2 pb-15 md:pb-4 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} min={date} className="w-full border rounded px-3 py-2 focus:outline-none focus:ring" />
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
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
                {error}
              </div>
            )}
          </div>
          {/* Footer (kept outside scroll area so always visible) */}
          <div className="sticky md:static bottom-0 bg-white md:bg-transparent w-full md:w-auto border-t md:border-t-0 border-gray-100 flex flex-col md:flex-row md:justify-end items-center gap-4 mt-4 py-3 shrink-0">
            <button type="button" onClick={onClose} className="w-full md:w-auto text-gray-500 px-4 py-2 rounded hover:text-gray-700">Cancel</button>
            <button type="submit" className="w-full md:w-auto bg-[#815FB3] text-white px-6 py-2 rounded font-semibold hover:bg-[#6d4ca1]">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicalRecordModal;

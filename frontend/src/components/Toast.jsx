import React, { useEffect, useState } from 'react';

const TYPE_STYLES = {
  success: {
    bg: 'bg-white',
    border: 'border-l-4 border-green-400',
  },
  error: {
    bg: 'bg-white',
    border: 'border-l-4 border-red-400',
  },
  info: {
    bg: 'bg-white',
    border: 'border-l-4 border-blue-300',
  },
  warning: {
    bg: 'bg-white',
    border: 'border-l-4 border-yellow-300',
  }
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      const id = Date.now() + Math.random();
      const toast = {
        id,
        message: detail.message || '',
        type: detail.type || 'success',
        duration: typeof detail.duration === 'number' ? detail.duration : 4000
      };
      setToasts((t) => [toast, ...t]);
      if (toast.duration > 0) {
        setTimeout(() => removeToast(id), toast.duration);
      }
    };
    window.addEventListener('showToast', handler);
    return () => window.removeEventListener('showToast', handler);
  }, []);

  const removeToast = (id) => {
    setToasts((t) => t.filter(x => x.id !== id));
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[99999] flex flex-col items-center gap-3 pointer-events-none">
      {toasts.map((t) => {
        const style = TYPE_STYLES[t.type] || TYPE_STYLES.success;
        return (
          <div key={t.id} className={`pointer-events-auto max-w-xl w-full ${style.bg} ${style.border} rounded-lg shadow-lg flex items-center justify-between px-4 py-3`}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f3f7f6] text-green-600">
                {t.type === 'success' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : t.type === 'error' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                ) : (
                  <span className="w-3 h-3" />
                )}
              </div>
              <div className="text-sm text-[#1f2937] font-medium">
                {t.message}
              </div>
            </div>
            <button onClick={() => removeToast(t.id)} className="ml-4 text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;

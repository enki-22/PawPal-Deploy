import React from "react";

// Placeholder image for logo
const placeholderImg = "https://via.placeholder.com/80x80?text=Logo";

function Group() {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <div className="flex items-center justify-center">
        <p className="font-['MuseoModerno:Black',sans-serif] font-black text-[#815fb3] text-[48px] leading-[normal]">PAWPAL</p>
      </div>
      <div className="w-[80px] h-[80px]">
        <img alt="Logo" className="w-full h-full object-cover" src={placeholderImg} />
      </div>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    <div className="relative p-8 bg-[#fffff2] rounded-[30px] shadow-[0px_0px_100px_10px_rgba(0,0,0,0.25)] max-w-[900px] w-[90vw] max-h-[85vh] overflow-y-auto">
      <Group />
      <p className="font-['Raleway:Bold',sans-serif] font-bold text-[#815fb3] text-center mb-2 text-[22px]">Your pet&apos;s health companion</p>
      <div className="font-['Raleway:Bold',sans-serif] font-bold text-[36px] text-black text-center mb-4">
        📜 Privacy Policy
      </div>
      <p className="font-['Raleway:Light',sans-serif] font-light text-center text-black mb-8 text-[18px]">Last Updated: November 2025</p>
      <div className="space-y-8">
        <div className="font-['Raleway:Bold',sans-serif] font-bold text-black">
          <p className="mb-3 text-[28px]">1. Data We Collect</p>
          <ul className="list-disc ps-8 space-y-2">
            <li className="font-['Raleway:Medium',sans-serif] font-medium text-[22px]">Personal info (name, email, contact)</li>
            <li className="font-['Raleway:Medium',sans-serif] font-medium text-[22px]">Pet details (name, species, age, health data)</li>
            <li className="font-['Raleway:Medium',sans-serif] font-medium text-[22px]">Chat history for system improvement</li>
          </ul>
        </div>
        <div className="font-['Raleway:Bold',sans-serif] font-bold text-black">
          <p className="mb-3 text-[28px]">2. Use of Information</p>
          <p className="font-['Raleway:Medium',sans-serif] font-medium text-[22px]">Your data is used to provide chatbot responses, manage appointments, and improve service quality.</p>
        </div>
        <div className="font-['Raleway:Bold',sans-serif] font-bold text-black">
          <p className="mb-3 text-[28px]">3. Data Security</p>
          <p className="font-['Raleway:Medium',sans-serif] font-medium text-[22px]">All information is securely stored and accessible only to authorized personnel.</p>
        </div>
        <div className="font-['Raleway:Bold',sans-serif] font-bold text-black">
          <p className="mb-3 text-[28px]">4. User Rights</p>
          <p className="font-['Raleway:Medium',sans-serif] font-medium text-[22px]">You can request access, correction, or deletion of your data anytime by emailing <span className="underline">southvalleyvc20@gmail.com</span></p>
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPolicy({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative">
        <PrivacyPolicyContent />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#815fb3] text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold shadow-lg hover:bg-[#642A77]"
          aria-label="Close Privacy Policy"
        >
          ×
        </button>
      </div>
    </div>
  );
}

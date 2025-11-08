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

function RegisterFormPage() {
  return (
    <div className="relative p-8 bg-[#fffff2] rounded-[30px] shadow-[0px_0px_100px_10px_rgba(0,0,0,0.25)] max-w-[900px] w-[90vw] max-h-[85vh] overflow-y-auto">
      <Group />
      <p className="font-['Raleway:Bold',sans-serif] font-bold text-[#815fb3] text-center mb-2 text-[22px]">Your pet&apos;s health companion</p>
      <div className="font-['Raleway:Bold',sans-serif] font-bold text-[36px] text-black text-center mb-4">
        📜 Terms of Service
      </div>
      <p className="font-['Raleway:Light',sans-serif] font-light text-center text-black mb-8 text-[18px]">Last Updated: November 2025</p>
      <div className="space-y-8">
        <div className="font-['Raleway:Medium',sans-serif] font-medium text-black">
          <p className="font-['Raleway:Bold',sans-serif] font-bold mb-3 text-[28px]">1. Acceptance of Terms</p>
          <p className="text-[22px]">By using PawPal, you agree to comply with these Terms of Service.</p>
        </div>
        <div className="font-['Raleway:Medium',sans-serif] font-medium text-black">
          <p className="font-['Raleway:Bold',sans-serif] font-bold mb-3 text-[28px]">2. Description of Service</p>
          <p className="text-[22px]">PawPal provides general pet health information and helps users schedule appointments. It does not replace professional veterinary consultation.</p>
        </div>
        <div className="font-['Raleway:Medium',sans-serif] font-medium text-black">
          <p className="font-['Raleway:Bold',sans-serif] font-bold mb-3 text-[28px]">3. User Responsibilities</p>
          <ul className="list-disc ps-8 space-y-2">
            <li className="text-[22px]">Use PawPal for lawful purposes only.</li>
            <li className="text-[22px]">Provide accurate information about yourself and your pet.</li>
            <li className="text-[22px]">Avoid attempting to disrupt or misuse the system.</li>
          </ul>
        </div>
        <div className="font-['Raleway:Medium',sans-serif] font-medium text-black">
          <p className="font-['Raleway:Bold',sans-serif] font-bold mb-3 text-[28px]">4. Account Registration</p>
          <p className="text-[22px]">You may create an account to save pet records or chat history. Keep your login details private.</p>
        </div>
        <div className="font-['Raleway:Medium',sans-serif] font-medium text-black">
          <p className="font-['Raleway:Bold',sans-serif] font-bold mb-3 text-[28px]">5. Disclaimer</p>
          <p className="text-[22px]">PawPal responses are AI-generated and may not always be accurate. Consult a licensed veterinarian for serious health concerns.</p>
        </div>
        <div className="font-['Raleway:Medium',sans-serif] font-medium text-black">
          <p className="font-['Raleway:Bold',sans-serif] font-bold mb-3 text-[28px]">6. Contact</p>
          <p className="text-[22px]">
            For inquiries: <span className="underline">southvalleyvc20@gmail.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TermsOfService({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="relative">
        <RegisterFormPage />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#815fb3] text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold shadow-lg hover:bg-[#642A77]"
          aria-label="Close Terms of Service"
        >
          ×
        </button>
      </div>
    </div>
  );
}

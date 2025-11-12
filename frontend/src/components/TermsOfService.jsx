import React from "react";

// NOTE: This path assumes "pat-removebg-preview 2.png" is in your "public" folder.
const logoSrc = "/pat-removebg-preview 2.png";

function Group() {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <div className="w-16 h-16">
        <img alt="Logo" className="w-full h-full object-cover" src={logoSrc} />
      </div>
      <div className="flex items-center justify-center">
        <p className="font-['MuseoModerno:Black',sans-serif] font-black text-[#815fb3]" style={{ fontSize: '65px', lineHeight: 'normal' }}>PAWPAL</p>
      </div>
    </div>
  );
}

function RegisterFormPage() {
  return (
    <div className="relative p-8 bg-[#FFFFF2] rounded-[30px] shadow-[0px_0px_100px_10px_rgba(0,0,0,0.25)] max-w-4xl w-full max-h-[85vh] overflow-y-auto font-raleway">
      <Group />
      <div className="font-bold text-3xl text-black text-center mb-4">
        Terms of Service
      </div>
      <p className="font-normal text-left text-black mb-6 text-sm">
        Last Updated: November 2026
      </p>
      
      {/* Transcribed Content from Image */}
      <div className="space-y-6 text-black">
        <p className="text-base font-normal leading-relaxed">
          Welcome to PawPal, your friendly pet healthcare assistant developed for Southvalley Veterinary Clinic. By using PawPal, you agree to the following terms and conditions. Please read them carefully before using our service.
        </p>

        <div>
          <p className="text-xl font-bold mb-2">1. Acceptance of Terms</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            By accessing or using PawPal, you acknowledge that you have read and understood these Terms of Service and agree to use the platform in accordance with them.
          </p>
          <p className="text-base font-normal leading-relaxed mb-3">
            If you have any concerns or do not fully agree with certain parts, we encourage you to contact Southvalley Veterinary Clinic for clarification before continuing to use the service.
          </p>
          <p className="text-base font-normal leading-relaxed">
            By proceeding, you also understand that PawPal is designed to provide general pet healthcare information and assistance on behalf of the clinic.
          </p>
        </div>

        <div>
          <p className="text-xl font-bold mb-2">2. About PawPal</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            PawPal is a web-based chatbot created by Southvalley Veterinary Clinic to help pet owners with general pet information and appointment requests.
          </p>
          <p className="text-base font-normal leading-relaxed">
            It uses AI to answer common questions about your pet&apos;s health and the clinic&apos;s services. Please remember that PawPal is for information and guidance only—it is not a replacement for a veterinarian&apos;s advice or treatment.
          </p>
        </div>

        <div>
          <p className="text-xl font-bold mb-2">3. User Responsibilities</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            To ensure a safe and helpful experience, users are expected to:
          </p>
          <ul className="list-disc ps-8 space-y-2">
            <li className="text-base font-normal leading-relaxed">Provide accurate and truthful information about themselves and their pets.</li>
            <li className="text-base font-normal leading-relaxed">Use the chatbot responsibly and only for its intended purposes.</li>
            <li className="text-base font-normal leading-relaxed">Avoid sending harmful, misleading, or offensive messages.</li>
            <li className="text-base font-normal leading-relaxed">Understand that chatbot responses are automatically generated and may not always be perfect.</li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-bold mb-2">4. Account Registration</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            Some features may require you to create an account. If you do, please:
          </p>
          <ul className="list-disc ps-8 space-y-2">
            <li className="text-base font-normal leading-relaxed">Keep your login details secure.</li>
            <li className="text-base font-normal leading-relaxed">Take responsibility for all activities under your account.</li>
            <li className="text-base font-normal leading-relaxed">Inform the clinic or admin if you suspect unauthorized access.</li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-bold mb-2">5. Intellectual Property</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            All content, visuals, and features within PawPal are owned by Southvalley Veterinary Clinic and the PawPal Development Team.
          </p>
          <p className="text-base font-normal leading-relaxed">
            Users may not copy, reproduce, or modify any part of the system without permission.
          </p>
        </div>

        <div>
          <p className="text-xl font-bold mb-2">6. Limitations and Disclaimer</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            PawPal provides general information to assist pet owners. It does not guarantee the accuracy or completeness of all chatbot responses.
          </p>
          <p className="text-base font-normal leading-relaxed">
            For serious concerns or emergencies regarding your pet&apos;s health, please consult a licensed veterinarian. Southvalley Veterinary Clinic is not responsible for any decisions or actions taken based on chatbot responses.
          </p>
        </div>

        <div>
          <p className="text-xl font-bold mb-2">7. Modification and Termination</p>
          <p className="text-base font-normal leading-relaxed">
            The development team may update, modify, or discontinue certain features of PawPal at any time to improve the service.
          </p>
        </div>

        <div>
          <p className="text-xl font-bold mb-2">8. Contact Information</p>
          <p className="text-base font-normal leading-relaxed">
            For questions, feedback, or concerns about these Terms, please contact: <span className="font-bold underline">southvalleyvc20@gmail.com</span>
          </p>
        </div>

        <p className="text-base font-bold pt-4 leading-relaxed">
          By continuing to use PawPal, you agree to our [Terms of Service] and [Privacy Policy].
        </p>

      </div>
    </div>
  );
}

export default function TermsOfService({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 font-raleway">
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

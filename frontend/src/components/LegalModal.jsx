import React, { useState } from "react";

// NOTE: Ensure this path is correct based on your project structure
const logoSrc = "/pat-removebg-preview 2.png";

function Group() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-4 md:mb-6">
      <div className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0">
        <img alt="Logo" className="w-full h-full object-cover" src={logoSrc} />
      </div>
      <div className="flex items-center justify-center">
        <p 
          className="font-['MuseoModerno:Black',sans-serif] font-black text-[#815fb3] text-[32px] md:text-[65px]" 
          style={{ lineHeight: 'normal' }}
        >
          PAWPAL
        </p>
      </div>
    </div>
  );
}

// --- CONTENT COMPONENTS ---

const TermsContent = () => (
  <div className="space-y-4 md:space-y-6 text-black text-sm md:text-base animate-fadeIn">
    <p className="font-normal text-left text-black mb-4 md:mb-6 text-xs md:text-sm">
      Last Updated: November 2026
    </p>
    
    <p className="font-normal leading-relaxed">
      Welcome to PawPal, your friendly pet healthcare assistant developed for Southvalley Veterinary Clinic. By using PawPal, you agree to the following terms and conditions. Please read them carefully before using our service.
    </p>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">1. Acceptance of Terms</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        By accessing or using PawPal, you acknowledge that you have read and understood these Terms of Service and agree to use the platform in accordance with them.
      </p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        If you have any concerns or do not fully agree with certain parts, we encourage you to contact Southvalley Veterinary Clinic for clarification before continuing to use the service.
      </p>
      <p className="font-normal leading-relaxed">
        By proceeding, you also understand that PawPal is designed to provide general pet healthcare information and assistance on behalf of the clinic.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">2. About PawPal</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        PawPal is a web-based chatbot created by Southvalley Veterinary Clinic to help pet owners with general pet information and appointment requests.
      </p>
      <p className="font-normal leading-relaxed">
        It uses AI to answer common questions about your pet&apos;s health and the clinic&apos;s services. Please remember that PawPal is for information and guidance only—it is not a replacement for a veterinarian&apos;s advice or treatment.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">3. User Responsibilities</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        To ensure a safe and helpful experience, users are expected to:
      </p>
      <ul className="list-disc ps-5 md:ps-8 space-y-1 md:space-y-2">
        <li className="font-normal leading-relaxed">Provide accurate and truthful information about themselves and their pets.</li>
        <li className="font-normal leading-relaxed">Use the chatbot responsibly and only for its intended purposes.</li>
        <li className="font-normal leading-relaxed">Avoid sending harmful, misleading, or offensive messages.</li>
        <li className="font-normal leading-relaxed">Understand that chatbot responses are automatically generated and may not always be perfect.</li>
      </ul>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">4. Account Registration</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        Some features may require you to create an account. If you do, please:
      </p>
      <ul className="list-disc ps-5 md:ps-8 space-y-1 md:space-y-2">
        <li className="font-normal leading-relaxed">Keep your login details secure.</li>
        <li className="font-normal leading-relaxed">Take responsibility for all activities under your account.</li>
        <li className="font-normal leading-relaxed">Inform the clinic or admin if you suspect unauthorized access.</li>
      </ul>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">5. Intellectual Property</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        All content, visuals, and features within PawPal are owned by Southvalley Veterinary Clinic and the PawPal Development Team.
      </p>
      <p className="font-normal leading-relaxed">
        Users may not copy, reproduce, or modify any part of the system without permission.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">6. Limitations and Disclaimer</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        PawPal provides general information to assist pet owners. It does not guarantee the accuracy or completeness of all chatbot responses.
      </p>
      <p className="font-normal leading-relaxed">
        For serious concerns or emergencies regarding your pet&apos;s health, please consult a licensed veterinarian. Southvalley Veterinary Clinic is not responsible for any decisions or actions taken based on chatbot responses.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">7. Modification and Termination</p>
      <p className="font-normal leading-relaxed">
        The development team may update, modify, or discontinue certain features of PawPal at any time to improve the service.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">8. Contact Information</p>
      <p className="font-normal leading-relaxed">
        For questions, feedback, or concerns about these Terms, please contact: <span className="font-bold underline break-all">southvalleyvc20@gmail.com</span>
      </p>
    </div>

    <p className="text-xs md:text-base font-bold pt-2 md:pt-4 leading-relaxed">
       By continuing to use PawPal, you agree to our [Terms of Service] and [Privacy Policy].
    </p>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-4 md:space-y-6 text-black text-sm md:text-base animate-fadeIn">
    <p className="font-normal text-left text-black mb-4 md:mb-6 text-xs md:text-sm">
      Last Updated: November 2025
    </p>

    <div className="space-y-2 md:space-y-3">
      <p className="font-normal leading-relaxed">
        At PawPal, we value your privacy and are committed to keeping your information safe.
      </p>
      <p className="font-normal leading-relaxed">
        This Privacy Policy explains what data we collect, how we use it, and how we protect your personal information when you use our web-based chatbot.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">1. Information We Collect</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        To make PawPal work properly and provide a better experience, we may collect the following:
      </p>
      <ul className="list-disc ps-5 md:ps-8 space-y-1 md:space-y-2">
        <li className="font-normal leading-relaxed">
          <span className="font-semibold">Personal Information:</span> Your name, contact details (such as email or phone number).
        </li>
        <li className="font-normal leading-relaxed">
          <span className="font-semibold">Pet Information:</span> Your pet&apos;s name, species, breed, age, and health-related details shared during chats.
        </li>
        <li className="font-normal leading-relaxed">
          <span className="font-semibold">Chat Data:</span> Messages exchanged with the chatbot to help improve its responses.
        </li>
        <li className="font-normal leading-relaxed">
          <span className="font-semibold">Technical Information:</span> Browser type, device information, and IP address used for system analytics and security.
        </li>
      </ul>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">2. How We Use Your Information</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        The information you provide helps us:
      </p>
      <ul className="list-disc ps-5 md:ps-8 space-y-1 md:space-y-2 mb-2 md:mb-3">
        <li className="font-normal leading-relaxed">Respond accurately to your pet care questions.</li>
        <li className="font-normal leading-relaxed">Assist with appointment-related inquiries.</li>
        <li className="font-normal leading-relaxed">Improve PawPal&apos;s accuracy and user experience.</li>
        <li className="font-normal leading-relaxed">Maintain records for Southvalley Veterinary Clinic&apos;s internal use and service quality.</li>
      </ul>
      <p className="font-normal leading-relaxed">
        We will never use your information for marketing or share it with third parties.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">3. Data Protection and Security</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        Your information is stored securely and protected from unauthorized access, alteration, or loss.
      </p>
      <p className="font-normal leading-relaxed">
        Only authorized clinic staff and system administrators can access your data, and only for operational purposes.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">4. Cookies</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        PawPal may use temporary cookies or session storage to remember recent chats.
      </p>
      <p className="font-normal leading-relaxed">
        You can disable cookies, but some features may not work properly.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">5. Your Rights</p>
      <p className="font-normal leading-relaxed mb-2 md:mb-3">
        You may:
      </p>
      <ul className="list-disc ps-5 md:ps-8 space-y-1 md:space-y-2 mb-2 md:mb-3">
        <li className="font-normal leading-relaxed">View or update your data.</li>
        <li className="font-normal leading-relaxed">Request data deletion.</li>
        <li className="font-normal leading-relaxed">Withdraw consent anytime.</li>
      </ul>
      <p className="font-normal leading-relaxed">
        Contact us at <span className="underline break-all">southvalleyvc20@gmail.com</span> for assistance.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">6. Updates</p>
      <p className="font-normal leading-relaxed">
        We may update this policy when necessary. Any major changes will be announced through PawPal or the clinic&apos;s website.
      </p>
    </div>

    <div>
      <p className="text-base md:text-xl font-bold mb-1 md:mb-2">7. Contact</p>
      <p className="font-normal leading-relaxed">
        For questions or concerns, email <span className="underline break-all">southvalleyvc20@gmail.com</span>
      </p>
    </div>

    <p className="text-xs md:text-base font-bold pt-2 md:pt-4 leading-relaxed">
       By continuing to use PawPal, you agree to our [Terms of Service] and [Privacy Policy].
    </p>
  </div>
);

// --- MAIN MODAL COMPONENT ---

export default function LegalModal({ onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' or 'privacy'

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50 font-raleway p-4 backdrop-blur-sm">
      {/* Responsive Container: width 95% on mobile, max-w-4xl on desktop */}
      <div className="relative w-[95%] md:w-full max-w-4xl bg-[#FFFFF2] rounded-[20px] md:rounded-[30px] shadow-2xl flex flex-col max-h-[90vh] md:max-h-[85vh]">
        
        {/* Header Section (Fixed) */}
        <div className="p-4 md:p-8 pb-0 flex-shrink-0">
          <Group />
          
          {/* Close Button - Adjusted position for mobile */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 md:top-6 md:right-6 bg-[#815fb3] text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg md:text-xl font-bold shadow-lg hover:bg-[#642A77] transition-transform hover:scale-105 z-10"
            aria-label="Close"
          >
            ×
          </button>

          {/* Tabs - Responsive sizing */}
          <div className="flex items-center justify-center gap-2 md:gap-4 mb-3 md:mb-4 border-b border-gray-200 pb-3 md:pb-4">
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-base font-bold transition-all duration-300 ${
                activeTab === 'terms'
                  ? 'bg-[#815fb3] text-white shadow-md'
                  : 'bg-transparent text-[#815fb3] hover:bg-[#f3e6fa]'
              }`}
            >
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full text-xs md:text-base font-bold transition-all duration-300 ${
                activeTab === 'privacy'
                  ? 'bg-[#815fb3] text-white shadow-md'
                  : 'bg-transparent text-[#815fb3] hover:bg-[#f3e6fa]'
              }`}
            >
              Privacy Policy
            </button>
          </div>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pt-0 scrollbar-thin scrollbar-thumb-[#815fb3] scrollbar-track-transparent">
           {activeTab === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </div>
        
        {/* Footer (Optional) */}
        <div className="p-3 md:p-4 text-center border-t border-gray-200 bg-[#fbfbf5] rounded-b-[20px] md:rounded-b-[30px]">
             <p className="text-[10px] md:text-xs text-gray-500">
                © 2025 Southvalley Veterinary Clinic
             </p>
        </div>

      </div>
    </div>
  );
}
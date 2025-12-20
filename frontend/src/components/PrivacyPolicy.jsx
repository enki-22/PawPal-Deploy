import React from "react";

// NOTE: Ensure this path is correct based on your project structure
const logoSrc = "/pat-removebg-preview 1.png";

function Group() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-6">
      <div className="w-12 h-12 md:w-16 md:h-16">
        <img alt="Logo" className="w-full h-full object-cover" src={logoSrc} />
      </div>
      <div className="flex items-center justify-center">
        <p 
          className="font-['MuseoModerno:Black',sans-serif] font-black text-[#815fb3] text-[40px] md:text-[65px]" 
          style={{ lineHeight: 'normal' }}
        >
          PAWPAL
        </p>
      </div>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    // Responsive padding and container styles
    <div className="relative p-5 md:p-8 bg-[#FFFFF2] rounded-[20px] md:rounded-[30px] shadow-[0px_0px_100px_10px_rgba(0,0,0,0.25)] max-w-4xl w-full max-h-[85vh] overflow-y-auto font-raleway">
      <Group />
      <div className="font-bold text-2xl md:text-3xl text-black text-center mb-4">
        Privacy Policy
      </div>
      <p className="font-normal text-left text-black mb-6 text-xs md:text-sm">
        Last Updated: November 2025
      </p>

      {/* Text scaling for mobile */}
      <div className="space-y-6 text-black text-sm md:text-base">
        {/* Intro */}
        <div className="space-y-3">
          <p className="font-normal leading-relaxed">
            At PawPal, we value your privacy and are committed to keeping your information safe.
          </p>
          <p className="font-normal leading-relaxed">
            This Privacy Policy explains what data we collect, how we use it, and how we protect your personal information when you use our web-based chatbot.
          </p>
        </div>

        {/* Section 1 */}
        <div>
          <p className="text-lg md:text-xl font-bold mb-2">1. Information We Collect</p>
          <p className="font-normal leading-relaxed mb-3">
            To make PawPal work properly and provide a better experience, we may collect the following:
          </p>
          <ul className="list-disc ps-5 md:ps-8 space-y-2">
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

        {/* Section 2 */}
        <div>
          <p className="text-lg md:text-xl font-bold mb-2">2. How We Use Your Information</p>
          <p className="font-normal leading-relaxed mb-3">
            The information you provide helps us:
          </p>
          <ul className="list-disc ps-5 md:ps-8 space-y-2 mb-3">
            <li className="font-normal leading-relaxed">Respond accurately to your pet care questions.</li>
            <li className="font-normal leading-relaxed">Assist with appointment-related inquiries.</li>
            <li className="font-normal leading-relaxed">Improve PawPal&apos;s accuracy and user experience.</li>
            <li className="font-normal leading-relaxed">Maintain records for Southvalley Veterinary Clinic&apos;s internal use and service quality.</li>
          </ul>
          <p className="font-normal leading-relaxed">
            We will never use your information for marketing or share it with third parties.
          </p>
        </div>

        {/* Section 3 */}
        <div>
          <p className="text-lg md:text-xl font-bold mb-2">3. Data Protection and Security</p>
          <p className="font-normal leading-relaxed mb-3">
            Your information is stored securely and protected from unauthorized access, alteration, or loss.
          </p>
          <p className="font-normal leading-relaxed">
            Only authorized clinic staff and system administrators can access your data, and only for operational purposes.
          </p>
        </div>

        {/* Section 4 */}
        <div>
          <p className="text-lg md:text-xl font-bold mb-2">4. Cookies</p>
          <p className="font-normal leading-relaxed mb-3">
            PawPal may use temporary cookies or session storage to remember recent chats.
          </p>
          <p className="font-normal leading-relaxed">
            You can disable cookies, but some features may not work properly.
          </p>
        </div>

        {/* Section 5 */}
        <div>
          <p className="text-lg md:text-xl font-bold mb-2">5. Your Rights</p>
          <p className="font-normal leading-relaxed mb-3">
            You may:
          </p>
          <ul className="list-disc ps-5 md:ps-8 space-y-2 mb-3">
            <li className="font-normal leading-relaxed">View or update your data.</li>
            <li className="font-normal leading-relaxed">Request data deletion.</li>
            <li className="font-normal leading-relaxed">Withdraw consent anytime.</li>
          </ul>
          <p className="font-normal leading-relaxed">
            Contact us at <span className="font-bold break-all">southvalleyvc20@gmail.com</span> for assistance.
          </p>
        </div>

        {/* Section 6 */}
        <div>
          <p className="text-lg md:text-xl font-bold mb-2">6. Updates</p>
          <p className="font-normal leading-relaxed">
            We may update this policy when necessary. Any major changes will be announced through PawPal or the clinic&apos;s website.
          </p>
        </div>

        {/* Section 7 */}
        <div>
          <p className="text-lg md:text-xl font-bold mb-2">7. Contact</p>
          <p className="font-normal leading-relaxed">
            For questions or concerns, email <span className="font-bold break-all">southvalleyvc20@gmail.com</span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function PrivacyPolicy({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 font-raleway p-4">
      <div className="relative w-full max-w-4xl">
        <PrivacyPolicyContent />
        <button
          onClick={onClose}
          // Adjusted top/right positioning for mobile
          className="absolute top-2 right-2 md:top-4 md:right-4 bg-[#815fb3] text-white rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-lg md:text-xl font-bold shadow-lg hover:bg-[#642A77] z-10"
          aria-label="Close Privacy Policy"
        >
          ×
        </button>
      </div>
    </div>
  );
}
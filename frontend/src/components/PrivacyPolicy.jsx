
import React from "react";

// NOTE: Ensure this path is correct based on your project structure
const logoSrc = "/pat-removebg-preview 2.png";

function Group() {
  return (
    <div className="flex items-center justify-center gap-4 mb-6">
      <div className="w-16 h-16">
        <img alt="Logo" className="w-full h-full object-cover" src={logoSrc} />
      </div>
      <div className="flex items-center justify-center">
        <p 
          className="font-['MuseoModerno:Black',sans-serif] font-black text-[#815fb3]" 
          style={{ fontSize: '65px', lineHeight: 'normal' }}
        >
          PAWPAL
        </p>
      </div>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    <div className="relative p-8 bg-[#FFFFF2] rounded-[30px] shadow-[0px_0px_100px_10px_rgba(0,0,0,0.25)] max-w-4xl w-full max-h-[85vh] overflow-y-auto font-raleway">
      <Group />
      <div className="font-bold text-3xl text-black text-center mb-4">
        Privacy Policy
      </div>
      <p className="font-normal text-left text-black mb-6 text-sm">
        Last Updated: November 2025
      </p>

      <div className="space-y-6 text-black">
        {/* Intro */}
        <div className="space-y-3">
          <p className="text-base font-normal leading-relaxed">
            At PawPal, we value your privacy and are committed to keeping your information safe.
          </p>
          <p className="text-base font-normal leading-relaxed">
            This Privacy Policy explains what data we collect, how we use it, and how we protect your personal information when you use our web-based chatbot.
          </p>
        </div>

        {/* Section 1 */}
        <div>
          <p className="text-xl font-bold mb-2">1. Information We Collect</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            To make PawPal work properly and provide a better experience, we may collect the following:
          </p>
          <ul className="list-disc ps-8 space-y-2">
            <li className="text-base font-normal leading-relaxed">
              <span className="font-semibold">Personal Information:</span> Your name, contact details (such as email or phone number).
            </li>
            <li className="text-base font-normal leading-relaxed">
              <span className="font-semibold">Pet Information:</span> Your pet&apos;s name, species, breed, age, and health-related details shared during chats.
            </li>
            <li className="text-base font-normal leading-relaxed">
              <span className="font-semibold">Chat Data:</span> Messages exchanged with the chatbot to help improve its responses.
            </li>
            <li className="text-base font-normal leading-relaxed">
              <span className="font-semibold">Technical Information:</span> Browser type, device information, and IP address used for system analytics and security.
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div>
          <p className="text-xl font-bold mb-2">2. How We Use Your Information</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            The information you provide helps us:
          </p>
          <ul className="list-disc ps-8 space-y-2 mb-3">
            <li className="text-base font-normal leading-relaxed">Respond accurately to your pet care questions.</li>
            <li className="text-base font-normal leading-relaxed">Assist with appointment-related inquiries.</li>
            <li className="text-base font-normal leading-relaxed">Improve PawPal&apos;s accuracy and user experience.</li>
            <li className="text-base font-normal leading-relaxed">Maintain records for Southvalley Veterinary Clinic&apos;s internal use and service quality.</li>
          </ul>
          <p className="text-base font-normal leading-relaxed">
            We will never use your information for marketing or share it with third parties.
          </p>
        </div>

        {/* Section 3 */}
        <div>
          <p className="text-xl font-bold mb-2">3. Data Protection and Security</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            Your information is stored securely and protected from unauthorized access, alteration, or loss.
          </p>
          <p className="text-base font-normal leading-relaxed">
            Only authorized clinic staff and system administrators can access your data, and only for operational purposes.
          </p>
        </div>

        {/* Section 4 */}
        <div>
          <p className="text-xl font-bold mb-2">4. Cookies</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            PawPal may use temporary cookies or session storage to remember recent chats.
          </p>
          <p className="text-base font-normal leading-relaxed">
            You can disable cookies, but some features may not work properly.
          </p>
        </div>

        {/* Section 5 */}
        <div>
          <p className="text-xl font-bold mb-2">5. Your Rights</p>
          <p className="text-base font-normal leading-relaxed mb-3">
            You may:
          </p>
          <ul className="list-disc ps-8 space-y-2 mb-3">
            <li className="text-base font-normal leading-relaxed">View or update your data.</li>
            <li className="text-base font-normal leading-relaxed">Request data deletion.</li>
            <li className="text-base font-normal leading-relaxed">Withdraw consent anytime.</li>
          </ul>
          <p className="text-base font-normal leading-relaxed">
            Contact us at <span className="underline">southvalleyvc20@gmail.com</span> for assistance.
          </p>
        </div>

        {/* Section 6 */}
        <div>
          <p className="text-xl font-bold mb-2">6. Updates</p>
          <p className="text-base font-normal leading-relaxed">
            We may update this policy when necessary. Any major changes will be announced through PawPal or the clinic&apos;s website.
          </p>
        </div>

        {/* Section 7 */}
        <div>
          <p className="text-xl font-bold mb-2">7. Contact</p>
          <p className="text-base font-normal leading-relaxed">
            For questions or concerns, email <span className="underline">southvalleyvc20@gmail.com</span>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function PrivacyPolicy({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 font-raleway">
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

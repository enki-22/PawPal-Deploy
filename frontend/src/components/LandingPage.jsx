import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  // Placeholder images for all assets
  // const placeholderImg = "https://via.placeholder.com/400x400?text=Image";
  return (
    <div className="bg-[#f7f6fa] min-h-screen w-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full bg-white h-[65px] flex items-center justify-between px-8 shadow z-50" style={{ position: 'sticky', top: 0 }} data-name="Container">
        <div aria-hidden="true" className="absolute border-0 border-gray-200 border-solid inset-0 pointer-events-none" />
        {/* Login Button */}
        <div className="absolute h-[40px] right-[90px] top-[12px] w-[151.65px]" data-name="Container">
          <button
            className="absolute bg-[#7e57c2] h-[40px] left-[0.05px] rounded-[9999px] top-0 w-[99.65px] flex items-center justify-center"
            onClick={() => navigate('/petowner/login')}
            data-name="Button"
          >
            <img src="/login-signup.png" alt="login icon" className="ml-4 w-4 h-4" />
            <span className="ml-2 text-white font-['Inter',sans-serif] text-[13.6px]">Log in</span>
          </button>
        </div>
        {/* Sign Up Button */}
        <div className="absolute bg-[#7e57c2] h-[40px] right-[27px] rounded-[9999px] top-[11px] w-[99.65px] flex items-center justify-center" data-name="Button">
          <button
            className="w-full h-full flex items-center justify-center rounded-[9999px]"
            onClick={() => navigate('/petowner/register')}
          >
            <img src="/login-signup.png" alt="signup icon" className="ml-4 w-4 h-4" />
            <span className="ml-2 text-white font-['Inter',sans-serif] text-[13.6px]">Sign Up</span>
          </button>
        </div>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 900, fontSize: 24, color: '#815FB3', letterSpacing: 1 }}>SOUTHVALLEY VETERINARY CLINIC</span>
      </div>

      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center bg-[#ede9f7] pt-10 pb-10" style={{ minHeight: 320 }}>
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-5xl px-4">
          {/* Logo Left */}
          <div className="bg-white rounded-lg flex items-center justify-center p-6 md:p-10" style={{ minWidth: 340, minHeight: 340 }}>
            <img
              src="/194911935_109537641352555_8380857820585025274_n 1.png"
              alt="Southvalley Veterinary Clinic Logo"
              className="w-[320px] h-[320px] object-contain"
              style={{ borderRadius: 12 }}
            />
          </div>
          {/* Text Right */}
          <div className="flex flex-col justify-center items-start max-w-xl mt-8 md:mt-0">
            <span className="text-[32px] font-bold leading-tight mb-2" style={{ fontFamily: 'Inter', color: '#181818' }}>Caring for your</span>
            <span className="text-[32px] font-bold leading-tight mb-4" style={{ fontFamily: 'Inter', color: '#a60da6' }}>furry family members</span>
            <span className="text-[18px] text-[#181818]" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
              Southvalley Veterinary Clinic provides compassionate, comprehensive care for your pets.<br />
              From preventive care to specialized treatments, we&apos;re here for every stage of your pet&apos;s life.
            </span>
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <section className="w-full flex flex-col items-center justify-center bg-[#ede9f7] py-12">
        <h2 className="text-[28px] font-bold text-[#181818] mb-2 text-center" style={{ fontFamily: 'Inter' }}>Special Promotions</h2>
        <span className="text-[18px] text-[#666] mb-10 text-center" style={{ fontFamily: 'Inter' }}>Check out our current special offers and promotions to help you save while providing the best care for your pets.</span>
        <div className="flex flex-row gap-8 w-full max-w-6xl justify-center items-start">
          {/* Card 1 */}
          <div className="bg-white rounded-[18px] shadow flex flex-col items-stretch p-0 w-[400px] min-h-[600px] border border-[#e0d7f7]">
            <img alt="Low cost vaccination promotion" src="/Frame 56.png" className="rounded-t-[18px] w-full h-[320px] object-contain bg-[#f7f6fa]" />
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-[18px] text-[#181818] mb-2" style={{ fontFamily: 'Inter' }}>Low Cost Bakuna</h3>
              <p className="text-[15px] text-[#181818] mb-4" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Affordable care, peace of mind, protection that&apos;s easy to find. Safe, simple, and budget-wise, Your pet&apos;s health matters&mdash;immunize!</p>
              <div className="flex-1"></div>
              <button className="bg-[#a084e8] text-white rounded-[8px] px-6 py-2 text-[15px] font-semibold shadow self-end mt-2 hover:bg-[#815fb3] transition-colors" style={{ fontFamily: 'Inter' }}>Read More</button>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded-[18px] shadow flex flex-col items-stretch p-0 w-[400px] min-h-[600px] border border-[#e0d7f7]">
            <img alt="Low cost kapon promotion" src="/low cost kapon.png" className="rounded-t-[18px] w-full h-[320px] object-contain bg-[#f7f6fa]" />
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-[18px] text-[#181818] mb-2" style={{ fontFamily: 'Inter' }}>Low Cost Kapon</h3>
              <p className="text-[15px] text-[#181818] mb-4" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Affordable spay and neuter services now available in Southvalley! ...</p>
              <div className="flex-1"></div>
              <button className="bg-[#a084e8] text-white rounded-[8px] px-6 py-2 text-[15px] font-semibold shadow self-end mt-2 hover:bg-[#815fb3] transition-colors" style={{ fontFamily: 'Inter' }}>Read More</button>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-white rounded-[18px] shadow flex flex-col items-stretch p-0 w-[400px] min-h-[600px] border border-[#e0d7f7]">
            <img alt="Holy Week Advisory promotion" src="/holy week advisory.png" className="rounded-t-[18px] w-full h-[320px] object-contain bg-[#f7f6fa]" />
            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-bold text-[18px] text-[#181818] mb-2" style={{ fontFamily: 'Inter' }}>Holy Week Advisory</h3>
              <p className="text-[15px] text-[#181818] mb-4" style={{ fontFamily: 'Inter', fontWeight: 400 }}>In observance of Holy Week, please take note of our adjusted clinic hours. Kindly plan your visits ahead of time...</p>
              <div className="flex-1"></div>
              <button className="bg-[#a084e8] text-white rounded-[8px] px-6 py-2 text-[15px] font-semibold shadow self-end mt-2 hover:bg-[#815fb3] transition-colors" style={{ fontFamily: 'Inter' }}>Read More</button>
            </div>
          </div>
        </div>
      </section>

      {/* Meet PawPal Section */}
      <section className="w-full flex flex-col items-center justify-center bg-[#f8eedc] py-12 border-t border-b border-[#e0d7f7]">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 w-full max-w-6xl px-4">
          {/* Left: Text Content */}
          <div className="flex flex-col justify-center items-start max-w-xl flex-1">
            <h2 className="text-[28px] font-bold text-[#181818] mb-1" style={{ fontFamily: 'Inter' }}>Meet PawPal</h2>
            <h3 className="text-[20px] font-semibold mb-6" style={{ fontFamily: 'Inter', color: '#7e57c2' }}>Your 24/7 Pet Care Assistant</h3>
            <p className="text-[18px] text-[#181818] mb-7" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
              Get instant answers to your pet care questions, check symptoms, and receive guidance on when to visit our clinic. PawPal is here to help you provide the best care for your furry friends.
            </p>
            <button className="bg-[#7e57c2] text-white rounded-[8px] px-7 py-2 text-[15px] font-semibold shadow mb-6 hover:bg-[#815fb3] transition-colors" style={{ fontFamily: 'Inter', minWidth: 170 }} onClick={() => navigate('/petowner/login')}>ACCESS PAWPAL</button>
            <div className="text-[#666] text-[14px] font-bold" style={{ fontFamily: 'Inter', maxWidth: 420 }}>
              Already have an account? <span className="font-bold">Login</span> to access your pet&apos;s personalized care recommendations and history.<br />
              <span className="font-semibold">New users can sign up for free with your email address.</span>
            </div>
          </div>
          {/* Right: Chat Preview */}
          <div className="bg-white rounded-[16px] shadow flex flex-col gap-3 items-start p-7 w-[400px] min-h-[220px] border border-[#e0d7f7]">
            <div className="flex flex-row items-start gap-3 mb-2">
              <div className="w-12 h-12 bg-[#e6d6f7] rounded-[16px] flex items-center justify-center">
                {/* PawPal Icon Placeholder */}
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#7e57c2" opacity="0.15"/><path d="M12 17c2.5 0 4.5-2 4.5-4.5S14.5 8 12 8s-4.5 2-4.5 4.5S9.5 17 12 17Z" stroke="#7E57C2" strokeWidth="2"/><circle cx="9" cy="10" r="1" fill="#7E57C2"/><circle cx="15" cy="10" r="1" fill="#7E57C2"/></svg>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="bg-[#e6d6f7] text-[#181818] text-[15px] rounded-[8px] px-4 py-2" style={{ fontFamily: 'Inter' }}>Hi there! I&apos;m PawPal, your virtual pet care assistant. How can I help you and your furry friend today?</div>
                <div className="bg-[#d1b6f7] text-[#181818] text-[15px] rounded-[8px] px-4 py-2" style={{ fontFamily: 'Inter' }}>I can answer questions about pet care, help you identify symptoms, and let you know when it&apos;s time to see a vet.</div>
                <div className="bg-[#ede9f7] text-[#666] italic text-[15px] rounded-[8px] px-4 py-2" style={{ fontFamily: 'Inter' }}>Please log in to start a conversation with PawPal and access personalized advice for your pets.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How can PawPal help you? Section */}
      <section className="w-full flex flex-col items-center justify-center bg-[#e5d9f6] py-14">
        <h2 className="text-[32px] font-bold text-[#181818] mb-2 text-center" style={{ fontFamily: 'Inter' }}>How can PawPal help you?</h2>
        <span className="text-[18px] text-[#666] mb-10 text-center max-w-2xl" style={{ fontFamily: 'Inter' }}>PawPal is designed to assist with all aspects of pet care, from health concerns to behavior training and daily needs.</span>
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center items-stretch mt-2">
          {/* Card 1 */}
          <div className="bg-[#f3e6fa] rounded-[16px] shadow flex flex-col items-start p-7 w-[320px] min-h-[280px]">
            <div className="mb-4"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" stroke="#a084e8" strokeWidth="2"/><circle cx="12" cy="11" r="2.5" stroke="#a084e8" strokeWidth="2"/></svg></div>
            <h3 className="font-bold text-[17px] text-[#181818] mb-2" style={{ fontFamily: 'Inter' }}>What&apos;s normal for my pet?</h3>
            <p className="text-[15px] text-[#4B5563]" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Learn about typical behaviors, habits, diet, and health patterns specific to your pet&apos;s breed, age, and species. Perfect for new pet owners and those seeking to better understand their companion.</p>
          </div>
          {/* Card 2 */}
          <div className="bg-[#fff8e1] rounded-[16px] shadow flex flex-col items-start p-7 w-[320px] min-h-[280px]">
            <div className="mb-4"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9Z" stroke="#a084e8" strokeWidth="2"/><path d="M12 7v4l3 3" stroke="#a084e8" strokeWidth="2"/></svg></div>
            <h3 className="font-bold text-[17px] text-[#181818] mb-2" style={{ fontFamily: 'Inter' }}>Symptom Checker</h3>
            <p className="text-[15px] text-[#4B5563]" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Describe your pet&apos;s symptoms and receive guidance on potential causes, when to see a vet, and home care recommendations. Note that this is not a replacement for professional veterinary care.</p>
          </div>
          {/* Card 3 */}
          <div className="bg-[#e6f7ef] rounded-[16px] shadow flex flex-col items-start p-7 w-[320px] min-h-[280px]">
            <div className="mb-4"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#a084e8" strokeWidth="2"/><path d="M8 8h8M8 12h8M8 16h4" stroke="#a084e8" strokeWidth="2"/></svg></div>
            <h3 className="font-bold text-[17px] text-[#181818] mb-2" style={{ fontFamily: 'Inter' }}>Pet Health Records</h3>
            <p className="text-[15px] text-[#4B5563]" style={{ fontFamily: 'Inter', fontWeight: 400 }}>Keep track of vaccinations, medications, vet visits, and health milestones all in one place. Set reminders for upcoming appointments and medication schedules.</p>
          </div>
        </div>
      </section>
      {/* Find Us Section */}
      <section className="w-full flex flex-col items-center justify-center bg-[#ede9f7] py-14">
        <h2 className="text-[32px] font-bold text-[#181818] mb-2 text-center" style={{ fontFamily: 'Inter' }}>Find Us</h2>
        <span className="text-[18px] text-[#181818] mb-10 text-center max-w-2xl" style={{ fontFamily: 'Inter' }}>Visit our clinic or reach out to us through any of these channels</span>
        <div className="flex flex-col md:flex-row gap-10 w-full max-w-6xl justify-center items-start mt-2">
          {/* Left: Cards */}
          <div className="flex flex-col gap-6 min-w-[320px] flex-1 max-w-[340px]">
            <div className="bg-white rounded-[16px] shadow-lg p-7 flex flex-col gap-5 border border-[#e0d7f7]">
              <div className="font-bold text-[#181818] text-[18px] mb-2" style={{ fontFamily: 'Inter' }}>Contact Information</div>
              <div className="flex items-start gap-3 text-[#a084e8]">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" stroke="#a084e8" strokeWidth="2"/><circle cx="12" cy="11" r="2.5" stroke="#a084e8" strokeWidth="2"/></svg>
                <span className="text-[#181818] text-[15px]" style={{ fontFamily: 'Inter' }}>A. Gomez, National Highway, Balibago, Sta. Rosa, Laguna, Sta. Rosa, Philippines</span>
              </div>
              <div className="flex items-center gap-3 text-[#a084e8]">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C6.48 21 3 17.52 3 13a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.24 1.01l-2.2 2.2Z" stroke="#a084e8" strokeWidth="2"/></svg>
                <span className="text-[#181818] text-[15px]" style={{ fontFamily: 'Inter' }}>0928 960 7250</span>
              </div>
              <div className="flex items-center gap-3 text-[#a084e8]">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#a084e8" strokeWidth="2"/><path d="M3 7l9 6 9-6" stroke="#a084e8" strokeWidth="2"/></svg>
                <span className="text-[#181818] text-[15px]" style={{ fontFamily: 'Inter' }}>southvalleyvc20@gmail.com</span>
              </div>
            </div>
            <div className="bg-white rounded-[16px] shadow-lg p-7 flex flex-col gap-2 border border-[#e0d7f7]">
              <div className="font-bold text-[#181818] text-[18px] mb-2" style={{ fontFamily: 'Inter' }}>Hours of Operation</div>
              <span className="text-[20px] font-bold text-[#181818]" style={{ fontFamily: 'Inter' }}>WE&apos;RE OPEN 24/7</span>
            </div>
          </div>
          {/* Right: Map Placeholder */}
          <div className="bg-white rounded-[16px] shadow-lg p-4 flex items-center justify-center min-w-[420px] min-h-[340px] border border-[#e0d7f7]">
            <img src="/map.png" alt="Map placeholder" className="rounded-[10px] w-[560px] h-[340px] object-cover" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#8d6dc4] pt-8 pb-2 px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-2">
          {/* Left: Clinic Info & Socials */}
          <div className="flex-1 min-w-[260px]">
            <div className="font-bold text-[20px] text-[#fff59d] mb-1" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: 1 }}>SOUTHVALLEY VETERINARY CLINIC</div>
            <div className="text-[#fff59d] text-[15px] mb-2" style={{ fontFamily: 'Inter' }}>
              We take satisfaction in our optimal veterinary services designed to consistently provide for you and your pet companion.
            </div>
            <div className="flex gap-4 mb-2">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#fff59d"/><path d="M17 8.5a2.5 2.5 0 0 0-2.5-2.5h-5A2.5 2.5 0 0 0 7 8.5v7A2.5 2.5 0 0 0 9.5 18h5a2.5 2.5 0 0 0 2.5-2.5v-7Z" fill="#8d6dc4"/><path d="M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="#fff59d"/></svg>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#fff59d"/><path d="M16.5 7.5a4.5 4.5 0 0 0-9 0c0 2.485 2.015 4.5 4.5 4.5s4.5-2.015 4.5-4.5Z" fill="#8d6dc4"/><path d="M12 13.5c-2.485 0-4.5 2.015-4.5 4.5v.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-.5c0-2.485-2.015-4.5-4.5-4.5Z" fill="#8d6dc4"/></svg>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#fff59d"/><path d="M8.5 8.5h7v7h-7v-7Z" fill="#8d6dc4"/><path d="M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" fill="#fff59d"/></svg>
            </div>
          </div>
          {/* Right: Legal Links */}
          <div className="flex flex-col items-start min-w-[180px] mt-2 md:mt-0">
            <div className="text-[#fff59d] text-[16px] font-semibold mb-2" style={{ fontFamily: 'Inter' }}>Legal</div>
            <a href="#" className="text-[#fff] text-[15px] mb-1 hover:underline" style={{ fontFamily: 'Inter' }}>Privacy Policy</a>
            <a href="#" className="text-[#fff] text-[15px] hover:underline" style={{ fontFamily: 'Inter' }}>Terms of Service</a>
          </div>
        </div>
        <hr className="border-t border-[#fff59d] my-4" />
        <div className="text-left text-[#fff] text-[15px] pl-1" style={{ fontFamily: 'Inter' }}>
          © 2025 PuyaTechs. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

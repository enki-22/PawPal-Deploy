import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PromotionCarousel from "./PromotionCarousel";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import api from "../services/api";


export default function LandingPage() {
  const navigate = useNavigate();

  const API_ROOT = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
  // Auth redirect logic
  // Note: Ensure this path is correct for your file structure
  // eslint-disable-next-line
  const { user } = require('../context/AuthContext'); 
  
  // State for Mobile Sidebar
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  // State for Privacy Policy Modal
  const [showPrivacyPolicy, setShowPrivacyPolicy] = React.useState(false);
  // State for Terms of Service Modal
  const [showTermsOfService, setShowTermsOfService] = React.useState(false);

// Redirect on mount - DISABLED TO PREVENT LOGIN LOOPS
  // React.useEffect(() => {
  //   if (user) {
  //     navigate('/chat/new', { replace: true });
  //   }
  // }, [user, navigate]);

  // --- ANIMATION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };
  const itemVariantsLeft = {
    hidden: { opacity: 0, x: -100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };
  const itemVariantsRight = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };
  const cardHover = {
    scale: 1.02,
    boxShadow: "0px 20px 40px -10px rgba(0, 0, 0, 0.2)",
    transition: { type: "spring", stiffness: 300 },
  };

  // --- DEFAULT PROMOTIONS ---
  const DEFAULT_PROMOTIONS = React.useMemo(() => [
    {
      id: 1,
      title: "Low Cost Bakuna",
      description: "Affordable care, peace of mind, protection that's easy to find. Safe, simple, and budget-wise, Your pet's health matters—immunize!",
      image: "/frame-56.png"
    },
    {
      id: 2,
      title: "Low Cost Kapon",
      description: "Affordable spay and neuter services now available in Southvalley! Prevent unwanted litters and improve your pet's health.",
      image: "/low cost kapon.png"
    },
    {
      id: 3,
      title: "Holy Week Advisory",
      description: "In observance of Holy Week, please take note of our adjusted clinic hours. Kindly plan your visits ahead of time.",
      image: "/holy week advisory.png"
    }
  ], []);

  // --- PROMOTIONS STATE ---
  const [promotions, setPromotions] = React.useState([]);
  React.useEffect(() => {
    const fetchPromotions = async () => {
      try {
        // Note: Make sure this URL matches  public Django route
        const response = await api.get('/api/announcements/active');
        console.log("Landing Page Data:", response.data);
        
        if (response.data.success && response.data.announcements.length > 0) {
          const absolutePromotions = response.data.announcements.map(promo => {
            // SAFE IMAGE CHECK with PUBLIC_URL fallback:
            let finalImage = process.env.PUBLIC_URL + "/frame-56.png"; // Fallback to default promotion image
            
            if (promo.image) {
              finalImage = promo.image.startsWith('http') 
                ? promo.image 
                : `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'}${promo.image}`;
            }

            return {
              ...promo,
              id: promo.announcement_id, // Map database ID to 'id' for the carousel
              image: finalImage
            };
          });
          
          setPromotions(absolutePromotions);
        } else {
          setPromotions(DEFAULT_PROMOTIONS);
        }
      } catch (error) {
        console.error("Failed to fetch promotions:", error);
        setPromotions(DEFAULT_PROMOTIONS); 
      }
    };
  
    fetchPromotions();
  }, [DEFAULT_PROMOTIONS]);

  // --- HELPER: SCROLL TO SECTION ---
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false); // Close sidebar on click
    }
        {/* Privacy Policy Modal */}
        {showPrivacyPolicy && (
          <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
        )}
  };

  return (
    <div className="bg-[#f7f6fa] w-full h-screen flex flex-col relative overflow-hidden">
      
      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      <div
        className={`
          fixed inset-0 z-[60] flex justify-end
          transition-opacity duration-300 ease-in-out
          ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        aria-modal="true"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>

        {/* Sidebar Drawer */}
        <div
          className={`
            relative w-[280px] h-full bg-white shadow-2xl flex flex-col
            transition-transform duration-300 ease-in-out transform
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="p-5 border-b flex items-center justify-between bg-[#FDFDFD]">
             <span className="font-bold text-[#815FB3] text-lg font-['Poppins',sans-serif]">MENU</span>
             <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                {/* Close Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-4">
            <motion.button onClick={() => scrollToSection('home')} whileTap={{ scale: 0.95 }} className="text-left px-4 py-3 rounded-lg hover:bg-[#f0f1f1] text-[#333] font-semibold">Home</motion.button>
            <motion.button onClick={() => scrollToSection('meet-pawpal')} whileTap={{ scale: 0.95 }} className="text-left px-4 py-3 rounded-lg hover:bg-[#f0f1f1] text-[#333] font-semibold">Meet PawPal</motion.button>
            <motion.button onClick={() => scrollToSection('promotions')} whileTap={{ scale: 0.95 }} className="text-left px-4 py-3 rounded-lg hover:bg-[#f0f1f1] text-[#333] font-semibold">Promotions</motion.button>
            <motion.button onClick={() => scrollToSection('help')} whileTap={{ scale: 0.95 }} className="text-left px-4 py-3 rounded-lg hover:bg-[#f0f1f1] text-[#333] font-semibold">Help</motion.button>
            <motion.button onClick={() => scrollToSection('find-us')} whileTap={{ scale: 0.95 }} className="text-left px-4 py-3 rounded-lg hover:bg-[#f0f1f1] text-[#333] font-semibold">Find Us</motion.button>
          </div>

          <div className="p-5 border-t flex flex-col gap-3 bg-[#f7f6fa]">
            <motion.button 
              onClick={() => navigate("/petowner/login")}
              className="w-full h-[44px] rounded-full bg-white border border-[#7e57c2] text-[#7e57c2] font-bold"
              whileTap={{ scale: 0.95 }}
            >
              Log In
            </motion.button>
            <motion.button 
              onClick={() => navigate("/petowner/register")}
              className="w-full h-[44px] rounded-full bg-[#7e57c2] text-white font-bold shadow-md"
              whileTap={{ scale: 0.95 }}
            >
              Sign Up
            </motion.button>
          </div>
        </div>
      </div>

      {/* --- HEADER --- */}
      <div
        className="w-full bg-white/90 backdrop-blur-md h-[64px] flex items-center justify-between px-4 md:px-8 shadow-sm z-50 fixed top-0 left-0 transition-all duration-300"
        data-name="Container"
      >
        {/* Logo Section */}
        <button
          type="button"
          onClick={() => scrollToSection('home')}
          className="flex items-center cursor-pointer focus:outline-none"
          aria-label="Go to Home"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToSection('home'); } }}
        >
          {/* Optional: Add small logo icon here if desired */}
          <span
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 900,
            fontSize: 20,
            color: "#815FB3",
            letterSpacing: 1,
          }}
          className="truncate max-w-[250px] lg:max-w-none"
          >
          SOUTHVALLEY
          <span className="hidden md:inline"> VETERINARY CLINIC</span>
          </span>
        </button>

        {/* --- DESKTOP NAVIGATION LINKS (Hidden on mobile) --- */}
        <div className="hidden lg:flex items-center gap-20">
            <button 
              onClick={() => scrollToSection('meet-pawpal')}
              className="text-[#666] hover:text-[#815FB3] font-['Raleway',sans-serif] font-semibold text-[15px] transition-colors"
            >
              Meet PawPal
            </button>
            <button 
              onClick={() => scrollToSection('promotions')}
              className="text-[#666] hover:text-[#815FB3] font-['Raleway',sans-serif] font-semibold text-[15px] transition-colors"
            >
              Promotions
            </button>
            <button 
              onClick={() => scrollToSection('help')}
              className="text-[#666] hover:text-[#815FB3] font-['Raleway',sans-serif] font-semibold text-[15px] transition-colors"
            >
              Help
            </button>
            <button 
              onClick={() => scrollToSection('find-us')}
              className="text-[#666] hover:text-[#815FB3] font-['Raleway',sans-serif] font-semibold text-[15px] transition-colors"
            >
              Find Us
            </button>
        </div>

        {/* --- DESKTOP BUTTONS (Hidden on mobile) --- */}
        <div className="hidden lg:flex items-center gap-2 md:gap-4">
          <motion.button
            className="bg-[#7e57c2] h-[44px] rounded-full px-4 md:px-5 flex items-center justify-center gap-2 text-white font-['Inter',sans-serif] text-[15px] md:text-[13.6px]"
            onClick={() => navigate("/petowner/login")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src="/login-signup.png"
              alt="login icon"
              className="w-4 h-4"
            />
            <span>Log in</span>
          </motion.button>
          <motion.button
            className="bg-[#7e57c2] h-[44px] rounded-full px-4 md:px-5 flex items-center justify-center gap-2 text-white font-['Inter',sans-serif] text-[15px] md:text-[13.6px]"
            onClick={() => navigate("/petowner/register")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src="/login-signup.png"
              alt="signup icon"
              className="w-4 h-4"
            />
            <span>Sign Up</span>
          </motion.button>
        </div>

        {/* --- MOBILE TOGGLE BUTTON (Visible only on mobile) --- */}
        <div className="flex lg:hidden">
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-[#815FB3]"
                aria-label="Open menu"
            >
                 {/* Hamburger Icon SVG */}
                 <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </button>
        </div>
      </div>

      {/* Main Content Container */}
      {/* FIXED: Added overflow-x-hidden here to prevent side dragging */}
      <main className="flex-1 w-full h-screen overflow-y-auto overflow-x-hidden snap-y snap-mandatory">
        
        {/* Hero Section */}
        <motion.section
          id="home"
          className="w-full min-h-screen snap-start flex flex-col items-center justify-start md:justify-center bg-[#ede9f7] pt-[80px] md:pt-[56px] relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.5 }}
        >
          {/* Wave SVG Background */}
          <div className="absolute bottom-0 left-0 w-full z-0">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto block">
                <path fill="#ffffff" fillOpacity="1" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,224C840,245,960,267,1080,261.3C1200,256,1320,224,1380,208L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
              </svg>
          </div>

          {/* Main Content Container */}
          <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-4 w-full max-w-[95%] px-4 z-10 h-auto md:h-[calc(100vh-56px)]">
            
            {/* Left: Big Logo */}
            <motion.div 
                className="w-full md:w-[33%] flex justify-center items-center mt-4 md:-mt-32"
                variants={itemVariantsLeft}
            >
                <img
                    src="/96d78afd-a196-47fc-870d-409b03dedb90-removebg-preview 1.png"
                    alt="Southvalley 24h Logo"
                    className="w-[240px] md:w-full max-w-[500px] object-contain"
                />
            </motion.div>

            {/* Middle: Text Content */}
            <motion.div 
                className="w-full md:w-[33%] flex flex-col items-center md:items-start text-center md:text-left mt-2 md:-mt-32 md:self-center"
                variants={itemVariants}
            >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight font-['Inter',sans-serif] text-[#181818]">
                    Caring for your <br/>
                    <span className="text-[#a60da6]">furry family members</span>
                </h1>
                <p className="text-base md:text-lg text-[#333] font-['Inter',sans-serif] leading-relaxed max-w-md px-2 md:px-0">
                    Southvalley Veterinary Clinic provides compassionate, 
                    comprehensive care for your pets. 
                    From preventive care to specialized treatments, 
                    we&apos;re here for every stage of your pet&apos;s life.
                </p>
            </motion.div>

            {/* Right: Pets Image - HIDDEN ON MOBILE */}
            <motion.div 
                className="hidden md:flex w-full md:w-[33%] justify-center md:justify-end items-end mt-auto md:-mt-16"
                variants={itemVariantsRight}
            >
                 <img
                    src="/0392691c88db5749efd321d633a8a9e8 1.png"
                    alt="Cute pets"
                    className="w-[280px] md:w-full max-w-[650px] object-contain drop-shadow-xl transform translate-y-8 md:translate-y-12 lg:translate-y-16 scale-110 origin-bottom" 
                />
            </motion.div>

          </div>
        </motion.section>

        {/* Promotions Section */}
        <motion.section
          id="promotions"
          // FIXED: Reduced top padding to pt-14 (56px) and used justify-start for mobile to pull text up.
          // overflow-hidden handles any banner scaling issues.
          className="w-full h-screen snap-start flex flex-col items-center justify-start md:justify-center bg-[#FFFFFF] px-4 pt-14 md:pt-20 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.3 }}
        >
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-[#181818] mb-2 text-center pt-8 md:pt-0"
            style={{ fontFamily: "'Inter', sans-serif" }}
            variants={itemVariants}
          >
            Special Promotions
          </motion.h2>
          <motion.span
            // Increased mb-6 on mobile to push the banner down, ensuring no overlap
            className="text-sm md:text-lg text-[#666] mb-8 md:mb-8 text-center max-w-xs md:max-w-xl leading-tight md:leading-normal"
            style={{ fontFamily: "'Inter', sans-serif" }}
            variants={itemVariants}
          >
            Check out our current special offers and promotions to help you save while providing the best care for your pets.
          </motion.span>

          <motion.div 
            className="w-[85%] md:w-full flex justify-center flex-1 md:flex-none"
            variants={itemVariants}
          >
            {promotions.length > 0 ? (
              <PromotionCarousel promotions={promotions} />
            ) : (
              <p>Loading promotions...</p>
            )}
          </motion.div>
        </motion.section>

        {/* Meet PawPal Section */}
        <motion.section
          id="meet-pawpal"
          // FIXED: Added overflow-hidden
          className="w-full min-h-screen snap-start flex flex-col items-center justify-center bg-[#f8eedc] border-t border-b border-[#e0d7f7] px-4 pt-32 pb-12 md:py-0 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.3 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-6xl px-2 md:px-0">
            
            {/* Left: Text Content */}
            <motion.div
              className="flex flex-col justify-center items-center md:items-start max-w-xl flex-1 text-center md:text-left"
              variants={containerVariants}
            >
              <motion.h2
                className="text-3xl font-bold text-[#181818] mb-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
                variants={itemVariants}
              >
                Meet PawPal
              </motion.h2>
              <motion.h3
                className="text-xl text-[#181818] mb-4 md:mb-6"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                variants={itemVariants}
              >
                Your 24/7 Pet Care Assistant
              </motion.h3>
              <motion.p
                className="text-base md:text-xl text-[#181818] mb-8 leading-relaxed max-w-sm md:max-w-none"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
                variants={itemVariants}
              >
                Get instant answers to your pet care questions, check symptoms, and receive
                guidance on when to visit our clinic. PawPal is here to help you provide the best care for
                your furry friends.
              </motion.p>
              
              {/* Desktop Button (Hidden on Mobile) */}
              <motion.button
                className="hidden md:block bg-[#7e57c2] text-white rounded-[8px] px-7 py-2 text-[15px] font-semibold shadow mb-6 transition-colors"
                style={{ fontFamily: "'Inter', sans-serif", minWidth: 170 }}
                onClick={() => navigate("/petowner/login")}
                whileHover={{ scale: 1.1, backgroundColor: "#815fb3" }}
                whileTap={{ scale: 0.95 }}
                variants={itemVariants}
              >
                ACCESS PAWPAL
              </motion.button>
            </motion.div>

            {/* Right: Chat Preview UI (Card Look) */}
            <motion.div
              className="bg-[#F2F0E9] md:bg-white rounded-[24px] md:rounded-[16px] flex flex-row md:flex-col p-5 md:p-8 border border-transparent md:border-[#e0d7f7] w-full max-w-sm md:max-w-lg h-auto md:h-[350px] shadow-lg md:shadow-xl items-center md:items-start justify-start gap-4"
              variants={itemVariantsRight}
            >
               {/* Mobile Layout for Chat Card: Icon on Left, Bubbles on Right */}
               <div className="flex flex-row md:flex-col w-full h-full gap-4 md:gap-4 items-center md:items-start">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                     <img src="/pat-removebg-preview 1.png" alt="PawPal Icon" className="w-16 h-16 object-contain" />
                  </div>

                  {/* Chat Bubbles Container */}
                  <div className="flex flex-col gap-2 flex-grow w-full">
                      {/* Bubble 1 */}
                      <div className="bg-[#cec3e8] md:bg-[#B192DF] md:bg-opacity-50 rounded-2xl rounded-tl-none md:rounded-tl-none px-3 py-2 md:px-4 md:py-3 text-xs md:text-[15px] text-[#181818] w-full">
                        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                          Hi there! I&apos;m PawPal, your virtual pet care assistant. How can I help you and your furry friend today?
                        </span>
                      </div>
                      {/* Bubble 2 */}
                      <div className="bg-[#cec3e8] md:bg-[#B192DF] md:bg-opacity-50 rounded-2xl rounded-tl-none md:rounded-tl-none px-3 py-2 md:px-4 md:py-3 text-xs md:text-[15px] text-[#181818] w-full">
                         <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                            I can answer questions about pet care, help you identify symptoms, and let you know when it&apos;s time to see a vet.
                         </span>
                      </div>
                       {/* Bubble 3 (Gray) */}
                      <div className="bg-[#dcdcdc] md:bg-[#B6ADC4] md:bg-opacity-50 rounded-2xl rounded-tl-none md:rounded-tl-none px-3 py-2 md:px-4 md:py-3 text-xs md:text-[15px] text-[#666] w-full italic md:not-italic">
                         <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                            Please log in to start a conversation with PawPal and access personalized advice for your pets.
                         </span>
                      </div>
                  </div>
               </div>
            </motion.div>
            
            {/* Mobile Button (Visible only on Mobile, below the card) */}
            <motion.button
              className="md:hidden bg-[#7e57c2] text-white rounded-[8px] px-7 py-3 text-[15px] font-semibold shadow mt-2 transition-colors w-full max-w-xs"
              style={{ fontFamily: "'Inter', sans-serif" }}
              onClick={() => navigate("/petowner/login")}
              whileTap={{ scale: 0.95 }}
              variants={itemVariants}
            >
              ACCESS PAWPAL
            </motion.button>

          </div>

          {/* --- LOGIN/REGISTER INFO --- */}
          <div className="w-full flex justify-center items-end mt-8 mb-2">
            <motion.p
              className="text-xs md:text-sm lg:text-base text-[#444] leading-relaxed text-center px-2"
              style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800 }}
              variants={itemVariants}
            >
              Already have an account?{" "}
              <a href="/petowner/login" className="text-[#7e57c2] underline hover:no-underline">
                Login
              </a>{" "}
              to access your pet&apos;s personalized care recommendations and history.
              <br />
              New users can{" "}
              <a href="/petowner/register" className="text-[#7e57c2] underline hover:no-underline">
                sign up for free
              </a>{" "}
              with your email address.
            </motion.p>
          </div>
        </motion.section>

        {/* How can PawPal help you? Section */}
        <motion.section
          id="help"
          // FIXED: Added overflow-hidden
          className="w-full min-h-screen snap-start flex flex-col items-center justify-center bg-[#e5d9f6] px-4 py-20 md:py-0 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.3 }}
        >
          <motion.h2
            className="text-[32px] font-bold text-[#181818] mb-2 text-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
            variants={itemVariants}
          >
            How can PawPal help you?
          </motion.h2>
          <motion.span
            className="text-[18px] text-[#666] mb-10 text-center max-w-2xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
            variants={itemVariants}
          >
            PawPal is designed to assist with all aspects of pet care, from
            health concerns to behavior training and daily needs.
          </motion.span>
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full max-w-5xl justify-center items-stretch mt-2 px-2 md:px-0">
            {/* Card 1: What's normal for my pet? */}
            <motion.div
              className="bg-[#f3e6fa] rounded-[16px] shadow flex flex-col items-start p-6 md:p-8 w-full max-w-xs min-h-[180px] md:min-h-[380px] gap-4"
              whileHover={cardHover}
              variants={itemVariants}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <img 
                src="/wnfmp.png" 
                alt="Normal for pet icon" 
                className="w-8 h-8 md:w-10 md:h-10 object-contain" 
              />
              <h3 className="text-lg md:text-xl font-bold text-[#181818]">
                What&apos;s normal for my pet?
              </h3>
              <p className="text-sm md:text-[15px] text-[#444] leading-relaxed">
                Learn about typical behaviors, habits, diet, and health patterns specific to
                your pet&apos;s breed, age, and species. Perfect for new pet owners and those
                seeking to better understand their companion.
              </p>
            </motion.div>

            {/* Card 2: Symptom Checker */}
            <motion.div
              className="bg-[#fff8e1] rounded-[16px] shadow flex flex-col items-start p-6 md:p-8 w-full max-w-xs min-h-[180px] md:min-h-[380px] gap-4"
              whileHover={cardHover}
              variants={itemVariants}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <img 
                src="/sc.png" 
                alt="Symptom checker icon" 
                className="w-8 h-8 md:w-10 md:h-10 object-contain" 
              />
              <h3 className="text-lg md:text-xl font-bold text-[#181818]">
                Symptom Checker
              </h3>
              <p className="text-sm md:text-[15px] text-[#444] leading-relaxed">
                Describe your pet&apos;s symptoms and receive guidance on potential
                causes, when to see a vet, and home care recommendations. Note
                that this is not a replacement for professional veterinary care.
              </p>
            </motion.div>

            {/* Card 3: Pet Health Records */}
            <motion.div
              className="bg-[#e6f7ef] rounded-[16px] shadow flex flex-col items-start p-6 md:p-8 w-full max-w-xs min-h-[180px] md:min-h-[380px] gap-4"
              whileHover={cardHover}
              variants={itemVariants}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <img 
                src="/phr.png" 
                alt="Pet health records icon" 
                className="w-8 h-8 md:w-10 md:h-10 object-contain" 
              />
              <h3 className="text-lg md:text-xl font-bold text-[#181818]">
                Pet Profiles
              </h3>
              <p className="text-sm md:text-[15px] text-[#444] leading-relaxed">
                Keep track of vaccinations, medications, vet visits, and
                health milestones all in one place. Use your pet’s profile to provide context and improve the chatbot’s guidance.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Find Us Section */}
        <motion.section
          id="find-us"
          // FIXED: Added overflow-hidden
          className="w-full min-h-screen snap-start flex flex-col items-center justify-center bg-[#ede9f7] px-4 py-20 md:py-0 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.3 }}
        >
          <motion.h2
            className="text-[32px] font-bold text-[#181818] mb-2 text-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
            variants={itemVariants}
          >
            Find Us
          </motion.h2>
          <motion.span
            className="text-[18px] text-[#181818] mb-10 text-center max-w-2xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
            variants={itemVariants}
          >
            Visit our clinic or reach out to us through any of these channels
          </motion.span>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-6xl justify-center items-stretch mt-2 px-2 md:px-0">
            
            {/* Left: Contact Cards */}
            <motion.div
              className="flex flex-col gap-4 md:gap-6 min-w-[0] flex-1"
              variants={itemVariantsLeft}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Contact Information Card */}
              <div className="bg-white rounded-[16px] p-5 flex flex-col gap-4 shadow-xl border border-[#f0f0f0]">
                <h3 className="font-bold text-[18px] text-[#181818]">Contact Information</h3>
                
                <div className="flex items-start gap-3">
                    <img src="/location.png" alt="Location" className="w-5 h-5 mt-1 object-contain" />
                    <p className="text-[15px] text-[#333] leading-snug">
                        A. Gomez, National Highway,<br/>
                        Balibago, Sta. Rosa, Laguna, Sta.<br/>
                        Rosa, Philippines
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <img src="/phone.png" alt="Phone" className="w-5 h-5 object-contain" />
                    <p className="text-[15px] text-[#333]">
                        0928 960 7250
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <img src="/email.png" alt="Email" className="w-5 h-5 object-contain" />
                    <p className="text-[15px] text-[#333]">
                        southvalleyvc20@gmail.com
                    </p>
                </div>
              </div>

              {/* Hours of Operation Card */}
              <div className="bg-white rounded-[16px] p-5 flex flex-col gap-4 shadow-xl border border-[#f0f0f0] flex-1 justify-center">
                 <h3 className="font-bold text-[18px] text-[#181818]">Hours of Operation</h3>
                 <div className="flex-1 flex items-center justify-center py-4">
                    <p className="text-[22px] font-bold text-[#815FB3] text-center">
                        WE&apos;RE OPEN 24/7
                    </p>
                 </div>
              </div>
            </motion.div>

            {/* Right: Map Iframe */}
            <motion.div
              className="bg-white rounded-[16px] shadow-2xl p-2 md:p-4 flex items-center justify-center w-full flex-[2] h-[250px] md:h-auto md:min-h-[400px] border border-[#e0d7f7]"
              variants={itemVariantsRight}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
               <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3574.2290657315452!2d121.10229307510033!3d14.299324186152049!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d84a34442c39%3A0x80367b1473a9f954!2sSouthvalley%20Veterinary%20Clinic!5e1!3m2!1sen!2sph!4v1763568682095!5m2!1sen!2sph" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-[10px]"
                  title="Clinic Location Map"
                ></iframe>
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="w-full bg-[#7e57c2] pt-12 pb-8 px-4 md:px-10 snap-start font-['Inter',sans-serif] text-white">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10 mb-8">
                {/* Left Column */}
                <div className="flex flex-col items-start max-w-lg">
                      <h3 className="font-extrabold text-2xl uppercase tracking-wide mb-4 font-['Poppins',sans-serif] text-[#FFF4C9]">
                        SOUTHVALLEY VETERINARY CLINIC
                      </h3>
                      <p className="text-[15px] leading-relaxed mb-6 opacity-90">
                        We take satisfaction in our optimal veterinary services designed to consistently provide for you and your pet companion.
                      </p>

                      <div className="flex items-center gap-4">
                        {/* Socials */}
                        <a href="https://facebook.com/southvalleyvc" target="_blank" rel="noopener noreferrer">
                          <img src="/facebook.png" alt="fb" className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" />
                        </a>
                        <a href="https://www.instagram.com/southvalleyveterinary/" target="_blank" rel="noopener noreferrer">
                          <img src="/instagram.png" alt="ig" className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" />
                        </a>
                        <a href="https://www.tiktok.com/@southvalleyvetclinic" target="_blank" rel="noopener noreferrer">
                          <img src="/tiktok.png" alt="tiktok" className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity" />
                        </a>
                      </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col items-start md:items-start gap-3">
                    <h4 className="text-lg font-medium mb-1 text-[#e0d7f7]">Legal</h4>
                    <button
                      type="button"
                      className="text-[15px] hover:underline hover:text-gray-200 transition-colors bg-transparent p-0 m-0 outline-none border-none cursor-pointer"
                      onClick={() => setShowPrivacyPolicy(true)}
                    >
                      Privacy Policy
                    </button>
                    <button
                      type="button"
                      className="text-[15px] hover:underline hover:text-gray-200 transition-colors bg-transparent p-0 m-0 outline-none border-none cursor-pointer"
                      onClick={() => setShowTermsOfService(true)}
                    >
                      Terms of Service
                    </button>
                </div>
            </div>

            {/* Divider Line */}
            <div className="w-full h-[1px] bg-white opacity-20 mb-6"></div>

            {/* Copyright */}
            <div className="text-center text-sm opacity-80">
                © 2025 PuyaTechs. All rights reserved.
            </div>
        </footer>
                  {/* Privacy Policy Modal */}
                  {showPrivacyPolicy && (
                    <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
                  )}
                  {/* Terms of Service Modal */}
                  {showTermsOfService && (
                    <TermsOfService onClose={() => setShowTermsOfService(false)} />
                  )}
            {/* Privacy Policy Modal */}
            {showPrivacyPolicy && (
              <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
            )}
      </main>
    </div>
  );
}
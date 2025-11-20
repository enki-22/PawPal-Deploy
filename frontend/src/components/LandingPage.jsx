import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import PromotionCarousel from "./PromotionCarousel";

export default function LandingPage() {
  const navigate = useNavigate();
  // Auth redirect logic
  const { user } = require('../context/AuthContext'); // Note: Ensure this path is correct for your file structure
  // Redirect on mount
  React.useEffect(() => {
    if (user) {
      navigate('/chat/new', { replace: true });
    }
  }, [user, navigate]);


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
      image: "/Frame 56.png"
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
    const stored = localStorage.getItem('pawpal_promotions');
    if (stored) {
      setPromotions(JSON.parse(stored));
    } else {
      localStorage.setItem('pawpal_promotions', JSON.stringify(DEFAULT_PROMOTIONS));
      setPromotions(DEFAULT_PROMOTIONS);
    }
  }, [DEFAULT_PROMOTIONS]);

  // --- HELPER: SCROLL TO SECTION ---
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    // 2. Main container is now a fixed h-screen viewport
  <div className="bg-[#f7f6fa] w-full h-screen flex flex-col relative">
      {/* 3. Header is now 'absolute' to overlay the scrolling content */}
      <div
        className="w-full bg-white h-[56px] flex items-center justify-between px-4 md:px-8 shadow z-50 absolute top-0 left-0"
        data-name="Container"
      >
        <span
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 900,
            fontSize: 20,
            color: "#815FB3",
            letterSpacing: 1,
          }}
          className="truncate max-w-[200px] lg:max-w-none cursor-pointer"
          onClick={() => scrollToSection('home')} // Clicking logo goes to top
        >
          SOUTHVALLEY VETERINARY CLINIC
        </span>

        {/* --- NEW: MIDDLE NAVIGATION LINKS --- */}
        {/* Hidden on small screens, visible on larger screens */}
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

        {/* Buttons Container */}
  <div className="flex items-center gap-2 md:gap-4">
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
      </div>

      {/* 4. This 'main' element is now the scroll container */}
  <main className="flex-1 w-full h-screen overflow-y-auto snap-y snap-mandatory">
        
        {/* Hero Section - UPDATED */}
        <motion.section
          id="home"
          className="w-full min-h-screen snap-start flex flex-col items-center justify-center bg-[#ede9f7] pt-[56px] relative overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.5 }}
        >
          {/* Wave SVG Background - Absolute Bottom */}
          <div className="absolute bottom-0 left-0 w-full z-0">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto block">
                <path fill="#ffffff" fillOpacity="1" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,224C840,245,960,267,1080,261.3C1200,256,1320,224,1380,208L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
              </svg>
          </div>

          {/* Main Content Container 
              Using items-stretch to help position columns, but we will control vertical alignment per column 
          */}
          <div className="flex flex-col md:flex-row justify-between gap-4 w-full max-w-[95%] px-4 z-10 h-[calc(100vh-56px)]">
            
            {/* Left: Big Logo - Vertically Centered */}
            <motion.div 
                className="w-full md:w-[33%] flex justify-center md:justify-center items-center -mt-32"
                variants={itemVariantsLeft}
            >
                <img
                    src="/96d78afd-a196-47fc-870d-409b03dedb90-removebg-preview 1.png"
                    alt="Southvalley 24h Logo"
                    className="w-[280px] md:w-full max-w-[500px] object-contain"
                />
            </motion.div>

            {/* Middle: Text Content - Pushed Up */}
            <motion.div 
                // Added self-center but negative margin top to push it "way up"
                className="w-full md:w-[33%] flex flex-col items-center md:items-start text-center md:text-left self-center md:-mt-32"
                variants={itemVariants}
            >
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight font-['Inter',sans-serif] text-[#181818]">
                    Caring for your <br/>
                    <span className="text-[#a60da6]">furry family members</span>
                </h1>
                <p className="text-base md:text-lg text-[#333] font-['Inter',sans-serif] leading-relaxed max-w-md">
                    Southvalley Veterinary Clinic provides compassionate, 
                    comprehensive care for your pets. 
                    From preventive care to specialized treatments, 
                    we&apos;re here for every stage of your pet&apos;s life.
                </p>
            </motion.div>

            {/* Right: Pets Image - Lower and Bigger */}
            <motion.div 
                // items-end to push to bottom. translate-y to push it onto the wave.
                className="w-full md:w-[33%] flex justify-center md:justify-end items-end pb-0 md:pb-0 -mt-16"
                variants={itemVariantsRight}
            >
                 <img
                    src="/0392691c88db5749efd321d633a8a9e8 1.png"
                    alt="Cute pets"
                    // Scale up and translate down to sit on the line
                    className="w-[300px] md:w-full max-w-[650px] object-contain drop-shadow-xl transform md:translate-y-12 lg:translate-y-16 scale-110 origin-bottom" 
                />
            </motion.div>

          </div>
        </motion.section>

        {/* Promotions Section - Carousel */}
        <motion.section
          id="promotions"
          className="w-full h-screen snap-start flex flex-col items-center justify-center bg-[#FFFFFF] px-4 pt-20 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.3 }}
        >
          <motion.h2
            className="text-3xl font-bold text-[#181818] mb-2 text-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
            variants={itemVariants}
          >
            Special Promotions
          </motion.h2>
          <motion.span
            className="text-lg text-[#666] mb-4 text-center max-w-xl"
            style={{ fontFamily: "'Inter', sans-serif" }}
            variants={itemVariants}
          >
            Check out our current special offers and announcements.
          </motion.span>

          {/* WRAPPED IN MOTION.DIV WITH ITEM VARIANTS */}
          <motion.div 
            className="w-full flex justify-center"
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
          className="w-full h-screen snap-start flex flex-col items-center justify-center bg-[#f8eedc] border-t border-b border-[#e0d7f7] px-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.3 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full max-w-6xl px-2 md:px-0">
            {/* Left: Text Content - Nested stagger */}
            <motion.div
              className="flex flex-col justify-center items-start max-w-xl flex-1"
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
                className="text-xl text-[#181818] mb-6"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                variants={itemVariants}
              >
                Your 24/7 Pet Care Assistant
              </motion.h3>
              <motion.p
                className="text-xl text-[#181818] mb-8"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
                variants={itemVariants}
              >
                Get instant answers to your pet care<br />
                questions, check symptoms, and receive<br />
                guidance on when to visit our clinic. PawPal<br />
                is here to help you provide the best care for<br />
                your furry friends.
              </motion.p>
              <motion.button
                className="bg-[#7e57c2] text-white rounded-[8px] px-7 py-2 text-[15px] font-semibold shadow mb-6 transition-colors"
                style={{ fontFamily: "'Inter', sans-serif", minWidth: 170 }}
                onClick={() => navigate("/petowner/login")}
                whileHover={{ scale: 1.1, backgroundColor: "#815fb3" }}
                whileTap={{ scale: 0.95 }}
                variants={itemVariants}
              >
                ACCESS PAWPAL
              </motion.button>
            </motion.div>
            {/* Right: Chat Preview UI - Spacer alignment method */}
            <motion.div
              className="bg-white rounded-[16px] flex flex-col p-4 md:p-8 border border-[#e0d7f7] w-full max-w-md md:max-w-lg h-auto md:h-[350px] shadow-xl items-start justify-start gap-4"
              variants={itemVariantsRight}
            >
              {/* PawPal Chat Bubble 1 */}
              <div className="flex items-start gap-2 w-full">
                <img src="/pat-removebg-preview 2.png" alt="PawPal Icon" className="w-16 h-16 object-contain flex-shrink-0" />
                <div className="bg-[#B192DF] bg-opacity-50 rounded-tl-none rounded-2xl px-4 py-3 text-[15px] text-[#181818] relative flex-grow min-h-[88px]">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    Hi there! I&apos;m PawPal, your virtual pet care assistant. How can I help you and your furry friend today?
                  </span>
                </div>
              </div>
              {/* PawPal Chat Bubble 2 (spacer method) */}
              <div className="flex items-start gap-2 w-full">
                <div className="w-16 h-16 flex-shrink-0"></div>
                <div className="bg-[#B192DF] bg-opacity-50 rounded-tl-none rounded-2xl px-4 py-3 text-[15px] text-[#181818] relative flex-grow min-h-[88px]">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    I can answer questions about pet care, help you identify symptoms, and let you know when it&apos;s time to see a vet.
                  </span>
                </div>
              </div>
              {/* "Please log in" bubble (spacer method) */}
              <div className="flex items-start gap-2 w-full">
                <div className="w-16 h-16 flex-shrink-0"></div>
                <div className="bg-[#B6ADC4] bg-opacity-50 rounded-tl-none rounded-2xl px-4 py-3 text-[15px] text-[#666] relative flex-grow min-h-[88px] max-w-[80%]">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                    Please log in to start a conversation with PawPal and access personalized advice for your pets.
                  </span>
                </div>
              </div>
              {/* No input field */}
            </motion.div>
          </div>
          {/* --- LOGIN/REGISTER INFO: now relative, inside flex container --- */}
          <div className="w-full flex justify-center items-end mt-8 mb-2">
            <motion.p
              className="text-sm md:text-base text-[#444] leading-relaxed text-center px-2"
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
          className="w-full h-screen snap-start flex flex-col items-center justify-center bg-[#e5d9f6] px-4"
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
                Pet Health Records
              </h3>
              <p className="text-sm md:text-[15px] text-[#444] leading-relaxed">
                Keep track of vaccinations, medications, vet visits, and
                health milestones all in one place. Set reminders for upcoming
                appointments and medication schedules.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Find Us Section - UPDATED */}
        <motion.section
          id="find-us"
          // SIZING FIXED: Changed from max-w-[80%] to max-w-6xl for better containment
          className="w-full h-screen snap-start flex flex-col items-center justify-center bg-[#ede9f7] px-4"
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
          
          {/* GRID CONTAINER: Fixed max-w-6xl to prevent it from being too wide */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-6xl justify-center items-stretch mt-2 px-2 md:px-0">
            
            {/* Left: Contact Cards */}
            <motion.div
              className="flex flex-col gap-4 md:gap-6 min-w-[0] flex-1"
              variants={itemVariantsLeft}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Contact Information Card - Slightly smaller padding/fonts */}
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

            {/* Right: Map Iframe - HEIGHT REDUCED */}
            <motion.div
              className="bg-white rounded-[16px] shadow-2xl p-2 md:p-4 flex items-center justify-center w-full flex-[2] min-h-[280px] md:min-h-[400px] border border-[#e0d7f7]"
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

        {/* Footer - REDESIGNED */}
        {/* 7. Footer is the last snap point. It won't be h-screen, just its own content height. */}
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
                        {/* Socials - placeholder icons */}
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
                    <a href="#" className="text-[15px] hover:underline hover:text-gray-200 transition-colors">Privacy Policy</a>
                    <a href="#" className="text-[15px] hover:underline hover:text-gray-200 transition-colors">Terms of Service</a>
                </div>
            </div>

            {/* Divider Line */}
            <div className="w-full h-[1px] bg-white opacity-20 mb-6"></div>

            {/* Copyright */}
            <div className="text-center text-sm opacity-80">
                © 2025 PuyaTechs. All rights reserved.
            </div>
        </footer>
      </main>
    </div>
  );
}
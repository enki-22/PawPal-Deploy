import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();
  // Auth redirect logic
  const { user } = require('../context/AuthContext');
  // Redirect on mount
  React.useEffect(() => {
    if (user) {
      navigate('/chat/new', { replace: true });
    }
  }, [user, navigate]);


  // --- NEW ANIMATION VARIANTS ---
  // A. Container variant: orchestrates staggering of children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // B. Child item variant: Default slide-up + fade-in
  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // C. Child item variant: Slide-from-left
  const itemVariantsLeft = {
    hidden: { opacity: 0, x: -100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // D. Child item variant: Slide-from-right
  const itemVariantsRight = {
    hidden: { opacity: 0, x: 100 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // E. Card hover (unchanged)
  const cardHover = {
    scale: 1.05,
    boxShadow: "0px 10px 30px -5px rgba(0, 0, 0, 0.1)",
    transition: { type: "spring", stiffness: 300 },
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
          className="truncate max-w-[60vw] md:max-w-none"
        >
          SOUTHVALLEY VETERINARY CLINIC
        </span>
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
        {/* Hero Section */}
        <motion.section
          className="w-full min-h-screen snap-start flex flex-col items-center justify-center bg-[#ede9f7] pt-[56px]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ amount: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 w-full max-w-5xl px-2 md:px-4">
            <motion.img
              src="/194911935_109537641352555_8380857820585025274_n 1.png"
              alt="Southvalley Veterinary Clinic Logo"
              className="w-full max-w-xs md:max-w-md lg:max-w-lg h-auto object-contain rounded-[12px]"
              variants={itemVariantsLeft}
            />
            <motion.div
              className="flex flex-col justify-center items-start"
              variants={itemVariantsRight}
            >
              <div className="mb-4 min-w-[0]">
                <span
                  className="text-3xl md:text-5xl font-bold leading-none block"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: "#181818" }}
                >
                  Caring for your
                </span>
                <span
                  className="text-3xl md:text-5xl font-bold leading-none block whitespace-nowrap"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: "#a60da6" }}
                >
                  furry family members
                </span>
              </div>
              <span
                className="text-base md:text-xl text-[#181818]"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
              >
                Southvalley Veterinary Clinic provides<br />
                compassionate, comprehensive care for your pets.<br />
                From preventive care to specialized treatments,<br />
                we&apos;re here for every stage of your pet&apos;s life.
              </span>
            </motion.div>
          </div>
        </motion.section>

        {/* Promotions Section */}
        <motion.section
          className="w-full h-screen snap-start flex flex-col items-center justify-center bg-[#ede9f7] px-4 pt-20"
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
              className="text-lg text-[#666] mb-10 text-center max-w-xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
              variants={itemVariants}
            >
              Check out our current special offers and promotions to help
              you save while providing the best care for your pets.
            </motion.span>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-6xl justify-center items-stretch">
            {/* Card 1 */}
            <motion.div
              className="bg-white rounded-[18px] shadow flex flex-col items-stretch p-0 w-full max-w-xs md:max-w-sm min-h-[320px] md:min-h-[480px] border border-[#e0d7f7]"
              whileHover={cardHover}
              variants={itemVariants}
            >
              <img
                alt="Low cost vaccination promotion"
                src="/Frame 56.png"
                className="rounded-t-[18px] w-full h-[140px] md:h-[240px] object-contain bg-[#f7f6fa]"
              />
              <div className="p-5 flex flex-col flex-1">
                <h3
                  className="font-bold text-[18px] text-[#181818] mb-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Low Cost Bakuna
                </h3>
                <p
                  className="text-[15px] text-[#181818] mb-4"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
                >
                  Affordable care, peace of mind, protection that&apos;s easy to
                  find. Safe, simple, and budget-wise, Your pet&apos;s health
                  matters&mdash;immunize!
                </p>
                <div className="flex-1"></div>
                <button
                  className="bg-[#a084e8] text-white rounded-[8px] px-4 py-2 text-[15px] font-semibold shadow self-end mt-2 hover:bg-[#815fb3] transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Read More
                </button>
              </div>
            </motion.div>
            
            {/* Card 2 */}
            <motion.div
              className="bg-white rounded-[18px] shadow flex flex-col items-stretch p-0 w-full max-w-xs md:max-w-sm min-h-[320px] md:min-h-[480px] border border-[#e0d7f7]"
              whileHover={cardHover}
              variants={itemVariants}
            >
              <img
                alt="Low cost kapon promotion"
                src="/low cost kapon.png"
                className="rounded-t-[18px] w-full h-[140px] md:h-[240px] object-contain bg-[#f7f6fa]"
              />
              <div className="p-5 flex flex-col flex-1">
                 <h3
                  className="font-bold text-[18px] text-[#181818] mb-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Low Cost Kapon
                </h3>
                <p
                  className="text-[15px] text-[#181818] mb-4"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
                >
                  Affordable spay and neuter services now available in
                  Southvalley! ...
                </p>
                 <div className="flex-1"></div>
                 <button
                  className="bg-[#a084e8] text-white rounded-[8px] px-4 py-2 text-[15px] font-semibold shadow self-end mt-2 hover:bg-[#815fb3] transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Read More
                </button>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              className="bg-white rounded-[18px] shadow flex flex-col items-stretch p-0 w-full max-w-xs md:max-w-sm min-h-[320px] md:min-h-[480px] border border-[#e0d7f7]"
              whileHover={cardHover}
              variants={itemVariants}
            >
              <img
                alt="Holy Week Advisory promotion"
                src="/holy week advisory.png"
                className="rounded-t-[18px] w-full h-[140px] md:h-[240px] object-contain bg-[#f7f6fa]"
              />
              <div className="p-5 flex flex-col flex-1">
                <h3
                  className="font-bold text-[18px] text-[#181818] mb-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Holy Week Advisory
                </h3>
                <p
                  className="text-[15px] text-[#181818] mb-4"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
                >
                  In observance of Holy Week, please take note of our adjusted
                  clinic hours. Kindly plan your visits ahead of time...
                </p>
                <div className="flex-1"></div>
                 <button
                  className="bg-[#a084e8] text-white rounded-[8px] px-4 py-2 text-[15px] font-semibold shadow self-end mt-2 hover:bg-[#815fb3] transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Read More
                </button>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Meet PawPal Section */}
        <motion.section
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
            {/* Card 1 */}
            <motion.div
              className="bg-[#f3e6fa] rounded-[16px] shadow flex flex-col items-start p-4 md:p-7 w-full max-w-xs min-h-[180px] md:min-h-[280px]"
              whileHover={cardHover}
              variants={itemVariants}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* ... card content ... */}
            </motion.div>
            {/* Card 2 */}
            <motion.div
              className="bg-[#fff8e1] rounded-[16px] shadow flex flex-col items-start p-4 md:p-7 w-full max-w-xs min-h-[180px] md:min-h-[280px]"
              whileHover={cardHover}
              variants={itemVariants}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* ... card content ... */}
            </motion.div>
            {/* Card 3 */}
            <motion.div
              className="bg-[#e6f7ef] rounded-[16px] shadow flex flex-col items-start p-4 md:p-7 w-full max-w-xs min-h-[180px] md:min-h-[280px]"
              whileHover={cardHover}
              variants={itemVariants}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* ... card content ... */}
            </motion.div>
          </div>
        </motion.section>

        {/* Find Us Section */}
        <motion.section
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
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full max-w-6xl justify-center items-stretch mt-2 px-2 md:px-0">
            {/* Left: Cards */}
            <motion.div
              className="flex flex-col gap-4 md:gap-6 min-w-[0] flex-1 max-w-xs md:max-w-[340px]"
              variants={itemVariantsLeft}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* ... contact cards ... */}
            </motion.div>
            {/* Right: Map Placeholder */}
            <motion.div
              className="bg-white rounded-[16px] shadow-lg p-2 md:p-4 flex items-center justify-center w-full max-w-md min-h-[180px] md:min-w-[420px] md:min-h-[340px] border border-[#e0d7f7]"
              variants={itemVariantsRight}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <img
                src="/map.png"
                alt="Map placeholder"
                className="rounded-[10px] w-full h-auto max-w-xs md:max-w-lg md:h-[340px] object-cover"
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Footer */}
        {/* 7. Footer is the last snap point. It won't be h-screen, just its own content height. */}
  <footer className="w-full bg-[#8d6dc4] pt-6 pb-2 px-4 md:px-8 snap-start">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-2">
            {/* ... footer content ... */}
          </div>
          <hr className="border-t border-[#fff59d] my-4" />
          <div
            className="text-left text-[#fff] text-[15px] pl-1"
            style={{ fontFamily: "Inter" }}
          >
            © 2025 PuyaTechs. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
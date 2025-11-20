
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function PromotionCarousel({ promotions }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPromo, setSelectedPromo] = useState(null); // State for the expanded modal

  // Use callback to stable the function reference for useEffect
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % promotions.length);
  }, [promotions.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
  }, [promotions.length]);

  // Auto-move every 5 seconds (Only if modal is NOT open)
  useEffect(() => {
    if (!selectedPromo) {
      const interval = setInterval(() => {
        handleNext();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [handleNext, selectedPromo]);

  // Calculate indices
  const getIndex = (offset) => {
    return (currentIndex + offset + promotions.length) % promotions.length;
  };

  const visiblePromos = [
    { ...promotions[getIndex(-1)], position: 'left' },
    { ...promotions[getIndex(0)], position: 'center' },
    { ...promotions[getIndex(1)], position: 'right' },
  ];

  // ANIMATION VARIANTS FOR CAROUSEL
  const variants = {
    center: { 
      x: 0, scale: 1.1, opacity: 1, zIndex: 10, filter: "blur(0px)",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    left: { 
      x: -300, scale: 0.85, opacity: 0.6, zIndex: 5, filter: "blur(1px)", 
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    right: { 
      x: 300, scale: 0.85, opacity: 0.6, zIndex: 5, filter: "blur(1px)", 
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  return (
    <div className="relative w-full max-w-[1000px] h-[500px] flex items-center justify-center mx-auto">
      {/* Left Arrow */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 md:left-0 z-30 bg-white p-3 rounded-full shadow-lg hover:bg-[#f3e6fa] text-[#815FB3] transition-all"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Carousel Area */}
      <div className="relative w-full h-full flex items-center justify-center perspective-1000">
        <AnimatePresence initial={false} mode='popLayout'>
          {visiblePromos.map((promo) => {
            // Safely access styles with defaults for the thumbnail view
            const zoom = promo.style?.zoom || 1;
            const posX = promo.style?.posX ?? 50;
            const posY = promo.style?.posY ?? 50;
            const isSide = promo.position === 'left' || promo.position === 'right';

            // Helper to handle clicks on the cards themselves
            const handleCardClick = (position) => {
              if (position === 'left') {
                handlePrev();
              } else if (position === 'right') {
                handleNext();
              }
              // Center card click does nothing here (handled by Read More button)
            };

            return (
              <motion.div
                key={promo.id}
                layout
                initial={promo.position}
                animate={promo.position}
                variants={variants}
                onClick={() => handleCardClick(promo.position)}
                className="absolute bg-white rounded-[18px] shadow-2xl flex flex-col overflow-hidden border border-[#e0d7f7]"
                style={{ 
                  width: '320px', 
                  minHeight: '440px', 
                  transformOrigin: "center center",
                  cursor: isSide ? 'pointer' : 'default'
                }}
              >
                 {/* Thumbnail Image Container (4:3 Aspect Ratio) */}
                <div className="w-full aspect-[4/3] bg-[#f0ebf8] relative overflow-hidden pointer-events-none">
                  {/* pointer-events-none on image ensures the click passes to the card wrapper */}
                  <img
                    src={promo.image}
                    alt={promo.title}
                    className="w-full h-full object-contain"
                    style={{
                      transform: `scale(${zoom})`,
                      objectPosition: `${posX}% ${posY}%`
                    }}
                  />
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-bold text-[20px] text-[#181818] mb-2 font-['Inter',sans-serif]">
                    {promo.title}
                  </h3>
                  <p className="text-[14px] text-[#555] mb-4 font-['Inter',sans-serif] line-clamp-3 leading-relaxed">
                    {promo.description}
                  </p>
                  <div className="flex-1"></div>
                  {/* Only show button interaction if it's the center card, or disable pointer events on sides so card click takes precedence */}
                  <button 
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering card click
                        if (promo.position === 'center') setSelectedPromo(promo);
                    }} 
                    className={`bg-[#a084e8] text-white rounded-[8px] px-6 py-2.5 text-[15px] font-semibold shadow-md self-end mt-2 transition-colors ${
                        promo.position === 'center' ? 'hover:bg-[#815FB3] cursor-pointer' : 'opacity-50 cursor-default'
                    }`}
                  >
                    Read More
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Right Arrow */}
      <button 
        onClick={handleNext}
        className="absolute right-4 md:right-0 z-30 bg-white p-3 rounded-full shadow-lg hover:bg-[#f3e6fa] text-[#815FB3] transition-all"
      >
        <ChevronRight size={24} />
      </button>

      {/* --- EXPANDED POP-OUT MODAL --- */}
      <AnimatePresence>
        {selectedPromo && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={() => setSelectedPromo(null)} // Close on backdrop click
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
                >
                    {/* Close Button */}
                    <button 
                        onClick={() => setSelectedPromo(null)}
                        className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Left: Full Image Area */}
                    {/* We use object-contain here so the FULL flyer is visible regardless of thumbnail zoom settings */}
                    <div className="w-full md:w-1/2 bg-[#f3e6fa] flex items-center justify-center p-4 min-h-[300px]">
                        <img 
                            src={selectedPromo.image} 
                            alt={selectedPromo.title} 
                            className="w-full h-full object-contain max-h-[80vh] rounded-lg shadow-sm"
                        />
                    </div>

                    {/* Right: Content Area */}
                    <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col overflow-y-auto">
                        <h2 className="text-3xl font-bold text-[#181818] mb-4 font-['Inter',sans-serif] text-[#815FB3]">
                            {selectedPromo.title}
                        </h2>
                        <div className="w-16 h-1 bg-[#a084e8] mb-6 rounded-full"></div>
                        <p className="text-lg text-[#444] leading-relaxed font-['Inter',sans-serif] whitespace-pre-wrap">
                            {selectedPromo.description}
                        </p>
                        
                        <div className="flex-1"></div>
                        
                        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-2">
                            <p className="text-sm text-gray-500 italic">
                                Visit Southvalley Veterinary Clinic or contact us for more details.
                            </p>
                            <button 
                                onClick={() => setSelectedPromo(null)}
                                className="self-start mt-2 text-[#815FB3] font-semibold hover:underline"
                            >
                                ← Back to Promotions
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

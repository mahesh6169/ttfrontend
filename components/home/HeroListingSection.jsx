'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTshirt, FaCar, FaStore, FaCouch, FaMobileAlt, FaHome, FaBroom, FaTools } from 'react-icons/fa';

const HeroListingSection = ({ messages = [] }) => {
  const [currentMessage, setCurrentMessage] = useState(0);

  const defaultMessages = [
    "Advertise for FREE and get discovered",
    "Find local services near you",
    "Get connected on private chat"
  ];

  const displayMessages = messages.length > 0 ? messages : defaultMessages;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % displayMessages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [displayMessages.length]);

  return (
    <div className="w-full bg-yellow-50 border-0 rounded-none overflow-hidden">
      <div className="relative flex flex-row items-center min-h-[160px] md:min-h-[200px] pb-6 md:pb-8">
        {/* Particles moving across entire container */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          {/* Floating particles/sparkles across entire width */}
          <g className="particles">
            <circle className="particle particle-1" cx="100" cy="50" r="3" fill="#14B8A6"/>
            <circle className="particle particle-2" cx="850" cy="80" r="3.5" fill="#FDE047"/>
            <circle className="particle particle-3" cx="300" cy="150" r="2.5" fill="#8B5CF6"/>
            <circle className="particle particle-4" cx="700" cy="120" r="3" fill="#14B8A6"/>
            <circle className="particle particle-5" cx="450" cy="40" r="2.5" fill="#FDE047"/>
            <circle className="particle particle-6" cx="950" cy="160" r="3" fill="#0D9488"/>
            <circle className="particle particle-7" cx="200" cy="100" r="2.5" fill="#FF6B35"/>
            <circle className="particle particle-8" cx="600" cy="170" r="3" fill="#EC4899"/>
          </g>
        </svg>

        {/* Text in center with Listings heading and icons row */}
        <div className="flex-1 p-2 md:p-5 flex items-center justify-center relative z-10">
          <div className="flex flex-col items-center gap-1 md:gap-2">
            {/* Listings heading above icons */}
            <h2 className="text-lg md:text-2xl font-extrabold text-teal-700">Listings</h2>
            
            {/* Category icons in horizontal row */}
            <div className="flex flex-col items-center gap-2 md:gap-3">
            {/* Category icons in horizontal row */}
            <div className="flex items-center gap-1.5 md:gap-3 category-icon">
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-pink-500 flex items-center justify-center">
                <FaTshirt className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-yellow-300 flex items-center justify-center">
                <FaCar className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <FaStore className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-teal-700 flex items-center justify-center">
                <FaHome className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-cyan-500 flex items-center justify-center">
                <FaBroom className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-orange-600 flex items-center justify-center">
                <FaTools className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <FaMobileAlt className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-teal-500 flex items-center justify-center">
                <FaCouch className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
            </div>

              <p key={currentMessage} className="text-sm md:text-2xl font-extrabold text-teal-700 text-center animate-fade-in leading-tight tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
                {displayMessages[currentMessage]}
              </p>
            </div>
          </div>
        </div>

        {/* Megaphone on right */}
        <div className="flex-shrink-0 w-auto md:w-[200px] lg:w-[220px] p-2 md:p-4 pb-10 md:pb-4 flex items-center justify-center relative z-10">
          <div className="relative w-[80px] md:w-full md:max-w-[180px]">
            <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
            <svg className="megaphone-icon w-full h-auto" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <g transform="rotate(-20 256 256)">
                <polygon points="155,175 330,110 330,330 155,265" fill="url(#coneGradient)"/>
                <rect x="115" y="170" width="45" height="10" rx="3" fill="#0F766E"/>
                <rect x="120" y="175" width="40" height="45" fill="#14B8A6"/>
                <rect x="120" y="220" width="40" height="45" fill="#FDE047"/>
                <polygon points="135,265 155,265 160,300 125,300" fill="#14B8A6"/>
                <rect x="120" y="300" width="45" height="60" rx="10" ry="10" fill="#0F766E"/>
                <ellipse cx="345" cy="220" rx="18" ry="45" fill="url(#speakerGradient)"/>
                <rect x="320" y="100" width="16" height="245" rx="4" fill="#0F766E"/>
              </g>
              
              <g transform="translate(360, 190) rotate(-20)">
                <path className="sound-wave sound-wave-1" 
                      d="M0 -30 Q15 -26 15 0 Q15 26 0 30" 
                      stroke="#14B8A6" 
                      strokeWidth="5" 
                      fill="none" 
                      strokeLinecap="round"
                      opacity="0"/>
                <path className="sound-wave sound-wave-2" 
                      d="M12 -24 Q24 -20 24 0 Q24 20 12 24" 
                      stroke="#0D9488" 
                      strokeWidth="4" 
                      fill="none" 
                      strokeLinecap="round"
                      opacity="0"/>
                <path className="sound-wave sound-wave-3" 
                      d="M22 -18 Q32 -15 32 0 Q32 15 22 18" 
                      stroke="#0F766E" 
                      strokeWidth="3.5" 
                      fill="none" 
                      strokeLinecap="round"
                      opacity="0"/>
                <path className="sound-wave sound-wave-4" 
                      d="M32 -14 Q42 -11 42 0 Q42 11 32 14" 
                      stroke="#14B8A6" 
                      strokeWidth="3" 
                      fill="none" 
                      strokeLinecap="round"
                      opacity="0"/>
                <path className="sound-wave sound-wave-5" 
                      d="M42 -10 Q52 -8 52 0 Q52 8 42 10" 
                      stroke="#0D9488" 
                      strokeWidth="2.5" 
                      fill="none" 
                      strokeLinecap="round"
                      opacity="0"/>
                <path className="sound-wave sound-wave-6" 
                      d="M52 -8 Q60 -6 60 0 Q60 6 52 8" 
                      stroke="#0F766E" 
                      strokeWidth="2" 
                      fill="none" 
                      strokeLinecap="round"
                      opacity="0"/>
              </g>
              
              <defs>
                <linearGradient id="coneGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FCD34D"/>
                  <stop offset="100%" stopColor="#F59E0B"/>
                </linearGradient>
                <linearGradient id="speakerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FBBF24"/>
                  <stop offset="100%" stopColor="#F59E0B"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        {/* Create and View All buttons - bottom right */}
        <div className="absolute bottom-2 md:bottom-3 right-2 md:right-4 flex items-center gap-2 z-10">
          <Link
            href="/listings/add"
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs md:text-sm font-semibold py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg transition-colors"
          >
            + Create
          </Link>
          <Link
            href="/listings"
            className="bg-white hover:bg-gray-50 text-teal-700 border border-teal-600 text-xs md:text-sm font-semibold py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg transition-colors"
          >
            View All
          </Link>
        </div>
      </div>

      <style jsx>{`
        * {
          -webkit-animation-play-state: running !important;
          animation-play-state: running !important;
        }

        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s infinite ease-in-out;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.6; }
        }

        .megaphone-icon {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .sound-wave {
          opacity: 0;
          animation: sound-pulse 2s infinite ease-out;
        }

        .sound-wave-1 {
          animation-delay: 0s;
        }

        .sound-wave-2 {
          animation-delay: 0.3s;
        }

        .sound-wave-3 {
          animation-delay: 0.6s;
        }

        .sound-wave-4 {
          animation-delay: 0.9s;
        }

        .sound-wave-5 {
          animation-delay: 1.2s;
        }

        .sound-wave-6 {
          animation-delay: 1.5s;
        }

        @keyframes sound-pulse {
          0% {
            opacity: 0.8;
            transform: translateX(0) scale(0.9);
          }
          100% {
            opacity: 0;
            transform: translateX(15px) scale(1.2);
          }
        }

        .particle {
          animation: particle-float 6s infinite ease-in-out;
          will-change: transform, opacity;
        }

        .particle-1 { animation-delay: 0s; }
        .particle-2 { animation-delay: 0.8s; }
        .particle-3 { animation-delay: 1.6s; }
        .particle-4 { animation-delay: 2.4s; }
        .particle-5 { animation-delay: 3.2s; }
        .particle-6 { animation-delay: 4s; }
        .particle-7 { animation-delay: 4.8s; }
        .particle-8 { animation-delay: 5.6s; }

        @keyframes particle-float {
          0%, 100% { 
            opacity: 0.4; 
            transform: translateY(0) scale(0.9); 
          }
          50% { 
            opacity: 0.8; 
            transform: translateY(-12px) scale(1.1); 
          }
        }

        .floating-icon {
          animation: float-around 6s infinite ease-in-out;
        }

        .floating-icon-1 {
          animation-delay: 0s;
        }

        .floating-icon-2 {
          animation-delay: 3s;
        }

        @keyframes float-around {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg); 
            opacity: 0.6;
          }
          25% { 
            transform: translate(-15px, -20px) rotate(90deg); 
            opacity: 0.8;
          }
          50% { 
            transform: translate(-10px, 10px) rotate(180deg); 
            opacity: 1;
          }
          75% { 
            transform: translate(-25px, 5px) rotate(270deg); 
            opacity: 0.8;
          }
        }

        .category-icon {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default HeroListingSection;

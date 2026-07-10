'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTag, FaPercent, FaGift, FaShoppingBag, FaUtensils, FaCut, FaStore, FaBirthdayCake } from 'react-icons/fa';

const HeroDailyDealsSection = ({ messages = [], showViewAll = true, showCreate = true, compact = false }) => {
  const [currentMessage, setCurrentMessage] = useState(0);

  const defaultMessages = [
    "Discover Amazing Local Deals",
    "Save big on restaurants & services",
    "New deals added daily",
    "Support local businesses"
  ];

  const displayMessages = messages.length > 0 ? messages : defaultMessages;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % displayMessages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [displayMessages.length]);

  return (
    <div className="w-full overflow-hidden">
      <div className={`relative flex flex-row items-center ${compact ? 'min-h-[120px] md:min-h-[110px] pb-2 md:pb-1' : 'min-h-[160px] md:min-h-[200px] pb-6 md:pb-8'}`}>
        {/* Floating sale tags */}
        <div className="absolute right-0 md:right-0 w-[100px] md:w-[220px] h-full pointer-events-none overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 200" preserveAspectRatio="xMaxYMid meet" xmlns="http://www.w3.org/2000/svg">
            <g className="decorations">
              <g className="decoration decoration-1">
                <circle cx="30" cy="-5" r="8" fill="#FF6B6B"/>
                <text x="30" y="-2" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">%</text>
              </g>
              <g className="decoration decoration-2">
                <circle cx="80" cy="-10" r="6" fill="#4ECDC4"/>
                <text x="80" y="-7" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">$</text>
              </g>
              <g className="decoration decoration-3">
                <circle cx="130" cy="-8" r="7" fill="#FFE66D"/>
                <text x="130" y="-5" textAnchor="middle" fill="#8B6914" fontSize="7" fontWeight="bold">!</text>
              </g>
              <g className="decoration decoration-4">
                <circle cx="170" cy="-12" r="5" fill="#FF6B6B"/>
              </g>
              <g className="decoration decoration-5">
                <circle cx="50" cy="-15" r="6" fill="#4ECDC4"/>
              </g>
              <g className="decoration decoration-6">
                <circle cx="110" cy="-5" r="4" fill="#FFE66D"/>
              </g>
              <g className="decoration decoration-7">
                <circle cx="150" cy="-18" r="5" fill="#FF6B6B"/>
                <text x="150" y="-15" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">%</text>
              </g>
              <g className="decoration decoration-8">
                <circle cx="190" cy="-8" r="6" fill="#4ECDC4"/>
              </g>
            </g>
          </svg>
        </div>

        {/* Text in center with Daily Deals heading and icons row */}
        <div className={`flex-1 p-2 ${compact ? 'md:p-3' : 'md:p-5'} flex items-center justify-center relative z-10`}>
          <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-1 md:gap-2'}`}>
            {/* Daily Deals heading above icons */}
            <h2 className={`${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'} font-black tracking-wide drop-shadow-sm`} style={{ color: '#8B6914' }}>Daily Deals</h2>

            {/* Deal icons and text */}
            <div className={`flex flex-col items-center ${compact ? 'gap-1 md:gap-2' : 'gap-2 md:gap-3'}`}>
              {/* Deal icons in horizontal row */}
              <div className={`flex items-center ${compact ? 'gap-1 md:gap-2' : 'gap-1.5 md:gap-3'} category-icon`}>
                <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-red-500 flex items-center justify-center`}>
                  <FaTag className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
                </div>
                <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-green-500 flex items-center justify-center`}>
                  <FaPercent className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
                </div>
                <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-orange-500 flex items-center justify-center`}>
                  <FaUtensils className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
                </div>
                <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-pink-500 flex items-center justify-center`}>
                  <FaCut className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
                </div>
                <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-teal-500 flex items-center justify-center`}>
                  <FaStore className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
                </div>
                <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-purple-500 flex items-center justify-center`}>
                  <FaBirthdayCake className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
                </div>
                <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-blue-500 flex items-center justify-center`}>
                  <FaGift className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
                </div>
                <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-amber-500 flex items-center justify-center`}>
                  <FaShoppingBag className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
                </div>
              </div>

              <p key={currentMessage} className={`${compact ? 'text-xs md:text-lg' : 'text-sm md:text-2xl'} font-extrabold text-center animate-fade-in leading-tight tracking-tight`} style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', color: '#8B6914' }}>
                {displayMessages[currentMessage]}
              </p>
            </div>
          </div>
        </div>

        {/* Shopping bag illustration on right */}
        <div className={`flex-shrink-0 w-auto ${compact ? 'md:w-[120px] lg:w-[140px]' : 'md:w-[200px] lg:w-[220px]'} p-2 ${compact ? 'md:p-1 pb-6 md:pb-1' : 'md:p-4 pb-10 md:pb-4'} flex items-center justify-center relative z-10`}>
          <div className="relative w-[80px] md:w-full md:max-w-[180px]">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
            <svg className="deal-icon w-full h-auto" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              {/* Shopping bag */}
              <path d="M100 100 L100 250 L300 250 L300 100 L100 100" fill="#fad643" stroke="#8B6914" strokeWidth="3"/>
              <path d="M100 100 L120 70 L280 70 L300 100" fill="#FBDC5F" stroke="#8B6914" strokeWidth="3"/>

              {/* Bag handles */}
              <path d="M150 70 Q150 30 200 30 Q250 30 250 70" fill="none" stroke="#8B6914" strokeWidth="8" strokeLinecap="round"/>

              {/* Sale badge */}
              <circle cx="280" cy="120" r="35" fill="#FF6B6B"/>
              <text x="280" y="115" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">SALE</text>
              <text x="280" y="135" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">%</text>

              {/* Stars */}
              <g className="sparkle sparkle-1">
                <path d="M130 130 L133 140 L143 140 L135 147 L138 157 L130 150 L122 157 L125 147 L117 140 L127 140 Z" fill="#FFE66D"/>
              </g>
              <g className="sparkle sparkle-2">
                <path d="M250 180 L252 187 L259 187 L253 192 L255 199 L250 194 L245 199 L247 192 L241 187 L248 187 Z" fill="#FFE66D"/>
              </g>
              <g className="sparkle sparkle-3">
                <path d="M170 200 L172 207 L179 207 L173 212 L175 219 L170 214 L165 219 L167 212 L161 207 L168 207 Z" fill="#FFE66D"/>
              </g>
            </svg>
          </div>
        </div>

        {/* Create and View All buttons - bottom right */}
        {(showCreate || showViewAll) && (
          <div className={`absolute bottom-2 md:bottom-3 right-2 md:right-4 flex items-center gap-2 z-10 ${compact && showCreate ? 'md:hidden' : ''}`}>
            {showCreate && (
              <Link
                href="/deals/manage"
                className="bg-[#FFF8E1] hover:bg-[#FFECB3] text-xs md:text-sm font-semibold py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg shadow-sm transition-colors"
                style={{ color: '#8B6914' }}
              >
                + Create
              </Link>
            )}
            {showViewAll && (
              <Link
                href="/deals"
                className="bg-[#FFF8E1] hover:bg-[#FFECB3] text-xs md:text-sm font-semibold py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg shadow-sm transition-colors"
                style={{ color: '#8B6914' }}
              >
                View All
              </Link>
            )}
          </div>
        )}
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

        .deal-icon {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .decoration {
          animation: fall-down 8s infinite ease-in;
          will-change: transform;
        }

        .decoration-1 { animation-delay: 0s; }
        .decoration-2 { animation-delay: 1s; }
        .decoration-3 { animation-delay: 2s; }
        .decoration-4 { animation-delay: 3s; }
        .decoration-5 { animation-delay: 4s; }
        .decoration-6 { animation-delay: 5s; }
        .decoration-7 { animation-delay: 6s; }
        .decoration-8 { animation-delay: 7s; }

        @keyframes fall-down {
          0% {
            opacity: 0;
            transform: translateY(0) rotate(0deg);
          }
          5% {
            opacity: 0.8;
          }
          95% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: translateY(220px) rotate(180deg);
          }
        }

        .sparkle {
          animation: sparkle-twinkle 2s infinite ease-in-out;
        }

        .sparkle-1 {
          animation-delay: 0s;
        }

        .sparkle-2 {
          animation-delay: 0.7s;
        }

        .sparkle-3 {
          animation-delay: 1.4s;
        }

        @keyframes sparkle-twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .category-icon {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default HeroDailyDealsSection;

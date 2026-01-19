'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTheaterMasks, FaMicrophone, FaMusic, FaPalette, FaGuitar, FaFilm, FaTicketAlt, FaCalendarAlt } from 'react-icons/fa';

const HeroEventsSection = ({ messages = [], showViewAll = true, showCreate = true, compact = false }) => {
  const [currentMessage, setCurrentMessage] = useState(0);

  const defaultMessages = [
    "Create & Promote Events for FREE",
    "Discover exciting events near you",
    "Get connected on private chat",
    "Sell tickets at 2% + $0.80 per ticket"
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
        {/* Falling party decorations - only above masks area */}
        <div className="absolute right-0 md:right-0 w-[100px] md:w-[220px] h-full pointer-events-none overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 200" preserveAspectRatio="xMaxYMid meet" xmlns="http://www.w3.org/2000/svg">
            <g className="decorations">
              {/* Party hat */}
              <g className="decoration decoration-1">
                <path d="M30 -10 L35 5 L25 5 Z" fill="#EC4899"/>
                <circle cx="30" cy="-10" r="2" fill="#FDE047"/>
              </g>
              
              {/* Confetti rectangle */}
              <rect className="decoration decoration-2" x="80" y="-15" width="5" height="8" fill="#FDE047" rx="1"/>
              
              {/* Party popper */}
              <g className="decoration decoration-3">
                <path d="M120 -12 L125 -5 L115 -5 Z" fill="#8B5CF6"/>
                <line x1="120" y1="-12" x2="118" y2="-18" stroke="#FDE047" strokeWidth="1.5"/>
                <line x1="120" y1="-12" x2="122" y2="-18" stroke="#EC4899" strokeWidth="1.5"/>
              </g>
              
              {/* Confetti circle */}
              <circle className="decoration decoration-4" cx="160" cy="-10" r="3" fill="#14B8A6"/>
              
              {/* Party hat 2 */}
              <g className="decoration decoration-5">
                <path d="M50 -20 L55 -5 L45 -5 Z" fill="#FF6B35"/>
                <circle cx="50" cy="-20" r="2" fill="#14B8A6"/>
              </g>
              
              {/* Confetti square */}
              <rect className="decoration decoration-6" x="130" y="-25" width="6" height="6" fill="#06B6D4" rx="1"/>
              
              {/* Small confetti */}
              <circle className="decoration decoration-7" cx="90" cy="-8" r="2" fill="#EC4899"/>
              
              {/* Party popper 2 */}
              <g className="decoration decoration-8">
                <path d="M180 -18 L185 -10 L175 -10 Z" fill="#FDE047"/>
                <line x1="180" y1="-18" x2="178" y2="-24" stroke="#EC4899" strokeWidth="1.5"/>
                <line x1="180" y1="-18" x2="182" y2="-24" stroke="#8B5CF6" strokeWidth="1.5"/>
              </g>
            </g>
          </svg>
        </div>

        {/* Text in center with Events heading and icons row */}
        <div className={`flex-1 p-2 ${compact ? 'md:p-3' : 'md:p-5'} flex items-center justify-center relative z-10`}>
          <div className={`flex flex-col items-center ${compact ? 'gap-1' : 'gap-1 md:gap-2'}`}>
            {/* Events heading above icons */}
            <h2 className={`${compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'} font-black tracking-wide text-purple-700 drop-shadow-sm`}>Events</h2>

            {/* Event icons and text */}
            <div className={`flex flex-col items-center ${compact ? 'gap-1 md:gap-2' : 'gap-2 md:gap-3'}`}>
            {/* Event icons in horizontal row */}
            <div className={`flex items-center ${compact ? 'gap-1 md:gap-2' : 'gap-1.5 md:gap-3'} category-icon`}>
              <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-purple-600 flex items-center justify-center`}>
                <FaTheaterMasks className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
              </div>
              <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-pink-500 flex items-center justify-center`}>
                <FaMicrophone className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
              </div>
              <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-red-500 flex items-center justify-center`}>
                <FaMusic className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
              </div>
              <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-orange-500 flex items-center justify-center`}>
                <FaPalette className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
              </div>
              <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-amber-500 flex items-center justify-center`}>
                <FaGuitar className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
              </div>
              <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-indigo-600 flex items-center justify-center`}>
                <FaFilm className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
              </div>
              <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-teal-500 flex items-center justify-center`}>
                <FaTicketAlt className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
              </div>
              <div className={`${compact ? 'w-5 h-5 md:w-8 md:h-8' : 'w-6 h-6 md:w-10 md:h-10'} rounded-full bg-emerald-600 flex items-center justify-center`}>
                <FaCalendarAlt className={`${compact ? 'w-2.5 h-2.5 md:w-4 md:h-4' : 'w-3 h-3 md:w-5 md:h-5'} text-white`} />
              </div>
            </div>

              <p key={currentMessage} className={`${compact ? 'text-xs md:text-lg' : 'text-sm md:text-2xl'} font-extrabold text-purple-700 text-center animate-fade-in leading-tight tracking-tight`} style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
                {displayMessages[currentMessage]}
              </p>
            </div>
          </div>
        </div>

        {/* Theatre masks on right */}
        <div className={`flex-shrink-0 w-auto ${compact ? 'md:w-[120px] lg:w-[140px]' : 'md:w-[200px] lg:w-[220px]'} p-2 ${compact ? 'md:p-1 pb-6 md:pb-1' : 'md:p-4 pb-10 md:pb-4'} flex items-center justify-center relative z-10`}>
          <div className="relative w-[80px] md:w-full md:max-w-[180px]">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
            <svg className="mask-icon w-full h-auto" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              {/* Yellow/Happy mask (back) */}
              <path d="M100 80 Q165 110, 230 80 C235 130, 220 180, 165 215 C110 180, 95 130, 100 80 Z" fill="#f9a825"/>
              <path d="M100 80 Q130 95, 150 100 C120 100, 108 110, 105 130 C105 155, 115 180, 145 205 C110 180, 95 130, 100 80 Z" fill="#e88a00"/>
              
              {/* Yellow mask - left eye */}
              <path d="M120 120 L145 107 L152 127 L127 135 Z" fill="#ffffff"/>
              
              {/* Yellow mask - right eye */}
              <path d="M185 107 L210 120 L203 135 L178 127 Z" fill="#ffffff"/>
              
              {/* Yellow mask - happy smile */}
              <path d="M130 158 Q165 198, 200 158 Q165 178, 130 158 Z" fill="#ffffff"/>
              
              {/* Red/Sad mask (front) */}
              <path d="M185 50 Q260 85, 330 50 C335 105, 315 165, 260 200 C205 165, 180 105, 185 50 Z" fill="#e53935"/>
              <path d="M185 50 Q220 68, 245 75 C210 75, 195 90, 192 110 C192 140, 205 170, 235 190 C205 165, 180 105, 185 50 Z" fill="#c62828"/>
              
              {/* Red mask - left eye */}
              <path d="M210 95 L238 80 L248 102 L220 112 Z" fill="#ffffff"/>
              
              {/* Red mask - right eye */}
              <path d="M280 80 L308 95 L298 112 L270 102 Z" fill="#ffffff"/>
              
              {/* Red mask - sad smile (inverted) */}
              <path d="M218 130 Q260 175, 302 130 Q260 155, 218 130 Z" fill="#ffffff"/>
              
              {/* Sparkle effects */}
              <g className="sparkles">
                <path className="sparkle sparkle-1" d="M55 60 L58 67 L65 70 L58 73 L55 80 L52 73 L45 70 L52 67 Z" fill="#ffb84d" opacity="0"/>
                <path className="sparkle sparkle-2" d="M345 160 L349 167 L356 170 L349 173 L345 180 L341 173 L334 170 L341 167 Z" fill="#e84c4c" opacity="0"/>
                <path className="sparkle sparkle-3" d="M75 45 L77 49 L81 51 L77 53 L75 57 L73 53 L69 51 L73 49 Z" fill="#ffb84d" opacity="0"/>
              </g>
            </svg>
          </div>
        </div>
        
        {/* Create and View All buttons - bottom right */}
        {(showCreate || showViewAll) && (
          <div className={`absolute bottom-2 md:bottom-3 right-2 md:right-4 flex items-center gap-2 z-10 ${compact && showCreate ? 'md:hidden' : ''}`}>
            {showCreate && (
              <Link
                href="/events/add"
                className="bg-[#f5eef5] hover:bg-[#efe5ef] text-purple-700 text-xs md:text-sm font-semibold py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg shadow-sm transition-colors"
              >
                + Create
              </Link>
            )}
            {showViewAll && (
              <Link
                href="/events"
                className="bg-[#f5eef5] hover:bg-[#efe5ef] text-purple-700 text-xs md:text-sm font-semibold py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg shadow-sm transition-colors"
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

        .mask-icon {
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
            opacity: 0;
            transform: scale(0.5);
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

export default HeroEventsSection;

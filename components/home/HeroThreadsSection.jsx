'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaNewspaper, FaQuestionCircle, FaSearch, FaThumbsUp, FaGlobe, FaMapMarkerAlt, FaBell } from 'react-icons/fa';

const HeroThreadsSection = ({ messages = [] }) => {
  const [currentMessage, setCurrentMessage] = useState(0);

  const defaultMessages = [
    "Join Conversations & Connect",
    "Share ideas with the community",
    "Discover trending discussions",
    "Ask questions, get answers"
  ];

  const displayMessages = messages.length > 0 ? messages : defaultMessages;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % displayMessages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [displayMessages.length]);

  return (
    <div className="w-full bg-yellow-50 border-0 rounded-none overflow-visible">
      <div className="relative flex flex-row items-center min-h-[160px] md:min-h-[200px] pb-8 md:pb-12">
        {/* Text in center with Forum heading and icons row */}
        <div className="flex-1 p-2 md:p-5 flex items-center justify-center relative z-10">
          <div className="flex flex-col items-center gap-1 md:gap-2">
            {/* Forum heading above icons */}
            <h2 className="text-lg md:text-2xl font-extrabold text-teal-700">Forum</h2>
            
            {/* Thread icons and text */}
            <div className="flex flex-col items-center gap-2 md:gap-3">
            {/* Thread icons in horizontal row */}
            <div className="flex items-center gap-1.5 md:gap-3 category-icon">
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <FaNewspaper className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <FaQuestionCircle className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <FaSearch className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-green-500 flex items-center justify-center">
                <FaThumbsUp className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-teal-600 flex items-center justify-center">
                <FaGlobe className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-red-500 flex items-center justify-center">
                <FaMapMarkerAlt className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-amber-500 flex items-center justify-center">
                <FaBell className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
            </div>

              <p key={currentMessage} className="text-sm md:text-2xl font-extrabold text-teal-700 text-center animate-fade-in leading-tight tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
                {displayMessages[currentMessage]}
              </p>
            </div>
          </div>
        </div>

        {/* Community chat illustration on right */}
        <div className="flex-shrink-0 w-auto md:w-[200px] lg:w-[220px] p-2 md:p-4 pb-10 md:pb-4 flex flex-col items-center justify-center relative z-10">
          <div className="relative w-[80px] md:w-full md:max-w-[180px]">
            <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
            <svg className="community-icon w-full h-auto" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              {/* Yellow chat bubble (behind) */}
              <rect x="190" y="45" width="95" height="65" rx="8" ry="8" fill="#f9d56e"/>
              {/* Yellow bubble tail */}
              <polygon points="200,110 215,110 200,130" fill="#f9d56e"/>
              {/* Yellow bubble dots */}
              <circle cx="217" cy="77" r="5" fill="#ffffff"/>
              <circle cx="237" cy="77" r="5" fill="#ffffff"/>
              <circle cx="257" cy="77" r="5" fill="#ffffff"/>
              
              {/* Green chat bubble (front) */}
              <rect x="115" y="30" width="95" height="65" rx="8" ry="8" fill="#5cd6a9"/>
              {/* Green bubble tail */}
              <polygon points="130,95 145,95 130,115" fill="#5cd6a9"/>
              {/* Green bubble dots */}
              <circle cx="142" cy="62" r="5" fill="#ffffff"/>
              <circle cx="162" cy="62" r="5" fill="#ffffff"/>
              <circle cx="182" cy="62" r="5" fill="#ffffff"/>
              
              {/* Person 1 - Coral/Red (leftmost) */}
              <circle cx="115" cy="175" r="22" fill="#f8c9b8"/>
              <rect x="85" y="200" width="60" height="45" rx="20" ry="20" fill="#f87e7e"/>
              
              {/* Person 2 - Peach */}
              <circle cx="160" cy="175" r="22" fill="#f8c9b8"/>
              <rect x="130" y="200" width="60" height="45" rx="20" ry="20" fill="#f8c9b8"/>
              
              {/* Person 3 - Purple (center) */}
              <circle cx="200" cy="175" r="22" fill="#f8c9b8"/>
              <rect x="170" y="200" width="60" height="45" rx="20" ry="20" fill="#c9a0c9"/>
              
              {/* Person 4 - Blue */}
              <circle cx="240" cy="175" r="22" fill="#f8c9b8"/>
              <rect x="210" y="200" width="60" height="45" rx="20" ry="20" fill="#6eb5e5"/>
              
              {/* Person 5 - Green (rightmost) */}
              <circle cx="285" cy="175" r="22" fill="#f8c9b8"/>
              <rect x="255" y="200" width="60" height="45" rx="20" ry="20" fill="#8edba8"/>
            </svg>
          </div>
          
          {/* Moving text below icon */}
          <div className="w-[120px] md:w-[220px] overflow-hidden mt-2 h-4 relative">
            <span key={currentMessage} className="moving-text-below absolute inset-0 flex items-center justify-center text-[10px] md:text-xs font-medium text-teal-700 whitespace-nowrap italic">
              {["Where can I find...", "Does anyone know...", "Migration Update...", "Looking for advice...", "Need recommendations...", "Community help..."][currentMessage % 6]}
            </span>
          </div>
        </div>
        
        {/* Create and View All buttons - bottom right */}
        <div className="absolute bottom-2 md:bottom-3 right-2 md:right-4 flex items-center gap-2 z-10">
          <Link
            href="/threads/new"
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs md:text-sm font-semibold py-1.5 px-2.5 md:py-2 md:px-4 rounded-lg transition-colors"
          >
            + Create
          </Link>
          <Link
            href="/threads"
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

        .community-icon {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .moving-text-below {
          animation: slide-left 8s ease-in-out infinite;
        }

        @keyframes slide-left {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateX(0);
          }
          85% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        .category-icon {
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default HeroThreadsSection;

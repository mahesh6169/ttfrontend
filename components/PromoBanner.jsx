'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaStar, FaMapMarkerAlt, FaComments, FaCalendarAlt, FaUsers, FaLightbulb, FaBook, FaTicketAlt } from 'react-icons/fa';

const PromoBanner = ({ page = 'listings', inline = false, showAll = false }) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isMobile, setIsMobile] = useState(false); // Start with false to match server rendering

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop message configurations
  const desktopMessageConfig = {
    listings: [
      { 
        text: "List for FREE & get discovered!", 
        link: "/listings/add",
        icon: FaStar
      },      
      { 
        text: "Find local services near you", 
        link: "/listings",
        icon: FaMapMarkerAlt
      },
      { 
        text: "Get connected on chat", 
        link: null,
        icon: FaComments
      }
    ],
    events: [
      { 
        text: "Create events - RSVP, Promotional or Ticketed/Seated", 
        link: "/events/add",
        icon: FaCalendarAlt
      },
      { 
        text: "Find events happening near you", 
        link: "/events",
        icon: FaMapMarkerAlt
      },
      { 
        text: "Get connected on chat", 
        link: null,
        icon: FaComments
      }
    ],
    threads: [
      { 
        text: "Create topics that matter", 
        link: "/threads/new",
        icon: FaComments
      },
      { 
        text: "Join discussions & chat in real time", 
        link: null,
        icon: FaUsers
      },
      { 
        text: "Explore topics & get insights", 
        link: "/threads",
        icon: FaLightbulb
      }
    ]
  };

  // Mobile message configurations with more, shorter messages
  const mobileMessageConfig = {
    listings: [
      { 
        text: "FREE - list & get discovered!", 
        link: "/listings/add",
        icon: FaStar
      },      
      { 
        text: "Find services near you", 
        link: "/listings",
        icon: FaMapMarkerAlt
      },
      { 
        text: "Get connected on chat", 
        link: null,
        icon: FaComments
      }
    ],
    events: [
      { 
        text: "RSVP/Promotional Events", 
        link: "/events",
        icon: FaCalendarAlt
      },
      { 
        text: "Ticketed/Seated Events", 
        link: "/events",
        icon: FaTicketAlt
      },
      { 
        text: "Find events near you", 
        link: "/events",
        icon: FaMapMarkerAlt
      },
      { 
        text: "Get connected on chat", 
        link: null,
        icon: FaComments
      }
    ],
    threads: [
      { 
        text: "Create topics that matter", 
        link: "/threads/new",
        icon: FaComments
      },
      { 
        text: "Join discussions & chat in real time", 
        link: null,
        icon: FaUsers
      },
      { 
        text: "Explore topics & get insights", 
        link: "/threads",
        icon: FaLightbulb
      },
    ]
  };

  // Select the appropriate message config based on screen size
  const messageConfig = isMobile ? mobileMessageConfig : desktopMessageConfig;
  const messages = messageConfig[page] || messageConfig.listings;

  // Auto-rotate messages every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [messages.length]);

  const current = messages[currentMessage];

  // Inline version for placement next to buttons
  if (inline) {
    // Special layout for desktop - show all messages on desktop, rotate on mobile
    if (showAll) {
      return (
        <>
          {/* Desktop version - show all */}
          <div className="hidden sm:flex bg-white border border-teal-200 border-l-4 border-l-teal-600 rounded-lg py-3 px-5 items-center justify-around gap-6 shadow-sm">
            {messages.map((message, index) => (
              <div key={index} className="flex items-center gap-3">
                {message.icon && <message.icon className="text-teal-600 text-lg flex-shrink-0" />}
                {message.link ? (
                  <Link 
                    href={message.link}
                    className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
                  >
                    {message.text}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-gray-700">{message.text}</span>
                )}
                {index < messages.length - 1 && (
                  <div className="h-6 w-px bg-gray-200 mx-2"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile version - rotating */}
          <div className="flex sm:hidden bg-white border border-teal-200 border-l-4 border-l-teal-600 rounded-lg h-12 overflow-hidden shadow-sm">
            <div className="h-full flex items-center justify-center px-4 w-full">
              {current.link ? (
                <Link 
                  href={current.link}
                  className="flex items-center justify-center transition-all duration-300 w-full h-full"
                >
                  <span className="text-sm font-medium text-gray-700 animate-fade-in truncate flex items-center gap-2">
                    {current.icon && <current.icon className="text-teal-600 flex-shrink-0" />}
                    <span>{current.text}</span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <span className="text-sm font-medium text-gray-700 animate-fade-in truncate flex items-center gap-2">
                    {current.icon && <current.icon className="text-teal-600 flex-shrink-0" />}
                    <span>{current.text}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      );
    }
    
    // Default rotating banner
    return (
      <div className="bg-teal-700 text-amber-400 rounded h-10 md:h-auto md:py-2 overflow-hidden">
        <div className="h-full flex items-center justify-center px-3 sm:px-4">
          {current.link ? (
            <Link 
              href={current.link}
              className="flex items-center justify-center hover:scale-105 transition-all duration-300 w-full h-full"
            >
              <span className="text-sm sm:text-sm md:text-base font-bold animate-fade-in truncate flex items-center gap-2">
                {current.icon && <current.icon className="text-amber-300 flex-shrink-0" />}
                <span>{current.text}</span>
              </span>
            </Link>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-sm sm:text-sm md:text-base font-bold animate-fade-in truncate flex items-center gap-2">
                {current.icon && <current.icon className="text-amber-300 flex-shrink-0" />}
                <span>{current.text}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full width version for layouts
  return (
    <div className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-sm">
      <div className="container mx-auto px-4">
        {current.link ? (
          <Link 
            href={current.link}
            className="flex items-center justify-center h-10 sm:h-12 hover:bg-white/10 transition-all duration-300 group"
          >
            <span className="text-sm sm:text-base font-medium animate-fade-in flex items-center gap-2 group-hover:scale-105 transition-transform">
              {current.icon && <current.icon className="text-amber-300" />}
              {current.text}
            </span>
          </Link>
        ) : (
          <div className="flex items-center justify-center h-10 sm:h-12">
            <span className="text-sm sm:text-base font-medium animate-fade-in flex items-center gap-2">
              {current.icon && <current.icon className="text-amber-300" />}
              {current.text}
            </span>
          </div>
        )}
      </div>
      
      {/* Progress indicator */}
      <div className="h-0.5 bg-white/20">
        <div 
          className="h-full bg-white/60 transition-all duration-300"
          style={{ width: `${((currentMessage + 1) / messages.length) * 100}%` }}
        />
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translateY(-10px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default PromoBanner;
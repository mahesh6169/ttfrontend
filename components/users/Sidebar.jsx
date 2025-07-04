import React, { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaUser, FaAd, FaEnvelope, FaCalendarAlt, FaMoneyCheckAlt, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { MdFavorite } from 'react-icons/md';
import { BsChatText } from 'react-icons/bs';

const Sidebar = ({ onLinkClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [navigatingTo, setNavigatingTo] = useState(null);

  const menuItems = [
    // User section
    { label: 'User Settings', href: '/users/profile/settings', icon: <FaUser /> },
    { label: 'Favourites', href: '/users/profile/favourites', icon: <MdFavorite /> },
    { label: 'Messages', href: '/users/profile/conversations', icon: <FaEnvelope /> },
    { label: 'My Registrations', href: '/users/profile/myregistrations', icon: <FaCalendarAlt /> },
    { label: 'My Tickets', href: '/users/profile/mytickets', icon: <FaMoneyCheckAlt /> },
    
    // Divider
    { type: 'divider' },
    
    // Management section
    { label: 'Manage Ads', href: '/users/profile/manageads', icon: <FaAd /> },
    { label: 'Manage Events', href: '/users/profile/manageevents', icon: <FaCalendarAlt /> },
    { label: 'Manage Topics', href: '/users/profile/managethreads', icon: <BsChatText /> },
    
    // Divider
    { type: 'divider' },
    
    // Event Organiser dropdown
    {
      label: 'Event Organiser',
      icon: <FaCalendarAlt />,
      children: [
        { label: 'Stripe', href: '/users/profile/settings/stripeSetup', icon: <FaMoneyCheckAlt /> },
        { label: 'Manage Sales', href: '/users/profile/refunds', icon: <FaMoneyCheckAlt /> },
        { label: 'Checkin', href: '/users/profile/checkin', icon: <FaCalendarAlt /> },
      ]
    }
  ];

  useEffect(() => {
    menuItems.forEach(item => {
      if (item.href) router.prefetch(item.href);
      if (item.children) item.children.forEach(child => router.prefetch(child.href));
    });
  }, [router]);

  // Check if any child route is active
  const isChildActive = (children) => {
    return children?.some(child => pathname === child.href) || false;
  };

  // Auto-open dropdown if a child route is active
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.children && isChildActive(item.children)) {
        setOpenDropdown(item.label);
      }
    });
  }, [pathname]);

  const toggleDropdown = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleNavigation = (href) => {
    // Prevent navigation if already navigating
    if (navigatingTo) return;
    
    setNavigatingTo(href);
    router.push(href);
    
    // Clear loading state after navigation
    const timer = setTimeout(() => {
      setNavigatingTo(null);
      if (onLinkClick) onLinkClick();
    }, 1000); // Adjust timing as needed
    
    return () => clearTimeout(timer);
  };

  return (
    <nav className="p-4 bg-teal-700 relative">
      <ul className="space-y-2 text-lime-100">
        {menuItems.map((item, index) => {
          // Render divider
          if (item.type === 'divider') {
            return (
              <li key={`divider-${index}`} className="py-2">
                <div className="border-t border-lime-200/30"></div>
              </li>
            );
          }
          
          // Render dropdown menu item
          if (item.children) {
            return (
              <li key={item.label} className="relative">
                {/* Parent menu item with click toggle */}
                <div 
                  className={`flex items-center space-x-2 p-2 rounded hover:bg-lime-50 hover:text-teal-700 cursor-pointer transition-colors ${
                    isChildActive(item.children) ? 'bg-lime-100 text-teal-700 font-bold' : ''
                  }`}
                  onClick={() => toggleDropdown(item.label)}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {/* Chevron that rotates based on state */}
                  <span className={`transition-transform duration-200 ${
                    openDropdown === item.label ? 'rotate-90' : ''
                  }`}>
                    <FaChevronRight size={12} />
                  </span>
                </div>
                
                {/* Sliding dropdown submenu */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openDropdown === item.label ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <ul className="ml-4 mt-1 space-y-1 border-l-2 border-lime-200">
                    {item.children.map(child => (
                      <li key={child.href}>
                        <div
                          className={`flex items-center gap-2 pl-4 pr-2 py-2 rounded transition-colors cursor-pointer ${
                            pathname === child.href 
                              ? 'bg-lime-100 text-teal-700 font-bold' 
                              : navigatingTo === child.href
                                ? 'bg-lime-200 text-teal-700'
                                : 'hover:bg-lime-50 hover:text-teal-700'
                          } ${navigatingTo === child.href ? 'opacity-75' : ''}`}
                          onClick={() => handleNavigation(child.href)}
                        >
                          {navigatingTo === child.href ? (
                            <div className="w-3 h-3 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            child.icon
                          )}
                          <span className="text-sm">{navigatingTo === child.href ? 'Loading...' : child.label}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            );
          }
          
          // Render regular menu item
          return (
            <li key={item.href}>
              <div
                className={`flex items-center space-x-2 p-2 rounded transition-colors cursor-pointer ${
                  pathname === item.href 
                    ? 'bg-lime-100 text-teal-700 font-bold' 
                    : navigatingTo === item.href
                      ? 'bg-lime-200 text-teal-700'
                      : 'hover:bg-lime-50 hover:text-teal-700'
                } ${navigatingTo === item.href ? 'opacity-75' : ''}`}
                onMouseEnter={() => router.prefetch(item.href)}
                onClick={() => handleNavigation(item.href)}
              >
                {navigatingTo === item.href ? (
                  <div className="w-4 h-4 border-2 border-teal-700 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  item.icon
                )}
                <span>{navigatingTo === item.href ? 'Loading...' : item.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default memo(Sidebar);
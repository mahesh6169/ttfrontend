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

  const menuItems = [
    { label: 'Settings', href: '/users/profile/settings', icon: <FaUser /> },
    { label: 'Stripe', href: '/users/profile/settings/stripeSetup', icon: <FaUser /> },
    { label: 'Manage Ads', href: '/users/profile/manageads', icon: <FaAd /> },
    {
      label: 'Events',
      icon: <FaCalendarAlt />,
      children: [
        { label: 'Payment Settings', href: '/users/profile/paymentsettings', icon: <FaMoneyCheckAlt /> },
        { label: 'Manage Events', href: '/users/profile/manageevents', icon: <FaCalendarAlt /> },
        { label: 'Manage Registrations', href: '/users/profile/manageregistrations', icon: <FaCalendarAlt /> },             
        { label: 'Manage Refunds', href: '/users/profile/managerefunds', icon: <FaMoneyCheckAlt /> },
      ]
    },
    { label: 'Manage Topics', href: '/users/profile/managethreads', icon: <BsChatText /> },
    { label: 'Favourites', href: '/users/profile/favourites', icon: <MdFavorite /> },
    { label: 'Messages', href: '/users/profile/conversations', icon: <FaEnvelope /> },
    { label: 'My Registrations', href: '/users/profile/myregistrations', icon: <FaCalendarAlt /> },
    { label: 'My Tickets', href: '/users/profile/mytickets', icon: <FaMoneyCheckAlt /> }
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

  return (
    <nav className="p-4 bg-teal-700 relative">
      <ul className="space-y-2 text-lime-100">
        {menuItems.map(item =>
          item.children ? (
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
                      <Link
                        href={child.href}
                        className={`flex items-center gap-2 pl-4 pr-2 py-2 rounded transition-colors ${
                          pathname === child.href 
                            ? 'bg-lime-100 text-teal-700 font-bold' 
                            : 'hover:bg-lime-50 hover:text-teal-700'
                        }`}
                        onClick={onLinkClick}
                      >
                        {child.icon}
                        <span className="text-sm">{child.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ) : (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-2 p-2 rounded transition-colors block ${
                  pathname === item.href 
                    ? 'bg-lime-100 text-teal-700 font-bold' 
                    : 'hover:bg-lime-50 hover:text-teal-700'
                }`}
                onMouseEnter={() => router.prefetch(item.href)}
                onClick={onLinkClick}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
};

export default memo(Sidebar);
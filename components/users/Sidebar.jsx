import React, { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaUser, FaAd, FaEnvelope, FaCalendarAlt, FaMoneyCheckAlt } from 'react-icons/fa';
import { MdFavorite } from 'react-icons/md';
import { BsChatText } from 'react-icons/bs';

const Sidebar = ({ onLinkClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [hovered, setHovered] = useState(null);

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

  return (
    <nav className="p-4 bg-teal-700 relative">
      <ul className="space-y-2 text-lime-100">
        {menuItems.map(item =>
          item.children ? (
            <li
              key={item.label}
              className="relative group"
              onMouseEnter={() => setHovered(item.label)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className={`flex items-center space-x-2 p-2 rounded hover:bg-lime-50 hover:text-teal-700 cursor-pointer`}>
                {item.icon}
                <span>{item.label}</span>
                <span className="ml-auto">&#9656;</span>
              </div>
              {/* Flyout submenu */}
              {hovered === item.label && (
                <ul className="absolute left-full top-0 ml-2 bg-white text-teal-700 rounded shadow-md py-2 z-20 min-w-max w-48">
                  {item.children.map(child => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        className={`flex items-center gap-2 px-4 py-2 hover:bg-teal-100 ${
                          pathname === child.href ? 'bg-teal-100 font-bold' : ''
                        }`}
                        onClick={onLinkClick}
                      >
                        {child.icon}
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ) : (
            <li
              key={item.href}
              className={`flex items-center space-x-2 p-2 rounded hover:bg-lime-50 hover:text-teal-700 ${pathname === item.href ? 'bg-lime-100 text-teal-700 font-bold' : ''}`}
            >
              {item.icon}
              <Link
                href={item.href}
                className="block w-full"
                onMouseEnter={() => router.prefetch(item.href)}
                onClick={onLinkClick}
              >
                {item.label}
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
};

export default memo(Sidebar);

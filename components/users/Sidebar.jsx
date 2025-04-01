import React, { memo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaUser, FaAd, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { MdFavorite } from 'react-icons/md';
import { RiAdvertisementFill } from 'react-icons/ri';
import { BsChatText } from 'react-icons/bs';

const Sidebar = ({ onLinkClick }) => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { label: 'Settings', href: '/users/profile/settings', icon: <FaUser /> },
    { label: 'Manage Ads', href: '/users/profile/manageads', icon: <FaAd /> },
    { label: 'Manage Events', href: '/users/profile/manageevents', icon: <FaCalendarAlt /> }, // ✅ NEW ITEM
    { label: 'Manage Threads', href: '/users/profile/managethreads', icon: <BsChatText /> },
    { label: 'Favourites', href: '/users/profile/favourites', icon: <MdFavorite /> },
    { label: 'Messages', href: '/users/profile/conversations', icon: <FaEnvelope /> },
  ];

  useEffect(() => {
    menuItems.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  return (
    <nav className="p-4">
      <ul className="space-y-4">
        {menuItems.map((item) => (
          <li
            key={item.href}
            className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-200 ${
              pathname === item.href ? 'bg-gray-300 font-bold' : ''
            }`}
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
        ))}
      </ul>
    </nav>
  );
};

export default memo(Sidebar);

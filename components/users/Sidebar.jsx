import React, { memo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaUser, FaAd, FaEnvelope } from 'react-icons/fa';
import { MdFavorite } from 'react-icons/md';
import { RiAdvertisementFill } from 'react-icons/ri';
import { BsChatText } from 'react-icons/bs'; // ✅ New Icon for Manage Threads

const Sidebar = ({ onLinkClick }) => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { label: 'Settings', href: '/users/profile/settings', icon: <FaUser /> },
    { label: 'Manage Ads', href: '/users/profile/manageads', icon: <FaAd /> },
    { label: 'Manage Threads', href: '/users/profile/managethreads', icon: <BsChatText /> }, // ✅ Added Manage Threads
    { label: 'Favourites', href: '/users/profile/favourites', icon: <MdFavorite /> },
    { label: 'Messages', href: '/users/profile/conversations', icon: <FaEnvelope /> },
    { label: 'Post Advert', href: '/adverts/new', icon: <RiAdvertisementFill /> },
  ];

  // 🚀 **Preload Sidebar Links on Mount**
  useEffect(() => {
    menuItems.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  return (
    <nav className="p-4 mt-16">
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
              onMouseEnter={() => router.prefetch(item.href)} // 🏎️ Prefetch on hover
              onClick={onLinkClick} // Close menu on click
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

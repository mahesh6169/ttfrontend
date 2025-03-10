'use client';

import React, { memo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaUsers, FaAd, FaCog, FaClipboardList } from 'react-icons/fa';
import { MdEvent, MdCategory } from 'react-icons/md';
import { RiAdvertisementFill } from 'react-icons/ri';
import { BsChatText } from 'react-icons/bs'; 

const AdminSidebar = ({ onLinkClick }) => {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { label: 'Users', href: '/users/admin/users', icon: <FaUsers /> },
    { label: 'Adverts', href: '/users/admin/adverts', icon: <FaAd /> },
    { label: 'Threads', href: '/users/admin/threads', icon: <BsChatText /> },
    { label: 'Events', href: '/users/admin/events', icon: <MdEvent /> },
    { label: 'Categories', href: '/users/admin/categories', icon: <MdCategory /> },
    { label: 'Post Advert', href: '/users/admin/adverts/new', icon: <RiAdvertisementFill /> },
    { label: 'Settings', href: '/users/admin/settings', icon: <FaCog /> },
  ];

  // 🚀 **Preload Sidebar Links on Mount**
  useEffect(() => {
    menuItems.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  return (
    <nav className="p-4 bg-gray-800 text-white h-full">
      <ul className="space-y-4">
        {menuItems.map((item) => (
          <li
            key={item.href}
            className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-700 ${
              pathname === item.href ? 'bg-gray-600 font-bold' : ''
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

export default memo(AdminSidebar);

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
    { label: 'Users', href: '/admin/profile/users', icon: <FaUsers /> },
    { label: 'Renewal Adverts', href: '/admin/profile/adverts/renewals', icon: <FaAd /> },
    { label: 'Add Adverts', href: '/admin/profile/adverts/add', icon: <FaAd /> },
    { label: 'Manage Adverts', href: '/admin/profile/adverts/manage', icon: <FaAd /> },
    { label: 'Renewal Events', href: '/admin/profile/events/renewals', icon: <MdEvent /> },
    { label: 'Manage Events', href: '/users/profile/manageevents', icon: <MdEvent /> },
    { label: 'Manage Threads', href: '/admin/profile/threads/manage', icon: <BsChatText /> },  
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

'use client';

import React, { memo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaUsers, FaAd, FaCog, FaClipboardList, FaDollarSign, FaChevronDown, FaChevronRight, FaBuilding, FaThLarge, FaPlusCircle, FaChartBar, FaSync } from 'react-icons/fa';
import { MdEvent, MdCategory, MdLocalOffer } from 'react-icons/md';
import { RiAdvertisementFill } from 'react-icons/ri';
import { BsChatText } from 'react-icons/bs'; 

const AdminSidebar = ({ onLinkClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [bannerAdsOpen, setBannerAdsOpen] = useState(false);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [dailyDealsOpen, setDailyDealsOpen] = useState(false);

  const menuItems = [
    { label: 'Users', href: '/admin/profile/users', icon: <FaUsers /> },
    { 
      label: 'Banner Ads', 
      href: '/admin/profile/banner-ads', 
      icon: <RiAdvertisementFill />,
      hasDropdown: true,
      isOpen: bannerAdsOpen,
      setIsOpen: setBannerAdsOpen,
      subItems: [
        { label: 'Dashboard', href: '/admin/profile/banner-ads', icon: <FaChartBar /> },
        { label: 'Manage Ads', href: '/admin/profile/banner-ads/ads', icon: <FaAd /> },
        { label: 'Manage Businesses', href: '/admin/profile/banner-ads/businesses', icon: <FaBuilding /> },
        { label: 'Manage Placements', href: '/admin/profile/banner-ads/placements', icon: <FaThLarge /> },
        { label: 'View Metrics', href: '/admin/profile/banner-ads/metrics', icon: <FaChartBar /> },
      ]
    },
    {
      label: 'Coupons',
      href: '/admin/profile/stores',
      icon: <MdLocalOffer />,
      hasDropdown: true,
      isOpen: couponsOpen,
      setIsOpen: setCouponsOpen,
      subItems: [
        { label: 'Manage Stores', href: '/admin/profile/stores', icon: <FaBuilding /> },
        { label: 'Manage Campaigns', href: '/admin/profile/campaigns', icon: <MdCategory /> },
        { label: 'Analytics', href: '/admin/profile/stores/analytics', icon: <FaChartBar /> },
      ]
    },
    {
      label: 'Daily Deals',
      href: '/admin/profile/deals',
      icon: <MdLocalOffer />,
      hasDropdown: true,
      isOpen: dailyDealsOpen,
      setIsOpen: setDailyDealsOpen,
      subItems: [
        { label: 'Partner Stores', href: '/admin/profile/deals/partners', icon: <FaBuilding /> },
        { label: 'Manage Deals', href: '/admin/profile/deals', icon: <MdCategory /> },
      ]
    },
    { label: 'Renewal Adverts', href: '/admin/profile/adverts/renewals', icon: <FaAd /> },
    { label: 'Renewal Events', href: '/admin/profile/events/renewals', icon: <MdEvent /> },
    { label: 'Platform Fees', href: '/admin/profile/events/platformFee', icon: <FaDollarSign /> },
    { label: 'Thread Moderation', href: '/admin/profile/threads/moderation', icon: <BsChatText /> },  
    { label: 'Settings', href: '/users/admin/settings', icon: <FaCog /> },
  ];

  // Check if current path is within sections
  useEffect(() => {
    if (pathname.startsWith('/admin/profile/banner-ads')) {
      setBannerAdsOpen(true);
    }
    if (pathname.startsWith('/admin/profile/stores') || pathname.startsWith('/admin/profile/campaigns')) {
      setCouponsOpen(true);
    }
    if (pathname.startsWith('/admin/profile/deals')) {
      setDailyDealsOpen(true);
    }
  }, [pathname]);

  // 🚀 **Preload Sidebar Links on Mount**
  useEffect(() => {
    menuItems.forEach((item) => {
      router.prefetch(item.href);
      if (item.subItems) {
        item.subItems.forEach(subItem => {
          router.prefetch(subItem.href);
        });
      }
    });
  }, [router]);

  const handleRefreshMetrics = () => {
    window.location.reload();
  };

  return (
    <nav className="p-4 bg-gray-800 text-white h-full">
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.href}>
            {item.hasDropdown ? (
              <>
                <div
                  className={`flex items-center justify-between p-2 rounded hover:bg-gray-700 cursor-pointer ${
                    pathname === item.href ? 'bg-gray-600 font-bold' : ''
                  }`}
                  onClick={() => item.setIsOpen(!item.isOpen)}
                >
                  <div className="flex items-center space-x-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.isOpen ? <FaChevronDown /> : <FaChevronRight />}
                </div>
                {item.isOpen && (
                  <ul className="ml-4 mt-2 space-y-1">
                    {item.subItems.map((subItem) => (
                      <li
                        key={subItem.href}
                        className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-700 ${
                          pathname === subItem.href ? 'bg-gray-600 font-bold' : ''
                        }`}
                      >
                        {subItem.icon}
                        <Link
                          href={subItem.href}
                          className="block w-full text-sm"
                          onMouseEnter={() => router.prefetch(subItem.href)}
                          onClick={onLinkClick}
                        >
                          {subItem.label}
                        </Link>
                        {subItem.label === 'View Metrics' && (
                          <button
                            onClick={handleRefreshMetrics}
                            className="p-1 hover:bg-gray-600 rounded"
                            title="Refresh metrics"
                          >
                            <FaSync className="text-xs" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div
                className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-700 ${
                  pathname === item.href ? 'bg-gray-600 font-bold' : ''
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
              </div>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default memo(AdminSidebar);

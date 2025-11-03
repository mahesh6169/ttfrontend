'use client';

import Link from 'next/link';
import { MdLocalOffer, MdCardGiftcard } from 'react-icons/md';

export default function PromotionsPage() {
  const menuItems = [
    {
      title: 'Discount Codes',
      description: 'Browse discount campaigns',
      icon: <MdLocalOffer className="w-16 h-16" />,
      href: '/discountcode',
      color: 'bg-teal-500 hover:bg-teal-600'
    },
    {
      title: 'Coming Soon',
      description: 'More deals and offers',
      icon: <MdCardGiftcard className="w-16 h-16" />,
      href: '#',
      color: 'bg-amber-500 hover:bg-amber-600',
      disabled: true
    }
  ];

  return (
    <div className="flex flex-col relative min-h-[calc(100vh-200px)]">
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-3 md:gap-6 mt-4">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? '#' : item.href}
              className={`relative block ${item.disabled ? 'pointer-events-none' : ''}`}
            >
              <div
                className={`
                  ${item.color}
                  ${item.disabled ? 'opacity-50' : ''}
                  rounded-lg sm:rounded-xl shadow-lg p-3 sm:p-4 md:p-8
                  text-white text-center
                  transition-all duration-300
                  transform hover:scale-105 hover:shadow-xl
                  flex flex-col items-center justify-center
                  min-h-[140px] sm:min-h-[180px] md:min-h-[220px]
                `}
              >
                <div className="mb-2 sm:mb-3 md:mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
                    {item.icon}
                  </div>
                </div>
                <h2 className="text-base sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm md:text-base opacity-90">
                  {item.description}
                </p>
                {item.disabled && (
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white text-gray-700 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-medium">
                    Soon
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

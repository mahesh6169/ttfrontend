'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_DESTINATIONS } from '@/utils/constants/destinations';

// Bottom nav holds the public destinations only, read from the shared list
// (utils/constants/destinations). "My stuff" (profile) lives behind the header burger and
// profile drawer below lg. Icon sizes are kept per-item here to preserve this bar's look;
// the shared list owns the href, label and icon.
const BOTTOM_ICON_SIZE = {
  '/': 20,
  '/listings': 18,
  '/events': 16,
  '/deals': 16,
  '/coupons': 18,
  '/threads': 20,
};

// The event booking flow (tickets / seats / checkout) hides the bottom nav so the flow's sticky
// action bar (e.g. "Select Seats") owns the bottom edge — the same exemption idea as the footer's
// (Footer.jsx). Matched at segment boundaries so the standalone /tickets landing is unaffected.
const BOTTOM_NAV_EXEMPT_PATHS = [
  '/events/tickets',
  '/events/seats',
  '/events/checkout',
];

const isBottomNavExempt = (pathname) => {
  if (!pathname) return false;
  return BOTTOM_NAV_EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
};

const BottomNavigation = () => {
  const pathname = usePathname();

  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  if (isBottomNavExempt(pathname)) return null;

  return (
    <div data-testid="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-40 safe-area-inset-pb shadow-sm">
      <div className="flex items-center justify-around h-14">
        {NAV_DESTINATIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
              isActive(d.href) ? 'text-teal-900 font-semibold' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <div className="h-5 flex items-center justify-center">
              <d.Icon size={BOTTOM_ICON_SIZE[d.href]} />
            </div>
            <span className="text-[10px] mt-0.5">
              {d.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;

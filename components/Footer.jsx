'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The one global footer is rendered once in the root layout (app/layout.jsx). It is
// ON everywhere by default; a page is footer-less only if its path matches one of
// these prefixes. Matching is at segment boundaries, so '/events/tickets' covers the
// booking flow '/events/tickets/*' but never the standalone '/tickets', and
// '/users/profile' covers the profile console but not '/users/emailverify' or
// '/users/pwdreset'. See featureplans/shared-footer-global.md.
const FOOTER_EXEMPT_PATHS = [
  '/chat',            // full-screen messaging
  '/admin',           // internal tooling
  '/users/profile',   // app console (my tickets, settings, dashboards)
  '/events/tickets',  // event booking flow - all four OFF
  '/events/seats',
  '/events/checkout',
  '/events/rsvp',
  '/events/add',      // create/edit wizard - sticky toolbar owns the bottom edge
  '/events/add-paid',
  '/events/edit',
  '/validate',        // QR redeem utility
  '/share',           // utility
  '/home-test',       // test/junk page
  '/abc',             // test/junk pages
];

const isFooterExempt = (pathname) => {
  if (!pathname) return false;
  return FOOTER_EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
};

const Footer = () => {
  const pathname = usePathname();
  if (isFooterExempt(pathname)) return null;

  return (
    <footer id="Footer" className="block bg-white mt-8 pb-6">
      <div className="w-full py-2 text-slate-700 text-base">
        {/* All elements in one row */}
        <div className="relative flex items-center px-4">
          {/* Center - Links */}
          <div className="flex items-center gap-3 mx-auto">
            <Link href="/support/terms" className="underline hover:text-slate-900 transition-colors">
              Terms
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/support/privacy" className="underline hover:text-slate-900 transition-colors">
              Privacy
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/support/contact" className="underline hover:text-slate-900 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

'use client';

import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="Footer" className="hidden md:block bg-white border-t border-gray-200 shadow-md mt-8">
      <div className="w-full py-2 text-slate-700 text-sm">
        {/* All elements in one row */}
        <div className="relative flex items-center px-4">
          {/* Center - Links */}
          <div className="flex items-center gap-3 mx-auto">
            <Link href="/support/terms" className="hover:text-slate-900 transition-colors">
              Terms
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/support/privacy" className="hover:text-slate-900 transition-colors">
              Privacy
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/support/contact" className="hover:text-slate-900 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

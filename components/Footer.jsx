'use client';

import Link from 'next/link';
import ShareIcons from './shared/ShareIcons';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="Footer" className="hidden md:block bg-white border-t border-gray-200 shadow-md mt-8">
      <div className="w-full py-2 text-teal-700 text-sm">
        {/* All elements in one row */}
        <div className="relative flex items-center px-4">
          {/* Center - Links */}
          <div className="flex items-center gap-3 mx-auto">
            <Link href="/support/terms" className="hover:text-teal-600 transition-colors">
              Terms
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/support/privacy" className="hover:text-teal-600 transition-colors">
              Privacy
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/support/contact" className="hover:text-teal-600 transition-colors">
              Contact
            </Link>
          </div>
          
          {/* Far Right - Social links */}
          <div className="absolute right-4">
            <ShareIcons 
              type="share"
              title="Desify - Your Local Marketplace"
              compact={true}
              className="text-teal-700"
              hoverClassName="hover:text-teal-600"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

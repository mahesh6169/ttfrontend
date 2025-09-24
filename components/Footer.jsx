'use client';

import Link from 'next/link';
import ShareIcons from './shared/ShareIcons';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="Footer" className="hidden md:block bg-teal-700 shadow mt-8">
      <div className="w-full py-2 text-lime-100 text-sm">
        {/* All elements in one row */}
        <div className="relative flex items-center px-4">
          {/* Center - Links */}
          <div className="flex items-center gap-3 mx-auto">
            <Link href="/support/terms" className="hover:underline">
              Terms
            </Link>
            <span className="text-lime-300">•</span>
            <Link href="/support/privacy" className="hover:underline">
              Privacy
            </Link>
            <span className="text-lime-300">•</span>
            <Link href="/support/contact" className="hover:underline">
              Contact
            </Link>
          </div>
          
          {/* Far Right - Social links */}
          <div className="absolute right-4">
            <ShareIcons 
              type="share"
              title="Desify - Your Local Marketplace"
              compact={true}
              className="text-lime-100"
              hoverClassName="hover:text-lime-50"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

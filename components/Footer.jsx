'use client';

import Link from 'next/link';
import ShareIcons from './shared/ShareIcons';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="Footer" className="hidden md:block bg-teal-700 shadow mt-8">
      <div className="container mx-auto py-2 text-lime-100 text-sm">
        {/* Row 1 - Links */}
        <div className="flex justify-center items-center gap-3 px-4">
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
        
        {/* Row 2 - Copyright and Social */}
        <div className="flex justify-between items-center px-4 mt-2">
          {/* Left - Copyright */}
          <span>© {currentYear} Telugufy</span>
          
          {/* Right - Social links */}
          <ShareIcons 
            type="share"
            title="Desify - Your Local Marketplace"
            compact={true}
            className="text-lime-100"
            hoverClassName="hover:text-lime-50"
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

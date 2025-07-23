'use client';

import Link from 'next/link';
import { FaFacebookF, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="Footer" className="bg-teal-700 shadow mt-8">
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
          <div className="flex gap-2">
            <a
              href="https://www.facebook.com/sharer/sharer.php?u=https://www.tagtelugu.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-lime-50"
              title="Share on Facebook"
            >
              <FaFacebookF size={16} />
            </a>
            <a
              href="https://api.whatsapp.com/send?text=Check%20out%20Telugufy%20-%20https://www.tagtelugu.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-lime-50"
              title="Share on WhatsApp"
            >
              <FaWhatsapp size={16} />
            </a>
            <a
              href="https://twitter.com/intent/tweet?url=https://www.tagtelugu.com.au&text=Check%20out%20Telugufy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-lime-50"
              title="Share on X (Twitter)"
            >
              <FaXTwitter size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

'use client';

import Link from 'next/link';
import { FaFacebookF, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer id="Footer" className="my-4 py-4 px-4 bg-gray-50 text-gray-700 text-sm">
      <div className="flex justify-between items-center flex-wrap gap-2">
        {/* Left side links */}
        <div className="flex gap-4">
          <Link href="/support/terms" target="_blank" className="hover:underline">
            Terms & Conditions
          </Link>
          <Link href="/support/privacy" target="_blank" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/support/contact" className="hover:underline">
            Contact Us
          </Link>
        </div>

        {/* Right side social share */}
        <div className="flex gap-4">
          <a
            href="https://www.facebook.com/sharer/sharer.php?u=https://www.tagtelugu.com.au/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600"
          >
            <FaFacebookF size={18} />
          </a>
          <a
            href="https://api.whatsapp.com/send?text=Check%20this%20out%20https://www.tagtelugu.com.au/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-green-600"
          >
            <FaWhatsapp size={18} />
          </a>
          <a
            href="https://twitter.com/intent/tweet?url=https://yourwebsite.com&text=Check%20this%20out"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-500"
          >
            <FaXTwitter size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

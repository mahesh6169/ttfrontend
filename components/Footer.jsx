'use client';

import Link from 'next/link';
import { FaFacebookF, FaWhatsapp, FaXTwitter } from 'react-icons/fa6';

const Footer = () => {
  return (
<footer id="Footer" className="my-4 py-4 px-2 bg-teal-700 text-lime-100">
  <div className="flex flex-col sm:flex-row justify-between items-center flex-wrap gap-3 sm:gap-4">
    {/* Left side links */}
    <div className="flex gap-4 text-sm">
      <Link href="/support/terms" target="_blank" className="hover:bg-lime-50 hover:text-teal-700">
        Terms & Conditions
      </Link>
      <Link href="/support/privacy" target="_blank" className="hover:bg-lime-50 hover:text-teal-700">
        Privacy Policy
      </Link>
      <Link href="/support/contact" className="hover:bg-lime-50 hover:text-teal-700">
        Contact Us
      </Link>
    </div>

    {/* Right side social share */}
    <div className="flex gap-2 text-sm">
      <a
        href="https://www.facebook.com/sharer/sharer.php?u=https://www.tagtelugu.com.au/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:bg-lime-50 hover:text-teal-700"
      >
        <FaFacebookF size={18} />
      </a>
      <a
        href="https://api.whatsapp.com/send?text=Check%20this%20out%20https://www.tagtelugu.com.au/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:bg-lime-50 hover:text-teal-700"
      >
        <FaWhatsapp size={18} />
      </a>
      <a
        href="https://twitter.com/intent/tweet?url=https://yourwebsite.com&text=Check%20this%20out"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:bg-lime-50 hover:text-teal-700"
      >
        <FaXTwitter size={18} />
      </a>
    </div>
  </div>
</footer>

  );
};

export default Footer;

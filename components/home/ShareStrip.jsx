'use client';

import { useState } from 'react';
import { FaFacebookF, FaWhatsapp, FaCopy, FaShareAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Small "share the site" strip for the home page. Shares the SITE ROOT only
// (canonical NEXT_PUBLIC_WEBSITE_URL, falling back to origin) - never a /views/[id]
// path, so it stays within the slug-url rule without needing buildSlugUrl.
// Kept separate from the shared ShareIcons so event/footer share rows are untouched.
const SITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
const SHARE_TEXT = 'Check out Desify - your local community marketplace';

const iconBtn =
  'w-8 h-8 p-1.5 rounded-full flex items-center justify-center transition-colors duration-200 cursor-pointer';
const neutral = 'bg-slate-200 hover:bg-slate-300 text-slate-700';

const ShareStrip = () => {
  const [copied, setCopied] = useState(false);

  const getUrl = () =>
    SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  const shareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getUrl())}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const shareWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n${getUrl()}`)}`,
      '_blank',
      'width=600,height=400'
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getUrl());
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3">
      <FaShareAlt className="w-4 h-4 text-slate-500 mr-1" aria-hidden="true" />
      <button onClick={shareFacebook} aria-label="Share on Facebook" className={`${iconBtn} bg-[#1877F2] hover:bg-[#166FE5] text-white`}>
        <FaFacebookF className="w-4 h-4" />
      </button>
      <button onClick={shareWhatsApp} aria-label="Share on WhatsApp" className={`${iconBtn} bg-[#25D366] hover:bg-[#20BA5A] text-white`}>
        <FaWhatsapp className="w-4 h-4" />
      </button>
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className={`${iconBtn} ${copied ? 'bg-green-500 text-white' : neutral}`}
      >
        <FaCopy className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ShareStrip;

import React, { useState, useEffect } from 'react';
import { FaCopy, FaWhatsapp, FaShareAlt } from 'react-icons/fa';
import { buildSlugUrl } from '@/utils/slugUtils';
import { toast } from 'react-toastify';

const ShareIcons = ({ type, title, id, className = '', compact = false, hoverClassName = '' }) => {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if native share is available and if on mobile
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
    setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
  }, []);
  
  // Generate the full URL
  let fullUrl;
  if (type === 'website' || type === 'share') {
    // For website/share, use the homepage URL
    fullUrl = typeof window !== 'undefined' 
      ? window.location.origin
      : process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://desify.com.au';
  } else {
    // For specific items, use slug URL
    const slugUrl = buildSlugUrl(type, title, id);
    fullUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${slugUrl}`
      : slugUrl;
    
    // Always add timestamp to bust WhatsApp cache
    const timestamp = Date.now();
    fullUrl = `${fullUrl}?v=${timestamp}`;
  }
  
  const handleCopyLink = async () => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback for older browsers or non-HTTPS
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopied(true);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          toast.error('Failed to copy link - please copy manually');
          console.error('Copy failed:', err);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Clipboard error:', err);
      toast.error('Failed to copy link - please copy manually');
    }
  };
  
  const handleShare = (platform) => {
    const encodedUrl = encodeURIComponent(fullUrl);

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodedUrl}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  // Native share for mobile devices
  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: title || 'Check this out',
        text: title || 'Check this out',
        url: fullUrl
      });
    } catch (err) {
      // User cancelled or share failed - silently ignore
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };
  
  const iconClass = compact 
    ? "transition-all duration-200 cursor-pointer" 
    : "w-8 h-8 p-1.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer";
  
  const iconSize = compact ? "w-4 h-4" : "w-4 h-4";
  
  const greyButtonClass = `${iconClass} bg-slate-200 hover:bg-slate-300 text-slate-700`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Native Share - mobile only */}
      {canNativeShare && isMobile && !compact && (
        <button
          onClick={handleNativeShare}
          className={greyButtonClass}
          title="Share"
        >
          <FaShareAlt className={iconSize} />
        </button>
      )}

      {/* Copy Link - hide in compact mode */}
      {!compact && (
        <button
          onClick={handleCopyLink}
          className={`${iconClass} ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }`}
          title="Copy link"
        >
          <FaCopy className={iconSize} />
        </button>
      )}

      {/* WhatsApp */}
      <button
        onClick={() => handleShare('whatsapp')}
        className={compact ? hoverClassName : greyButtonClass}
        title="Share on WhatsApp"
      >
        <FaWhatsapp className={compact ? "text-base" : iconSize} />
      </button>
    </div>
  );
};

export default ShareIcons;
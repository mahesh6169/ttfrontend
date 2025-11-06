import React, { useState } from 'react';
import { FaCopy, FaWhatsapp, FaFacebookF } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { buildSlugUrl } from '@/utils/slugUtils';
import { toast } from 'react-toastify';

const ShareIcons = ({ type, title, id, className = '', compact = false, hoverClassName = '' }) => {
  const [copied, setCopied] = useState(false);
  
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
    const encodedTitle = encodeURIComponent(title);
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodedUrl}`, // Encode URL for WhatsApp
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };
  
  const iconClass = compact 
    ? "transition-all duration-200 cursor-pointer" 
    : "w-8 h-8 p-1.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer";
  
  const iconSize = compact ? "w-4 h-4" : "w-4 h-4";
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Copy Link - hide in compact mode */}
      {!compact && (
        <button
          onClick={handleCopyLink}
          className={`${iconClass} ${
            copied 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          title="Copy link"
        >
          <FaCopy className={iconSize} />
        </button>
      )}
      
      {/* WhatsApp */}
      <button
        onClick={() => handleShare('whatsapp')}
        className={compact ? hoverClassName : `${iconClass} bg-green-500 hover:bg-green-600 text-white`}
        title="Share on WhatsApp"
      >
        <FaWhatsapp className={compact ? "text-base" : iconSize} />
      </button>
      
      {/* Facebook */}
      <button
        onClick={() => handleShare('facebook')}
        className={compact ? hoverClassName : `${iconClass} bg-blue-600 hover:bg-blue-700 text-white`}
        title="Share on Facebook"
      >
        <FaFacebookF className={compact ? "text-base" : iconSize} />
      </button>
      
      {/* Twitter/X */}
      <button
        onClick={() => handleShare('twitter')}
        className={compact ? hoverClassName : `${iconClass} bg-black hover:bg-gray-800 text-white`}
        title="Share on X"
      >
        <FaXTwitter className={compact ? "text-base" : iconSize} />
      </button>
    </div>
  );
};

export default ShareIcons;
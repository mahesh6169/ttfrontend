import React, { useState, useEffect } from 'react';
import { FaCopy, FaWhatsapp, FaShareAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

const ShareIconsCampaign = ({ slug, title, storeName, className = '', compact = false, hoverClassName = '' }) => {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if native share is available and if on mobile
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
    setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
  }, []);

  const getShareUrl = () => {
    if (!slug) return null;
    const timestamp = Date.now();
    return `${window.location.origin}/discountcode/${slug}?v=${timestamp}`;
  };

  const handleCopyLink = async () => {
    const url = getShareUrl();
    if (!url) {
      toast.error('Share link not available');
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        
        setTimeout(() => setCopied(false), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
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
    const url = getShareUrl();
    if (!url) {
      toast.error('Share link not available');
      return;
    }

    const encodedUrl = encodeURIComponent(url);
    const text = title && storeName 
      ? `Check out this discount: ${title} at ${storeName}`
      : 'Check out this discount';
    const encodedText = encodeURIComponent(text);
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  // Native share for mobile devices
  const handleNativeShare = async () => {
    const url = getShareUrl();
    if (!url) {
      toast.error('Share link not available');
      return;
    }

    const text = title && storeName
      ? `Check out this discount: ${title} at ${storeName}`
      : 'Check out this discount';

    try {
      await navigator.share({
        title: title || 'Discount Code',
        text: text,
        url: url
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  };
  
  const iconClass = compact 
    ? "transition-all duration-200 cursor-pointer" 
    : "w-8 h-8 p-1.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer";
  
  const iconSize = compact ? "w-4 h-4" : "w-4 h-4";

  const greyButtonClass = `${iconClass} bg-gray-200 hover:bg-gray-300 text-gray-700`;

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

export default ShareIconsCampaign;

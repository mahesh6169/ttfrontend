import React, { useState } from 'react';
import { FaCopy, FaWhatsapp, FaFacebookF } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { toast } from 'react-toastify';

const ShareIconsCampaign = ({ slug, title, storeName, className = '', compact = false, hoverClassName = '' }) => {
  const [copied, setCopied] = useState(false);
  
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
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
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
        className={compact ? hoverClassName : `${iconClass} bg-green-500 hover:bg-green-600 text-white`}
        title="Share on WhatsApp"
      >
        <FaWhatsapp className={compact ? "text-base" : iconSize} />
      </button>
      
      <button
        onClick={() => handleShare('facebook')}
        className={compact ? hoverClassName : `${iconClass} bg-blue-600 hover:bg-blue-700 text-white`}
        title="Share on Facebook"
      >
        <FaFacebookF className={compact ? "text-base" : iconSize} />
      </button>
      
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

export default ShareIconsCampaign;

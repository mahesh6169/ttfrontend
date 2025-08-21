import React, { useState } from 'react';
import { FaCopy, FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { buildSlugUrl } from '@/utils/slugUtils';
import { toast } from 'react-toastify';

const ShareIcons = ({ type, title, id, className = '' }) => {
  const [copied, setCopied] = useState(false);
  
  // Generate the full URL
  const slugUrl = buildSlugUrl(type, title, id);
  const fullUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${slugUrl}`
    : slugUrl;
  
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
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      instagram: null // Instagram doesn't support direct URL sharing
    };
    
    if (platform === 'instagram') {
      // Copy link for Instagram
      handleCopyLink();
      toast.info('Link copied! Share it on Instagram');
      return;
    }
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };
  
  const iconClass = "w-8 h-8 p-1.5 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer";
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className={`${iconClass} ${
          copied 
            ? 'bg-green-500 text-white' 
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        title="Copy link"
      >
        <FaCopy className="w-4 h-4" />
      </button>
      
      {/* WhatsApp */}
      <button
        onClick={() => handleShare('whatsapp')}
        className={`${iconClass} bg-green-500 hover:bg-green-600 text-white`}
        title="Share on WhatsApp"
      >
        <FaWhatsapp className="w-4 h-4" />
      </button>
      
      {/* Instagram */}
      <button
        onClick={() => handleShare('instagram')}
        className={`${iconClass} bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white`}
        title="Share on Instagram"
      >
        <FaInstagram className="w-4 h-4" />
      </button>
      
      {/* Facebook */}
      <button
        onClick={() => handleShare('facebook')}
        className={`${iconClass} bg-blue-600 hover:bg-blue-700 text-white`}
        title="Share on Facebook"
      >
        <FaFacebookF className="w-4 h-4" />
      </button>
      
      {/* Twitter/X */}
      <button
        onClick={() => handleShare('twitter')}
        className={`${iconClass} bg-black hover:bg-gray-800 text-white`}
        title="Share on X"
      >
        <FaXTwitter className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ShareIcons;
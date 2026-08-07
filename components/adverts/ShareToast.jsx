import React, { useEffect, useState } from 'react';
import ShareIcons from '@/components/shared/ShareIcons';
import { FaTimes } from 'react-icons/fa';

const ShareToast = ({ title, id, duration = 15000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return prev - (100 / (duration / 100));
      });
    }, 100);
    
    // Auto close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration]);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for exit animation
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      {/* Progress bar */}
      <div className="h-1 bg-slate-200 rounded-t-lg overflow-hidden">
        <div 
          className="h-full bg-teal-600 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <span className="font-semibold text-slate-800">Listing Created!</span>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>
        
        {/* Share text */}
        <p className="text-sm text-slate-600 mb-3">Share your listing:</p>
        
        {/* Share icons */}
        <ShareIcons 
          type="listing"
          title={title}
          id={id}
          className="justify-center"
        />
      </div>
    </div>
  );
};

export default ShareToast;
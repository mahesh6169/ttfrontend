'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';
import StateSelectionModal from './StateSelectionModal';

const StateSelectionWrapper = () => {
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const pathname = usePathname();
  
  // Get user from Redux store
  const { user, tokenValidated, status } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  
  // Feature flag to control modal display
  const ENABLE_STATE_SELECTION = process.env.NEXT_PUBLIC_ENABLE_STATE_SELECTION === 'true';
  
  // Only show modal on specific pages where state matters
  const allowedPaths = ['/listings', '/events', '/threads'];
  const shouldCheckState = allowedPaths.includes(pathname);
  
  useEffect(() => {
    // Check if feature is enabled
    if (!ENABLE_STATE_SELECTION) {
      return;
    }
    
    // Only check on allowed paths
    if (!shouldCheckState) {
      return;
    }
    
    // Run check after validation completes (whether success or failure)
    if (status !== 'loading' && status !== 'idle' && !hasChecked) {
      checkStateSelection();
      setHasChecked(true);
    }
  }, [status, hasChecked, isAuthenticated, shouldCheckState, pathname, ENABLE_STATE_SELECTION]);
  
  const checkStateSelection = async () => {
    // Don't show modal if user is authenticated (they have state from suburb)
    if (isAuthenticated) {
      return;
    }
    
    try {
      // Check if user already has a state selected via cookie
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/bannerAds/getState`;
      const response = await fetch(apiUrl, {
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.NEXT_PUBLIC_FRONTEND_API_KEY && {
            'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY
          })
        }
      });
      const data = await response.json();
      
      // If user already has a state, don't show modal
      if (data.success && data.hasState) {
        return;
      }
      
      // For users without a state, ALWAYS show the modal
      // No cooldown period - we need them to select a state for revenue
      
      // Show modal after a short delay to not interfere with page load
      setTimeout(() => {
        setShowModal(true);
      }, 2000);
    } catch (error) {
      console.error('Error checking state selection:', error);
      // Don't show modal if we can't check state
    }
  };
  
  const handleModalClose = () => {
    setShowModal(false);
    // Don't store anything - we want to keep asking until they select a state
    // This ensures maximum revenue opportunity from state-based ads
  };
  
  return (
    <StateSelectionModal 
      isOpen={showModal} 
      onClose={handleModalClose}
    />
  );
};

export default StateSelectionWrapper;
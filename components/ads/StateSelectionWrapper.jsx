'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import StateSelectionModal from './StateSelectionModal';

const StateSelectionWrapper = () => {
  const [showModal, setShowModal] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Get user from Redux store
  const { user, tokenValidated } = useSelector((state) => state.user);
  const isAuthenticated = tokenValidated && !!user?._id;
  
  useEffect(() => {
    console.log('[StateSelection] Component mounted, tokenValidated:', tokenValidated, 'hasChecked:', hasChecked, 'isAuthenticated:', isAuthenticated);
    // Run check once we know if user is authenticated or not
    // For non-logged users, tokenValidated will be false after 401 response
    if (!hasChecked) {
      // Wait a bit for auth check to complete
      const timer = setTimeout(() => {
        console.log('[StateSelection] Running state check after timeout...');
        checkStateSelection();
        setHasChecked(true);
      }, 1000); // Give auth check 1 second to complete
      
      return () => clearTimeout(timer);
    }
  }, [hasChecked]);
  
  const checkStateSelection = async () => {
    // Don't show modal if user is authenticated (they have state from suburb)
    if (isAuthenticated) {
      return;
    }
    
    try {
      // Check if user already has a state selected via cookie
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/bannerAds/getState`;
      console.log('[StateSelection] Checking state at:', apiUrl);
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
      console.log('[StateSelection] State check response:', data);
      
      // If user already has a state, don't show modal
      if (data.success && data.hasState) {
        return;
      }
      
      // Check if we've shown the modal recently
      const hasSeenStateModal = localStorage.getItem('hasSeenStateModal');
      const lastShown = localStorage.getItem('stateModalLastShown');
      
      // Don't show if user has already seen it recently (within 30 days)
      if (hasSeenStateModal && lastShown) {
        const daysSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
        if (daysSinceShown < 30) {
          return;
        }
      }
      
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
    // Mark that user has seen the modal
    localStorage.setItem('hasSeenStateModal', 'true');
    localStorage.setItem('stateModalLastShown', Date.now().toString());
  };
  
  return (
    <StateSelectionModal 
      isOpen={showModal} 
      onClose={handleModalClose}
    />
  );
};

export default StateSelectionWrapper;
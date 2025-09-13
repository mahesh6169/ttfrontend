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
    // Only run check once authentication state is determined
    if (!hasChecked && tokenValidated) {
      checkStateSelection();
      setHasChecked(true);
    }
  }, [tokenValidated, hasChecked]);
  
  const checkStateSelection = () => {
    // Don't show modal if user is authenticated (they have state from suburb)
    if (isAuthenticated) {
      return;
    }
    
    // Check if userSelectedState cookie exists
    // Since httpOnly cookies can't be read by JavaScript, we'll check by making a request
    // or by checking if ads are being served (they would include state info)
    // For now, we'll check localStorage as a client-side indicator
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
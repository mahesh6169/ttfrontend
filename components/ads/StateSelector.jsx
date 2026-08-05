'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from '@/utils/axiosConfig';
import StateSelectionModal from './StateSelectionModal';

const StateSelector = () => {
  const [currentState, setCurrentState] = useState('');
  const [showStateModal, setShowStateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Get user from Redux store
  const { user } = useSelector((state) => state.user);
  const isAuthenticated = !!user?._id;
  
  // Fetch current state on mount
  useEffect(() => {
    fetchCurrentState();
  }, []);
  
  const fetchCurrentState = async () => {
    try {
      const response = await axios.get('/bannerAds/getState');
      console.log('StateSelector - Current state response:', response.data);
      
      if (response.data.success) {
        // For authenticated users, use their suburb's state
        if (isAuthenticated && response.data.state) {
          setCurrentState(response.data.state);
        } 
        // For non-authenticated users, use cookie state
        else if (!isAuthenticated && response.data.state) {
          setCurrentState(response.data.state);
        }
      }
    } catch (error) {
      console.error('Error fetching current state:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStateClick = () => {
    // Don't allow authenticated users to change state (they use suburb)
    if (isAuthenticated) {
      return;
    }
    setShowStateModal(true);
  };
  
  const handleModalClose = () => {
    setShowStateModal(false);
    // Refresh to get new state
    fetchCurrentState();
  };
  
  // Don't render if loading or no state
  if (loading || !currentState) {
    return null;
  }
  
  // Don't render for authenticated users (they can't change state)
  if (isAuthenticated) {
    return null;
  }
  
  return (
    <>
      <div className="text-center text-xs sm:text-sm text-slate-600 pb-1">
        Viewing ads for 
        <button 
          onClick={handleStateClick}
          className="ml-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-teal-700 hover:text-teal-800 font-medium transition-colors cursor-pointer"
          title="Click to change state"
        >
          {currentState} ▼
        </button>
      </div>
      
      <StateSelectionModal 
        isOpen={showStateModal} 
        onClose={handleModalClose}
      />
    </>
  );
};

export default StateSelector;
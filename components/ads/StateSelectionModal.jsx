'use client';
import { useState } from 'react';
import axios from '@/utils/axiosConfig';

const australianStates = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' }
];

const StateSelectionModal = ({ isOpen, onClose }) => {
  const [selectedState, setSelectedState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedState) return;

    setIsSubmitting(true);
    try {
      // Save state preference to backend (sets cookie)
      await axios.post('/bannerAds/setState', { state: selectedState });
      
      // Close modal and refresh page to show relevant ads
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Error saving state preference:', error);
      alert('Failed to save your state preference. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Select Your State
        </h3>
        
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-4">
            Please select your state to see relevant local advertisements and content.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {australianStates.map((state) => (
              <button
                key={state.code}
                onClick={() => setSelectedState(state.code)}
                className={`p-3 text-sm rounded-lg border-2 transition-all ${
                  selectedState === state.code
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{state.code}</div>
                <div className="text-xs text-gray-600 mt-1">{state.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!selectedState || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
          
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            onClick={onClose}
          >
            Skip
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          You can change this preference anytime in your profile settings.
        </p>
      </div>
    </div>
  );
};

export default StateSelectionModal;
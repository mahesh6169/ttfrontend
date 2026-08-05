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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg">
        <p className="text-sm sm:text-base font-medium text-slate-900 mb-4 text-center">
          Select your state to see relevant local deals and content in your area!
        </p>
        
        {/* State buttons - 8 cols on desktop, 4 cols on mobile */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
          {australianStates.map((state) => (
            <button
              key={state.code}
              onClick={() => setSelectedState(state.code)}
              className={`py-3 px-1 text-sm font-medium rounded-lg border-2 transition-all ${
                selectedState === state.code
                  ? 'border-teal-600 bg-teal-600 text-lime-100'
                  : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50'
              }`}
            >
              {state.code}
            </button>
          ))}
        </div>

        {/* Continue button */}
        <button
          type="button"
          className="w-full py-2.5 rounded-md bg-teal-700 text-lime-100 font-medium hover:bg-teal-800 hover:text-lime-50 shadow transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={!selectedState || isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </button>
        
        {/* Skip link */}
        <button
          type="button"
          className="w-full mt-2 text-xs text-teal-600 underline hover:text-teal-800"
          onClick={onClose}
        >
          Skip for now
        </button>
        
        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-slate-300"></div>
          <span className="px-3 text-xs text-slate-500">or</span>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>
        
        {/* Login/Register buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="/login"
            onClick={onClose}
            className="py-2 px-4 text-center text-sm font-medium text-teal-700 bg-white border border-teal-600 rounded-md hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
          >
            Log in
          </a>
          <a
            href="/register"
            onClick={onClose}
            className="py-2 px-4 text-center text-sm font-medium text-teal-700 bg-white border border-teal-600 rounded-md hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
};

export default StateSelectionModal;
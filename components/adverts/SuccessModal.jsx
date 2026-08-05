// components/adverts/SuccessModal.jsx

import React from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import ShareIcons from '@/components/shared/ShareIcons';
import { FaCheck, FaListAlt, FaPlus, FaEye } from 'react-icons/fa';

const SuccessModal = ({ 
  mode = 'add', // 'add' | 'edit'
  onAddAnother, 
  onManageListings,
  onViewListing
}) => {
  
  // Get advert from Redux
  const { advert } = useSelector(state => state.advert);
  const advertId = advert?._id || advert?.id;
  
  // Mode-specific configurations
  const modeConfig = {
    add: {
      title: '🎉 Listing Created Successfully!',
      subtitle: 'Your listing has been published and is now live.',
      icon: '✅',
      primaryAction: {
        label: 'Manage My Listings',
        icon: FaListAlt,
        handler: onManageListings
      },
      secondaryAction: {
        label: 'Add Another Listing',
        icon: FaPlus,
        handler: onAddAnother
      }
    },
    edit: {
      title: '✅ Listing Updated Successfully!', 
      subtitle: 'Your changes have been saved.',
      icon: '🔄',
      primaryAction: {
        label: 'View Listing',
        icon: FaEye,
        handler: onViewListing
      },
      secondaryAction: {
        label: 'Manage My Listings',
        icon: FaListAlt,
        handler: onManageListings
      }
    }
  };

  const config = modeConfig[mode] || modeConfig.add;

  return (
    <div className="w-full">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          
          {/* Success Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          
          {/* Success Message */}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            {config.title}
          </h2>
          <p className="text-slate-600 mb-6">
            {config.subtitle}
          </p>
          
          {/* Share Section */}
          <div className="border-t border-b border-slate-200 py-4 mb-6">
            <p className="text-sm text-slate-600 mb-3">Share your listing:</p>
            <div className="flex items-center justify-center">
              <ShareIcons
                type="listing"
                title={advert?.title || 'Listing'}
                id={advertId}
              />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={config.primaryAction.handler}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <config.primaryAction.icon className="w-4 h-4" />
              {config.primaryAction.label}
            </button>
            
            <button
              onClick={config.secondaryAction.handler}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <config.secondaryAction.icon className="w-4 h-4" />
              {config.secondaryAction.label}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
// components/threads/SuccessView.jsx

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShareIcons from '@/components/shared/ShareIcons';
import { FaCheck, FaListAlt, FaPlus, FaEye, FaComments } from 'react-icons/fa';

const SuccessView = ({ 
  thread,
  mode = 'add', // 'add' | 'edit'
  onAddAnother
}) => {
  const router = useRouter();
  
  // Mode-specific configurations
  const modeConfig = {
    add: {
      title: '🎉 Topic Created Successfully!',
      subtitle: 'Your topic has been published and is ready for discussion.',
      icon: '✅',
      primaryAction: {
        label: 'View Topic',
        icon: FaComments,
        handler: () => router.push(`/threads/view/${thread?._id || thread?.id}`)
      },
      secondaryAction: {
        label: 'Create Another Topic',
        icon: FaPlus,
        handler: onAddAnother
      }
    },
    edit: {
      title: '✅ Topic Updated Successfully!', 
      subtitle: 'Your changes have been saved.',
      icon: '🔄',
      primaryAction: {
        label: 'View Topic',
        icon: FaEye,
        handler: () => router.push(`/threads/view/${thread?._id || thread?.id}`)
      },
      secondaryAction: {
        label: 'Back to Topics',
        icon: FaListAlt,
        handler: () => router.push('/threads')
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {config.subtitle}
          </p>
          
          
          {/* Share Section */}
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <p className="text-sm text-gray-600 mb-3">Share this topic:</p>
            <div className="flex items-center justify-center">
              <ShareIcons 
                type="thread"
                title={thread?.title || 'Topic'}
                id={thread?._id || thread?.id}
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
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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

export default SuccessView;
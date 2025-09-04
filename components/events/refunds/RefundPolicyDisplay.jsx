'use client';

import { IoInformationCircleOutline } from 'react-icons/io5';

export default function RefundPolicyDisplay({ 
  refundPolicy, 
  variant = 'default',
  showNote = true 
}) {
  if (!refundPolicy) return null;

  const processingFeeRefundable = refundPolicy.processingFeePolicy === 'refundable';
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'checkout':
        return {
          container: 'bg-amber-50 border border-amber-200 rounded-md sm:rounded-lg p-2 sm:p-3 lg:p-4',
          icon: 'text-amber-600 w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5',
          title: 'text-[11px] sm:text-xs lg:text-sm font-medium text-amber-900',
          text: 'text-[10px] sm:text-xs lg:text-sm text-amber-700'
        };
      case 'compact':
        return {
          container: 'bg-gray-50 border border-gray-200 rounded-md p-2 sm:p-3',
          icon: 'text-gray-500 w-3 h-3 sm:w-4 sm:h-4',
          title: 'text-[10px] sm:text-xs font-medium text-gray-700',
          text: 'text-[10px] sm:text-xs text-gray-600'
        };
      default:
        return {
          container: 'bg-blue-50 border border-blue-200 rounded-md sm:rounded-lg p-2 sm:p-3 lg:p-4',
          icon: 'text-blue-600 w-4 h-4 sm:w-5 sm:h-5',
          title: 'text-xs sm:text-sm font-medium text-blue-900',
          text: 'text-xs sm:text-sm text-blue-700'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={styles.container}>
      <div className="flex items-start">
        <IoInformationCircleOutline className={`${styles.icon} mr-1.5 sm:mr-2 flex-shrink-0`} />
        <div className="flex-1">
          <h4 className={styles.title}>Refund Policy</h4>
          <div className={`${styles.text} mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1`}>
            <p>
              • Processing fees are <span className="font-medium">
                {processingFeeRefundable ? 'refundable' : 'non-refundable'}
              </span>
            </p>
            {refundPolicy.policyText && (
              <p>• {refundPolicy.policyText}</p>
            )}
            {showNote && (
              <p className="mt-1 sm:mt-2 italic">
                Note: Refunds may take 3-5 business days to process. Refunded tickets will be cancelled and seats will be released.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
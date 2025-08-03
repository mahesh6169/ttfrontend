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
          container: 'bg-amber-50 border border-amber-200 rounded-lg p-4',
          icon: 'text-amber-600',
          title: 'text-sm font-medium text-amber-900',
          text: 'text-sm text-amber-700'
        };
      case 'compact':
        return {
          container: 'bg-gray-50 border border-gray-200 rounded-md p-3',
          icon: 'text-gray-500',
          title: 'text-xs font-medium text-gray-700',
          text: 'text-xs text-gray-600'
        };
      default:
        return {
          container: 'bg-blue-50 border border-blue-200 rounded-lg p-4',
          icon: 'text-blue-600',
          title: 'text-sm font-medium text-blue-900',
          text: 'text-sm text-blue-700'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={styles.container}>
      <div className="flex items-start">
        <IoInformationCircleOutline className={`h-5 w-5 ${styles.icon} mr-2 flex-shrink-0`} />
        <div className="flex-1">
          <h4 className={styles.title}>Refund Policy</h4>
          <div className={`${styles.text} mt-1 space-y-1`}>
            <p>
              • Processing fees are <span className="font-medium">
                {processingFeeRefundable ? 'refundable' : 'non-refundable'}
              </span>
            </p>
            {refundPolicy.policyText && (
              <p>• {refundPolicy.policyText}</p>
            )}
            {showNote && (
              <p className="mt-2 italic">
                Note: Refunds may take 3-5 business days to process. Refunded tickets will be cancelled and seats will be released.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
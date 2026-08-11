'use client';

import {
  IoInformationCircleOutline,
  IoShieldCheckmarkOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
} from 'react-icons/io5';

export default function RefundPolicyDisplay({ 
  refundPolicy, 
  variant = 'default',
  showNote = true 
}) {
  if (!refundPolicy) return null;

  const processingFeeRefundable = refundPolicy.processingFeePolicy === 'refundable';

  // Checkout: a neutral slate card (design-system.md palette - slate + teal only). A shield-icon
  // heading, then each policy point on its own line with a round status icon (teal check = allowed/
  // refundable, slate cross = a restriction), and - when the organiser added them - a divider and a
  // Terms & Conditions sub-block (events-terms-conditions.md).
  if (variant === 'checkout') {
    const hasTerms = refundPolicy.termsAndConditions && refundPolicy.termsAndConditions.trim();
    const hasPolicyText = refundPolicy.policyText && refundPolicy.policyText.trim();
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <IoShieldCheckmarkOutline className="text-teal-700 w-5 h-5 flex-shrink-0" />
          <h4 className="text-sm font-semibold text-slate-900">Refund Policy</h4>
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-2">
            {processingFeeRefundable ? (
              <IoCheckmarkCircle className="text-teal-600 w-4 h-4 flex-shrink-0 mt-0.5" />
            ) : (
              <IoCloseCircle className="text-slate-400 w-4 h-4 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-slate-700">
              Processing fees are{' '}
              <span className="font-medium">{processingFeeRefundable ? 'refundable' : 'non-refundable'}</span>.
            </p>
          </div>
          {hasPolicyText && (
            <div className="flex items-start gap-2">
              <IoCloseCircle className="text-slate-400 w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700 whitespace-pre-line">{refundPolicy.policyText}</p>
            </div>
          )}
        </div>

        {/* Organiser Terms & Conditions (events-terms-conditions.md), after the refund policy. */}
        {hasTerms && (
          <>
            <div className="border-t border-slate-200 my-3" />
            <h4 className="text-sm font-semibold text-slate-900 mb-1.5">Terms &amp; Conditions</h4>
            {/* Long organiser terms (capped at 2000 chars) scroll inside their own area rather than
                stretching the whole card. */}
            <p className="text-sm text-slate-700 whitespace-pre-line max-h-48 overflow-y-auto pr-1">
              {refundPolicy.termsAndConditions}
            </p>
          </>
        )}
      </div>
    );
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'bg-slate-50 border border-slate-200 rounded-md p-2 sm:p-3',
          icon: 'text-slate-500 w-3 h-3 sm:w-4 sm:h-4',
          title: 'text-[10px] sm:text-xs font-medium text-slate-700',
          text: 'text-[10px] sm:text-xs text-slate-600'
        };
      default:
        return {
          container: 'bg-teal-50 border border-teal-200 rounded-md sm:rounded-lg p-2 sm:p-3 lg:p-4',
          icon: 'text-teal-600 w-4 h-4 sm:w-5 sm:h-5',
          title: 'text-xs sm:text-sm font-medium text-teal-900',
          text: 'text-xs sm:text-sm text-teal-700'
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
            {/* Organiser Terms & Conditions (events-terms-conditions.md), after the refund policy. */}
            {refundPolicy.termsAndConditions && (
              <p className="whitespace-pre-line">
                • <span className="font-medium">Terms &amp; Conditions:</span> {refundPolicy.termsAndConditions}
              </p>
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
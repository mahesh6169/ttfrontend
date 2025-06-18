// components/events/refunds/RefundPolicyDisplay.jsx

'use client';

import React from 'react';
import PropTypes from 'prop-types';

const RefundPolicyDisplay = ({ 
  refundPolicy, 
  variant = 'default',
  showNote = true,
  className = '',
  onPolicyDisplayed = null 
}) => {
  // Early return if no policy provided
  if (!refundPolicy) {
    return null;
  }

  // Call onPolicyDisplayed callback when component mounts/renders
  React.useEffect(() => {
    if (onPolicyDisplayed && typeof onPolicyDisplayed === 'function') {
      onPolicyDisplayed({
        policyType: refundPolicy.processingFeePolicy || 'non-refundable',
        policyText: refundPolicy.policyText || '',
        policyDisplayed: true
      });
    }
  }, [refundPolicy, onPolicyDisplayed]);

  // Determine if policy is customer-friendly
  const isCustomerFriendly = refundPolicy.processingFeePolicy === 'refunded';

  // Variant-specific styling
  const getVariantStyles = () => {
    const baseStyles = 'rounded-lg p-4 border';
    
    switch (variant) {
      case 'compact':
        return `${baseStyles} bg-gray-50 border-gray-200`;
      case 'checkout':
        return `${baseStyles} bg-yellow-50 border-yellow-200`;
      case 'modal':
        return `${baseStyles} bg-blue-50 border-blue-200`;
      case 'card':
        return `${baseStyles} bg-white border-gray-300 shadow-sm`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-200`;
    }
  };

  // Get appropriate colors based on variant
  const getColors = () => {
    switch (variant) {
      case 'compact':
        return {
          primary: 'text-gray-800',
          secondary: 'text-gray-600',
          icon: 'text-gray-600',
          accent: 'text-gray-700'
        };
      case 'checkout':
        return {
          primary: 'text-yellow-800',
          secondary: 'text-yellow-700',
          icon: 'text-yellow-600',
          accent: 'text-yellow-600'
        };
      case 'modal':
        return {
          primary: 'text-blue-800',
          secondary: 'text-blue-700',
          icon: 'text-blue-600',
          accent: 'text-blue-600'
        };
      case 'card':
        return {
          primary: 'text-gray-900',
          secondary: 'text-gray-700',
          icon: 'text-gray-600',
          accent: 'text-blue-600'
        };
      default:
        return {
          primary: 'text-blue-800',
          secondary: 'text-blue-700',
          icon: 'text-blue-600',
          accent: 'text-blue-600'
        };
    }
  };

  const colors = getColors();

  // Get simple policy text (matching RefundPolicyStep approach)
  const getPolicyText = () => {
    if (isCustomerFriendly) {
      return 'Processing fees are refunded';
    } else {
      return 'Processing fees are non-refundable';
    }
  };

  // Compact variant for smaller spaces
  if (variant === 'compact') {
    return (
      <div className={`${getVariantStyles()} ${className}`}>
        <div className="flex items-start text-sm">
          <svg className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <span className={`font-medium ${colors.primary}`}>
              {getPolicyText()}
            </span>
          </div>
        </div>
        {refundPolicy.policyText && (
          <div className="mt-2 text-xs text-gray-600 italic pl-6">
            "{refundPolicy.policyText}"
          </div>
        )}
      </div>
    );
  }

  // Full variant (default) - Simplified like RefundPolicyStep
  return (
    <div className={`${getVariantStyles()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className={`w-5 h-5 ${colors.icon} mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h4 className={`font-medium ${colors.primary} mb-2`}>
            Refund Policy
          </h4>
          
          <div className={`text-sm ${colors.secondary} space-y-2`}>
            {/* Simple Policy Statement */}
            <div className="flex items-start">
              <svg className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <div className="font-medium mb-1">{getPolicyText()}</div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  Processing fees include platform fees ($0.50) and payment processing (1.7% + $0.30 per transaction).
                  <br />
                  Example: For a $10 ticket, the processing fee would be approximately $1.00.
                </div>
              </div>
            </div>

            {/* Additional Policy Text */}
            {refundPolicy.policyText && (
              <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border border-opacity-50">
                <p className={`text-sm ${colors.primary} italic`}>
                  "{refundPolicy.policyText}"
                </p>
              </div>
            )}

            {/* Policy Summary Note */}
            {showNote && (
              <div className={`mt-3 text-xs ${colors.accent} bg-white bg-opacity-30 rounded p-2`}>
                💡 <strong>Note:</strong> {
                  variant === 'checkout' 
                    ? 'Please review and acknowledge this refund policy below before completing your purchase.'
                    : "You'll need to acknowledge this refund policy during checkout before completing your purchase."
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

RefundPolicyDisplay.propTypes = {
  refundPolicy: PropTypes.shape({
    processingFeePolicy: PropTypes.oneOf(['refunded', 'non-refundable']),
    policyText: PropTypes.string
  }),
  variant: PropTypes.oneOf(['default', 'compact', 'checkout', 'modal', 'card']),
  showNote: PropTypes.bool,
  className: PropTypes.string,
  onPolicyDisplayed: PropTypes.func
};

RefundPolicyDisplay.defaultProps = {
  refundPolicy: null,
  variant: 'default',
  showNote: true,
  className: '',
  onPolicyDisplayed: null
};

export default RefundPolicyDisplay;
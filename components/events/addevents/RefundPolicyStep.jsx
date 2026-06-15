import React from 'react';
import { useDispatch } from 'react-redux';
import { updateRefundPolicy } from '@/store/slices/events/eventSlice';

// Platform fee configuration
const PLATFORM_FEES = {
  flatFee: 0.80,
  percentageFee: 2.0,
};

const RefundPolicyStep = ({
  formData = {},
  errors = {},
  mode = 'add',
  readOnly = false
}) => {
  const dispatch = useDispatch();
  const disabled = readOnly || mode === 'view';

  const handleRefundPolicyChange = (field, value) => {
    if (disabled) return;
    dispatch(updateRefundPolicy({ field, value }));
  };

  // Don't show refund policy step for free events
  if (!formData.isPaid) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center py-8">
          <p className="text-slate-600 text-sm">
            Refund policy is not required for free events.
          </p>
        </div>
      </div>
    );
  }

  const selectedPolicy = formData.refundPolicy?.processingFeePolicy || 'non-refundable';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Explanation */}
      <p className="text-sm text-slate-600 mb-3">
        Choose how refunds are handled. This will be shown to customers at checkout.
      </p>

      {/* Refund Options */}
      <div className="space-y-3">
        {/* Non-refundable option */}
        <label
          className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedPolicy === 'non-refundable'
              ? 'border-teal-700 bg-teal-50/50'
              : 'border-slate-200 hover:border-slate-300'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="processingFeePolicy"
              value="non-refundable"
              checked={selectedPolicy === 'non-refundable'}
              onChange={() => handleRefundPolicyChange('processingFeePolicy', 'non-refundable')}
              disabled={disabled}
              className="mt-0.5 w-4 h-4 text-teal-700 border-slate-300 focus:ring-teal-300"
            />
            <div className="flex-1">
              <span className="block text-sm font-medium text-slate-700">
                Platform fees are non-refundable
              </span>
              <span className="block text-xs text-slate-500 mt-1">
                Customer receives ticket price minus platform fees. Example: $10 ticket → $9.00 refund
              </span>
            </div>
          </div>
        </label>

        {/* Refundable option */}
        <label
          className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedPolicy === 'refunded'
              ? 'border-teal-700 bg-teal-50/50'
              : 'border-slate-200 hover:border-slate-300'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="processingFeePolicy"
              value="refunded"
              checked={selectedPolicy === 'refunded'}
              onChange={() => handleRefundPolicyChange('processingFeePolicy', 'refunded')}
              disabled={disabled}
              className="mt-0.5 w-4 h-4 text-teal-700 border-slate-300 focus:ring-teal-300"
            />
            <div className="flex-1">
              <span className="block text-sm font-medium text-slate-700">
                Full refund including platform fees
              </span>
              <span className="block text-xs text-slate-500 mt-1">
                Customer receives full ticket price. You absorb the platform fees.
              </span>
            </div>
          </div>
        </label>
      </div>

      {/* Additional Refund Conditions */}
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Additional Refund Conditions <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">Will be displayed to customers</p>
        <textarea
          rows={3}
          disabled={disabled}
          className={`w-full p-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none ${
            disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
          }`}
          placeholder="e.g., Refunds available up to 24 hours before event"
          value={formData.refundPolicy?.policyText || ''}
          onChange={(e) => handleRefundPolicyChange('policyText', e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-slate-400 mt-1 text-right">
          {(formData.refundPolicy?.policyText || '').length}/500
        </p>
      </div>

      {/* Errors */}
      {errors?.refundPolicy && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            {Array.isArray(errors.refundPolicy) ? errors.refundPolicy[0] : errors.refundPolicy}
          </p>
        </div>
      )}
    </div>
  );
};

export default RefundPolicyStep;

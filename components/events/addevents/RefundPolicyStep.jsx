import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateRefundPolicy } from '@/store/slices/events/eventSlice';
import { platformFeeLabel, platformFeeFor } from '@/utils/platformFee';

const RefundPolicyStep = ({
  formData = {},
  errors = {},
  mode = 'add',
  readOnly = false
}) => {
  const dispatch = useDispatch();
  const disabled = readOnly || mode === 'view';

  // Editable sample ticket price for the breakdown preview ($10 default).
  const [samplePrice, setSamplePrice] = useState('10');

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
  const feesRefunded = selectedPolicy === 'refunded'; // toggle ON = full refund, organiser absorbs fee

  const price = Number(samplePrice) || 0;
  const fee = platformFeeFor(price);
  const customerRefund = feesRefunded ? price : Math.max(0, price - fee);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Heading */}
      <div>
        <h3 className="font-medium text-sm sm:text-base text-slate-600">
          Processing Fee Policy <span className="text-red-500">*</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          This refund policy will be displayed at checkout.
        </p>
      </div>

      {/* Processing fees — segmented toggle + explanation (aligned under the toggle) */}
      <div className="flex flex-wrap items-start gap-3">
        <span className="text-sm font-medium text-slate-600 pt-2">Processing Fees</span>
        <div>
          <div className="inline-grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleRefundPolicyChange('processingFeePolicy', 'refunded')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed ${
                feesRefunded ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Refundable
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleRefundPolicyChange('processingFeePolicy', 'non-refundable')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed ${
                !feesRefunded ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Non-Refundable
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {feesRefunded
              ? 'You refund the customer the full ticket price and absorb the platform fee.'
              : 'You refund the ticket price minus the platform fee — the customer absorbs it.'}
          </p>
        </div>
      </div>

      {/* Live breakdown (organiser's view) */}
      <div className="rounded-lg border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-sm text-slate-500">If a ticket costs</span>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-slate-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={samplePrice}
              onChange={(e) => setSamplePrice(e.target.value)}
              onWheel={(e) => e.target.blur()}
              className="w-24 pl-5 pr-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
        </div>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">You refund the customer</dt>
            <dd className="font-medium text-slate-800">${customerRefund.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Platform fee</dt>
            <dd className="font-medium text-slate-800">${fee.toFixed(2)}</dd>
          </div>
        </dl>
        <p className="text-sm text-slate-400 mt-3">Platform fee: {platformFeeLabel()} per ticket</p>
      </div>

      {/* Additional Refund Policy */}
      <div>
        <label className="block text-sm font-medium text-slate-600">
          Additional Refund Policy <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">List any other refund terms you want shown to customers at checkout.</p>
        <textarea
          rows={3}
          disabled={disabled}
          className={`w-full p-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none ${
            disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
          }`}
          placeholder="e.g. No refund for change of mind"
          value={formData.refundPolicy?.policyText || ''}
          onChange={(e) => handleRefundPolicyChange('policyText', e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-slate-400 mt-1 text-right">
          {(formData.refundPolicy?.policyText || '').length}/500
        </p>
      </div>

      {/* Error */}
      {errors?.refundPolicy && (
        <p className="text-red-500 text-xs sm:text-sm">
          {Array.isArray(errors.refundPolicy) ? errors.refundPolicy[0] : errors.refundPolicy}
        </p>
      )}
    </div>
  );
};

export default RefundPolicyStep;

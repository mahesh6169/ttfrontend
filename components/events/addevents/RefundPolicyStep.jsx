// components/events/addevents/RefundPolicyStep.jsx

import React from 'react';
import { useDispatch } from 'react-redux';
import { updateRefundPolicy } from '@/store/slices/events/eventSlice';

const RefundPolicyStep = ({ 
  formData = {}, 
  errors = {}, 
  mode = 'add', 
  readOnly = false 
}) => {
  const dispatch = useDispatch();
  const disabled = readOnly || mode === 'view';

  // Handle refund policy changes
  const handleRefundPolicyChange = (field, value) => {
    if (disabled) return;
    dispatch(updateRefundPolicy({ field, value }));
  };

  // Check if this is a recurring event
  const isRecurringEvent = formData.recurrence?.isRecurring || false;

  // Mode-specific configurations
  const modeConfig = {
    add: {
      title: 'Refund Policy',
      subtitle: 'Set your refund terms for ticket purchases'
    },
    edit: {
      title: 'Update Refund Policy',
      subtitle: 'Modify your refund terms'
    },
    view: {
      title: 'Refund Policy',
      subtitle: 'Current refund policy settings'
    }
  };

  const config = modeConfig[mode] || modeConfig.add;

  // Don't show refund policy step for free events
  if (!formData.isPaid) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Refund Policy Not Required
          </h2>
          <p className="text-gray-600 mb-4">
            Since this is a free event, no refund policy is needed.
          </p>
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free Event
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {config.title}
          {mode === 'edit' && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Editing
            </span>
          )}
        </h2>
        <p className="text-gray-600">{config.subtitle}</p>
        {isRecurringEvent && (
          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700">
            <strong>Recurring Event:</strong> This refund policy will apply to all instances of your recurring event.
          </div>
        )}
      </div>

      {/* Refund Policy Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Processing Fee Policy
        </h3>
        <p className="text-gray-600 mb-6">
          Choose how processing fees are handled when refunds are issued to your customers.
        </p>
        
        <div className="space-y-4">
          {/* Processing Fee Policy Options */}
          <div className="space-y-4">
            {/* Non-refundable option (default) */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.refundPolicy?.processingFeePolicy === 'non-refundable'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              onClick={() => !disabled && handleRefundPolicyChange('processingFeePolicy', 'non-refundable')}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      formData.refundPolicy?.processingFeePolicy === 'non-refundable'
                        ? 'border-blue-500 bg-white'
                        : 'border-gray-400'
                    }`}
                  >
                    {formData.refundPolicy?.processingFeePolicy === 'non-refundable' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800">Processing fees are non-refundable</h4>
                    <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                      Standard
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    When refunds are issued, customers will receive the ticket price minus the $1 processing fee. 
                    This is the most common approach used by ticketing platforms.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Refundable option */}
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                formData.refundPolicy?.processingFeePolicy === 'refunded'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
              onClick={() => !disabled && handleRefundPolicyChange('processingFeePolicy', 'refunded')}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      formData.refundPolicy?.processingFeePolicy === 'refunded'
                        ? 'border-blue-500 bg-white'
                        : 'border-gray-400'
                    }`}
                  >
                    {formData.refundPolicy?.processingFeePolicy === 'refunded' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-800">Processing fees are refunded</h4>
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
                      Customer-Friendly
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Customers receive full refunds including the $1 processing fee. You absorb the platform fee loss 
                    to provide a better customer experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Optional Policy Text */}
          <div className="space-y-2">
            <label htmlFor="policyText" className="text-sm font-medium text-gray-700">
              Additional Policy Notes <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              id="policyText"
              rows={3}
              disabled={disabled}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                disabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''
              }`}
              placeholder="Add any additional refund terms or conditions (e.g., refund deadlines, special circumstances, etc.)"
              value={formData.refundPolicy?.policyText || ''}
              onChange={(e) => !disabled && handleRefundPolicyChange('policyText', e.target.value)}
              maxLength={1000}
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>This will be shown to customers during checkout</span>
              <span>{(formData.refundPolicy?.policyText || '').length}/1000</span>
            </div>
          </div>
          
          {/* Policy Preview */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="text-sm font-medium text-blue-800 mb-2">Preview - What customers will see:</h5>
            <div className="text-sm text-blue-700">
              <p className="font-medium">
                {formData.refundPolicy?.processingFeePolicy === 'refunded' 
                  ? '✓ Full refunds including processing fees' 
                  : '⚠️ Processing fees ($1) are non-refundable'}
              </p>
              {formData.refundPolicy?.policyText && (
                <p className="mt-2 italic">"{formData.refundPolicy.policyText}"</p>
              )}
            </div>
          </div>
        </div>

        {/* Display errors */}
        {errors?.refundPolicy && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700 text-sm">
              {Array.isArray(errors.refundPolicy) ? (
                errors.refundPolicy.map((err, i) => <p key={i}>• {err}</p>)
              ) : (
                <p>• {errors.refundPolicy}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Information Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="space-y-1">
                <li>• This policy will be displayed to customers during ticket purchase</li>
                <li>• Customers must acknowledge the refund policy before completing their purchase</li>
                <li>• You can change this policy, but it won't affect tickets already sold</li>
                {isRecurringEvent && (
                  <li>• This policy applies to all instances of your recurring event</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mode-specific information */}
      {mode === 'edit' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">Editing Refund Policy</h4>
              <p className="text-sm text-blue-700 mt-1">
                Changes to your refund policy will only apply to new ticket purchases. 
                Existing ticket holders remain under the original policy they agreed to.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundPolicyStep;
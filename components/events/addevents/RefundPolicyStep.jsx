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
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);

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
      title: 'Refund Policy',
      subtitle: 'Set your refund terms for ticket purchases'
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
        </h2>
        <p className="text-gray-600">{config.subtitle}</p>
        {isRecurringEvent && (
          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm text-purple-700">
            <strong>Recurring Event:</strong> This refund policy will apply to all instances of your recurring event.
          </div>
        )}
      </div>

      {/* Refund Policy Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        
        <p className="text-xs text-blue-600 mb-4 sm:mb-6">
          Customers will need to acknowledge the refund policy at checkout
        </p>
        
        <div className="space-y-4">
          {/* Processing Fee Policy Options */}
          <div className="space-y-4">
            {/* Non-refundable option (default) */}
            <div
              className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
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
                <div className="ml-2 sm:ml-3 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <h4 className="text-sm font-medium text-gray-800">Processing fees are non-refundable</h4>
                    <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full mt-1 sm:mt-0 inline-block w-fit">
                      Customer absorbs processing fees
                    </span>
                  </div>
                  
                  {/* Refund Breakdown - Mobile Optimized */}
                  <div className="mt-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="mb-3">
                      <span className="text-xs font-medium text-amber-800">💡 Refund Example - $10 Ticket</span>
                    </div>
                    {/* Mobile-first vertical layout */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
                        <span className="text-xs text-gray-700">Ticket Price</span>
                        <span className="text-xs font-medium text-gray-900">$10.00</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
                        <span className="text-xs text-gray-700">Platform Fee</span>
                        <span className="text-xs text-red-600">- $0.53</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
                        <span className="text-xs text-gray-700">Stripe Fee</span>
                        <span className="text-xs text-red-600">- $0.47</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-semibold text-gray-900">Customer Refund</span>
                        <span className="text-sm font-bold text-green-600">$9.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Refundable option */}
            <div
              className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
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
                <div className="ml-2 sm:ml-3 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <h4 className="text-sm font-medium text-gray-800">Processing fees are refunded</h4>
                    <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full mt-1 sm:mt-0 inline-block w-fit">
                      Organiser absorbs processing fees
                    </span>
                  </div>
                  
                  {/* Refund Breakdown - Mobile Optimized */}
                  <div className="mt-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <div className="mb-3">
                      <span className="text-xs font-medium text-amber-800">💡 Refund Example - $10 Ticket</span>
                    </div>
                    {/* Mobile-first vertical layout */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
                        <span className="text-xs text-gray-700">Ticket Price</span>
                        <span className="text-xs font-medium text-gray-900">$10.00</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
                        <span className="text-xs text-gray-700">Platform Fee</span>
                        <span className="text-xs text-gray-500">$0.53</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-amber-200">
                        <span className="text-xs text-gray-700">Stripe Fee</span>
                        <span className="text-xs text-gray-500">$0.47</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-semibold text-gray-900">Customer Refund</span>
                        <span className="text-sm font-bold text-green-600">$10.00</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-amber-200">
                        <span className="text-xs text-amber-700 italic">Organiser covers all fees</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Optional Policy Text */}
          <div className="space-y-2">
            <label htmlFor="policyText" className="text-sm font-medium text-gray-700">
              Additional Policy Notes <span className="text-gray-400 text-xs">(Optional)</span>
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
              <span>{(formData.refundPolicy?.policyText || '').length}/1000</span>
            </div>
          </div>
          
          {/* Policy Preview */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-medium text-blue-800">Preview - What customers will see</h5>
              <button 
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="text-xs text-blue-700 hover:text-blue-800 font-medium px-2 py-1 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
              >
                [view details]
              </button>
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


      
      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Customer Checkout Preview</h3>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Mock Order Summary */}
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <span className="w-4 h-4 bg-green-600 rounded mr-2"></span>
                    Order Summary
                  </h4>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center text-blue-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Sunday 6 July 2025
                    </div>
                    <div className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      1:00 am
                    </div>
                    <div className="flex items-center text-red-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      Test 112
                    </div>
                    <div className="flex items-center text-purple-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Technology
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-3">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Tickets</h4>
                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">test</div>
                      <div className="text-gray-600">Quantity: 1 • $10.00 each</div>
                    </div>
                    <div className="font-medium">$10.00</div>
                  </div>
                </div>
                
                <div className="border-b pb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Subtotal</span>
                    <span>$10.00</span>
                  </div>
                  <div className="flex justify-between font-medium text-green-600">
                    <span>Total</span>
                    <span>$10.00</span>
                  </div>
                </div>
                
                <div>
                  {formData.refundPolicy?.processingFeePolicy === 'non-refundable' && (
                    <div className="bg-gray-50 rounded p-3 border">
                      <div className="flex items-start text-sm">
                        <svg className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Refund Policy by organiser</p>
                          <div className="mt-1 text-gray-700">
                            Processing fees are non-refundable
                          </div>
                          {formData.refundPolicy?.policyText && (
                            <div className="mt-2">
                              <p className="font-medium text-gray-700">Additional Policy Notes</p>
                              <p className="text-gray-600 italic">"{formData.refundPolicy.policyText}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {formData.refundPolicy?.processingFeePolicy === 'refunded' && (
                    <div className="bg-gray-50 rounded p-3 border">
                      <div className="flex items-start text-sm">
                        <svg className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Refund Policy by organiser</p>
                          <div className="mt-1 text-gray-700">
                            Processing fees are refunded
                          </div>
                          {formData.refundPolicy?.policyText && (
                            <div className="mt-2">
                              <p className="font-medium text-gray-700">Additional Policy Notes</p>
                              <p className="text-gray-600 italic">"{formData.refundPolicy.policyText}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundPolicyStep;
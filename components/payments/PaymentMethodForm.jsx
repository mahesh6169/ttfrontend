// components/payments/PaymentMethodForm.jsx

'use client';

import React, { useState } from 'react';
import {
  CardElement,
  useElements,
  useStripe
} from '@stripe/react-stripe-js';
import { 
  FaCreditCard, 
  FaLock, 
  FaCheckCircle,
  FaExclamationCircle 
} from 'react-icons/fa';

const PaymentMethodForm = ({ disabled = false }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardFocused, setCardFocused] = useState(false);

  // Card Element styling options - responsive
  const cardOptions = {
    style: {
      base: {
        fontSize: window.innerWidth < 640 ? '14px' : '16px',
        color: '#1f2937',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#6b7280',
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
      complete: {
        color: '#059669',
        iconColor: '#059669',
      },
    },
    hidePostalCode: true, // We'll handle address separately if needed
  };

  // Handle card element changes
  const handleCardChange = (event) => {
    // Check for card brand
    if (event.brand && ['amex', 'diners', 'discover', 'jcb', 'unionpay'].includes(event.brand)) {
      setCardError('Sorry, we only accept Visa and Mastercard from Australian banks');
      setCardComplete(false);
      return;
    }
    
    setCardError(event.error ? event.error.message : '');
    setCardComplete(event.complete);
  };

  // Handle card element focus
  const handleCardFocus = () => {
    setCardFocused(true);
  };

  // Handle card element blur
  const handleCardBlur = () => {
    setCardFocused(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Card Input Section */}
      <div className="space-y-1.5 sm:space-y-2">
        <label className="block text-xs sm:text-sm font-medium text-gray-700">
          Card Information *
        </label>
        
        <div className={`relative border rounded-md sm:rounded-lg transition-all duration-200 ${
          cardError 
            ? 'border-red-500 bg-red-50' 
            : cardComplete 
            ? 'border-green-500 bg-green-50' 
            : cardFocused 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-white'
        }`}>
          {/* Card Icon. */}
          <div className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 z-10">
            <FaCreditCard className={`text-sm sm:text-lg ${
              cardError 
                ? 'text-red-500' 
                : cardComplete 
                ? 'text-green-500' 
                : 'text-gray-400'
            }`} />
          </div>

          {/* Status Icon */}
          <div className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 z-10">
            {cardError ? (
              <FaExclamationCircle className="text-sm sm:text-base text-red-500" />
            ) : cardComplete ? (
              <FaCheckCircle className="text-sm sm:text-base text-green-500" />
            ) : (
              <FaLock className="text-sm sm:text-base text-gray-400" />
            )}
          </div>

          {/* Stripe Card Element */}
          <div className="px-10 sm:px-12 py-2.5 sm:py-3">
            <CardElement
              options={cardOptions}
              onChange={handleCardChange}
              onFocus={handleCardFocus}
              onBlur={handleCardBlur}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Card Error Message */}
        {cardError && (
          <p className="text-xs sm:text-sm text-red-600 flex items-center">
            <FaExclamationCircle className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
            {cardError}
          </p>
        )}

        {/* Card Success Message */}
        {cardComplete && !cardError && (
          <p className="text-xs sm:text-sm text-green-600 flex items-center">
            <FaCheckCircle className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
            Card details are valid
          </p>
        )}
      </div>

      {/* Security Information */}
      <div className="bg-gray-50 rounded-md sm:rounded-lg p-2.5 sm:p-3">
        <div className="flex items-start space-x-1.5 sm:space-x-2">
          <FaLock className="text-gray-500 mt-0.5 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
          <div className="text-xs sm:text-sm text-gray-600">
            <p className="font-medium">Your payment is secure</p>
            <p className="mt-0.5 leading-relaxed">We use industry-standard encryption to protect your card information.</p>
          </div>
        </div>
      </div>

      {/* Accepted Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500">
        <span className="mb-1.5 sm:mb-0">Accepted cards:</span>
        <div className="flex space-x-1.5 sm:space-x-2">
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs font-mono">VISA</span>
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs font-mono">MC</span>
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs font-mono">AMEX</span>
          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 rounded text-[10px] sm:text-xs font-mono">DISC</span>
        </div>
      </div>

      {/* Test Card Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-md sm:rounded-lg">
          <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-1.5 sm:mb-2">Test Cards:</h4>
          <div className="grid grid-cols-1 gap-1 sm:gap-2 text-xs sm:text-sm text-blue-700">
            <div className="flex items-center">
              <span className="font-mono text-[10px] sm:text-xs">4242 4242 4242 4242</span>
              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-blue-600">Success</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-[10px] sm:text-xs">4000 0000 0000 0002</span>
              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-blue-600">Declined</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-blue-600 mt-1.5 sm:mt-2">
            Use any future date and 3-digit CVC.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodForm;
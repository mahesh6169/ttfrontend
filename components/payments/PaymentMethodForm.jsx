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

  // Card Element styling options
  const cardOptions = {
    style: {
      base: {
        fontSize: '16px',
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
    <div className="space-y-4">
      {/* Card Input Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card Information *
        </label>
        
        <div className={`relative border rounded-lg transition-all duration-200 ${
          cardError 
            ? 'border-red-500 bg-red-50' 
            : cardComplete 
            ? 'border-green-500 bg-green-50' 
            : cardFocused 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-white'
        }`}>
          {/* Card Icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <FaCreditCard className={`text-lg ${
              cardError 
                ? 'text-red-500' 
                : cardComplete 
                ? 'text-green-500' 
                : 'text-gray-400'
            }`} />
          </div>

          {/* Status Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            {cardError ? (
              <FaExclamationCircle className="text-red-500" />
            ) : cardComplete ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaLock className="text-gray-400" />
            )}
          </div>

          {/* Stripe Card Element */}
          <div className="px-12 py-3">
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
          <p className="text-sm text-red-600 flex items-center">
            <FaExclamationCircle className="mr-1" />
            {cardError}
          </p>
        )}

        {/* Card Success Message */}
        {cardComplete && !cardError && (
          <p className="text-sm text-green-600 flex items-center">
            <FaCheckCircle className="mr-1" />
            Card details are valid
          </p>
        )}
      </div>

      {/* Security Information */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <FaLock className="text-gray-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-medium">Your payment is secure</p>
            <p>We use industry-standard encryption to protect your card information. Your details are never stored on our servers.</p>
          </div>
        </div>
      </div>

      {/* Accepted Cards */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Accepted payment methods:</span>
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">VISA</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">MC</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">AMEX</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">DISC</span>
        </div>
      </div>

      {/* Test Card Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Test Card Numbers:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-700">
            <div>
              <span className="font-mono">4242 4242 4242 4242</span>
              <span className="ml-2 text-blue-600">Visa (Success)</span>
            </div>
            <div>
              <span className="font-mono">4000 0000 0000 0002</span>
              <span className="ml-2 text-blue-600">Declined</span>
            </div>
            <div>
              <span className="font-mono">4000 0000 0000 9995</span>
              <span className="ml-2 text-blue-600">Insufficient Funds</span>
            </div>
            <div>
              <span className="font-mono">5555 5555 5555 4444</span>
              <span className="ml-2 text-blue-600">Mastercard</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Use any future expiry date (e.g., 12/30) and any 3-digit CVC.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodForm;
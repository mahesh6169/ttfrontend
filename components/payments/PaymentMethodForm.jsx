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
import { 
  SiVisa, 
  SiMastercard 
} from 'react-icons/si';

const PaymentMethodForm = ({ disabled = false, onValidationChange }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardFocused, setCardFocused] = useState(false);
  const [cardBrand, setCardBrand] = useState(null);

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
    // Update card brand
    setCardBrand(event.brand || null);
    
    // Define accepted card brands
    const acceptedCards = ['visa', 'mastercard'];
    
    // Check if card brand is accepted
    if (event.brand && !acceptedCards.includes(event.brand)) {
      setCardError('Sorry, we only accept Visa and Mastercard from Australian banks');
      setCardComplete(false);
      if (onValidationChange) {
        onValidationChange(false, 'invalid_card_brand');
      }
      return;
    }
    
    // For accepted cards (Visa/Mastercard)
    if (event.brand && acceptedCards.includes(event.brand) && event.complete) {
      setCardError(null);
      if (onValidationChange) {
        onValidationChange(true, null);
      }
    } else if (event.error) {
      setCardError(event.error.message);
      if (onValidationChange) {
        onValidationChange(false, 'card_error');
      }
    } else {
      setCardError(null);
      // Card is incomplete but no errors
      if (onValidationChange) {
        onValidationChange(event.complete, null);
      }
    }
    
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
      {/* Accepted Cards */}
      <div className="flex items-center space-x-2 text-sm text-slate-600">
        <span>Accepted cards (Australian only):</span>
        <div className="flex items-center space-x-2">
          <SiVisa className="text-2xl text-[#1A1F71]" />
          <SiMastercard className="text-2xl text-[#EB001B]" />
        </div>
      </div>

      {/* Card Input Section — container to the input spec (slate-300, teal focus ring) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Card Information *
        </label>

        <div className={`relative border rounded-lg bg-white transition-all duration-200 ${
          cardError
            ? 'border-red-500 bg-red-50'
            : cardComplete
            ? 'border-teal-400'
            : cardFocused
            ? 'border-teal-400 ring-2 ring-teal-300'
            : 'border-slate-300'
        }`}>
          {/* Status Icon */}
          <div className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 z-10">
            {cardError ? (
              <FaExclamationCircle className="text-sm sm:text-base text-red-500" />
            ) : cardComplete ? (
              <FaCheckCircle className="text-sm sm:text-base text-teal-500" />
            ) : (
              <FaLock className="text-sm sm:text-base text-slate-400" />
            )}
          </div>

          {/* Stripe Card Element */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3">
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
          <p className="text-xs text-red-600 flex items-center">
            <FaExclamationCircle className="mr-1 w-4 h-4" />
            {cardError}
          </p>
        )}

        {/* Card Success Message */}
        {cardComplete && !cardError && (
          <p className="text-xs text-teal-600 flex items-center">
            <FaCheckCircle className="mr-1 w-4 h-4" />
            Card details are valid
          </p>
        )}
      </div>

      {/* Test Card Information (Development Only) — slate INFO callout (design-system.md section 10) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <h4 className="text-sm font-semibold text-slate-800 mb-2">Australian Test Cards</h4>
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <div className="flex items-center">
              <span className="font-mono text-xs">4000 0003 6000 0006</span>
              <span className="ml-2 text-xs text-slate-600">AU Visa</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-xs">5555 5536 0000 0008</span>
              <span className="ml-2 text-xs text-slate-600">AU Mastercard</span>
            </div>
            <div className="flex items-center text-red-600">
              <span className="font-mono text-xs line-through opacity-50">3782 822463 10005</span>
              <span className="ml-2 text-xs">AMEX (Not Accepted)</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Use any future date and 3-digit CVC. International cards will be rejected.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodForm;
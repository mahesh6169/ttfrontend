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
  FaExclamationCircle,
  FaSpinner
} from 'react-icons/fa';
import { 
  SiVisa, 
  SiMastercard,
  SiAmericanexpress
} from 'react-icons/si';

// Feature 1016: Australian-issued Visa, Mastercard or Amex only. The brand is checked here while
// typing; the issuing country is checked by the server when Pay is clicked (check-card).
export const ACCEPTED_CARD_BRANDS = ['visa', 'mastercard', 'amex'];
export const CARD_NOT_ACCEPTED_MESSAGE =
  'Sorry, we only accept Australian-issued Visa, Mastercard or Amex. Please try another card.';

// cardCheckState (feature 1016): the Australian-card check that runs once the card is fully typed
// (idle | checking | ok | refused | error) - drives the line under the card box.
const PaymentMethodForm = ({ disabled = false, onValidationChange, cardCheckState = 'idle' }) => {
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
    
    const acceptedCards = ACCEPTED_CARD_BRANDS;
    
    // Check if card brand is accepted ('unknown' = not enough digits typed yet)
    if (event.brand && event.brand !== 'unknown' && !acceptedCards.includes(event.brand)) {
      setCardError(CARD_NOT_ACCEPTED_MESSAGE);
      setCardComplete(false);
      if (onValidationChange) {
        onValidationChange(false, 'invalid_card_brand');
      }
      return;
    }
    
    // For accepted cards (Visa/Mastercard/Amex)
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
        <span>Accepted: Australian Visa, Mastercard or Amex</span>
        <div className="flex items-center space-x-2" aria-hidden="true">
          <SiVisa className="text-2xl text-[#1A1F71]" />
          <SiMastercard className="text-2xl text-[#EB001B]" />
          <SiAmericanexpress className="text-2xl text-[#2E77BC]" />
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

        {/* Card status: checking the card, then valid (refused / error shows in the Payment Error box) */}
        {cardComplete && !cardError && cardCheckState === 'checking' && (
          <p className="text-xs text-slate-600 flex items-center" data-testid="card-checking">
            <FaSpinner className="mr-1 w-4 h-4 animate-spin" />
            Checking your card...
          </p>
        )}
        {cardComplete && !cardError && (cardCheckState === 'ok' || cardCheckState === 'idle') && (
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
              <span className="font-mono text-xs">4000 0503 6000 0001</span>
              <span className="ml-2 text-xs text-slate-600">AU debit Visa (eftpos)</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-xs">5555 0503 6000 0080</span>
              <span className="ml-2 text-xs text-slate-600">AU debit Mastercard (eftpos)</span>
            </div>
            <div className="flex items-center text-red-600">
              <span className="font-mono text-xs">4242 4242 4242 4242</span>
              <span className="ml-2 text-xs">US Visa (refused at Pay)</span>
            </div>
            <div className="flex items-center text-red-600">
              <span className="font-mono text-xs">3782 822463 10005</span>
              <span className="ml-2 text-xs">US Amex (accepted while typing, refused at Pay)</span>
            </div>
            <div className="flex items-center text-red-600">
              <span className="font-mono text-xs">6011 1111 1111 1117</span>
              <span className="ml-2 text-xs">Discover (refused while typing)</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Use any future date and any CVC (4 digits for Amex). Overseas cards are refused.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodForm;
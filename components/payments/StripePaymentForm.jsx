// components/payments/StripePaymentForm.jsx

'use client';

import React, { useState, useMemo, useRef } from 'react';
import axios from '@/utils/axiosConfig';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import PaymentMethodForm, { CARD_NOT_ACCEPTED_MESSAGE } from './PaymentMethodForm';
import { FaSpinner, FaLock, FaExclamationTriangle } from 'react-icons/fa';

// Initialize Stripe outside component to avoid re-creating on each render
//const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ 
  clientSecret, 
  eventId,
  buyerInfo, 
  totalAmount,
  onSuccess, 
  onError,
  disabled = false 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [isCardValid, setIsCardValid] = useState(false);
  const [cardValidationError, setCardValidationError] = useState(null);
  // Feature 1016: the card is checked (Australian Visa / Mastercard / Amex) as soon as it is fully
  // typed, so Complete Payment never lights up for an overseas card. state: idle | checking | ok |
  // refused | error. checkSeq drops the answer of a check the buyer has typed past.
  const [cardCheck, setCardCheck] = useState({ state: 'idle', paymentMethodId: null });
  const checkSeq = useRef(0);

  // Make the card on Stripe and ask our server whether it is accepted. Holds no money.
  const checkTheCard = async () => {
    const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement('card'),
      billing_details: {
        name: `${buyerInfo.firstName} ${buyerInfo.lastName}`,
        email: buyerInfo.email,
        phone: buyerInfo.phone,
      },
    });
    if (cardError) {
      return {
        ok: false,
        message: cardError.type === 'card_error' || cardError.type === 'validation_error'
          ? cardError.message
          : 'Please check your card details and try again.',
      };
    }
    let check;
    try {
      check = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${eventId}/paid/check-card`,
        { paymentIntentId: clientSecret.split('_secret_')[0], paymentMethodId: paymentMethod.id },
        { withCredentials: true }
      );
    } catch (checkError) {
      return {
        ok: false,
        message: checkError.response?.status === 400 && checkError.response?.data?.message
          ? checkError.response.data.message
          : 'We could not check your card just now. Please try again.',
      };
    }
    if (!check.data?.accepted) {
      return { ok: false, refused: true, message: check.data?.message || CARD_NOT_ACCEPTED_MESSAGE };
    }
    return { ok: true, paymentMethodId: paymentMethod.id };
  };

  const runEarlyCheck = async () => {
    if (!stripe || !elements || !clientSecret) return;
    const seq = ++checkSeq.current;
    setCardCheck({ state: 'checking', paymentMethodId: null });
    let result;
    try {
      result = await checkTheCard();
    } catch {
      result = { ok: false, message: 'We could not check your card just now. Please try again.' };
    }
    if (seq !== checkSeq.current) return; // the card changed meanwhile
    if (result.ok) {
      setCardCheck({ state: 'ok', paymentMethodId: result.paymentMethodId });
      setPaymentError(null);
    } else {
      setCardCheck({ state: result.refused ? 'refused' : 'error', paymentMethodId: null });
      setPaymentError(result.message);
      if (result.refused) clearRefusedCard();
    }
  };

  // A refused card is wiped from the box, so the next card is always typed (or pasted) fresh and
  // checked again - Stripe sends no change when one complete card is swapped for another.
  // The refusal message stays until a new complete card is in.
  const clearRefusedCard = () => {
    elements?.getElement('card')?.clear();
  };

  const handleCardValidation = (valid, errorType) => {
    setIsCardValid(valid);
    setCardValidationError(errorType);
    checkSeq.current += 1; // any edit makes an earlier check stale
    if (valid) {
      setPaymentError(null);
      runEarlyCheck();
    } else {
      setCardCheck({ state: 'idle', paymentMethodId: null });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Payment system not initialized. Please refresh the page.');
      return;
    }

    if (!isCardValid || cardCheck.state === 'refused' || cardCheck.state === 'checking') {
      if (!isCardValid) setPaymentError('Please enter a valid Australian Visa, Mastercard or Amex to continue.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Use the card already checked while typing; otherwise (that check failed to run) check it
      // now. Only an accepted card goes on to Stripe, so no money is ever held for a refused one.
      let paymentMethodId = cardCheck.state === 'ok' ? cardCheck.paymentMethodId : null;
      if (!paymentMethodId) {
        const result = await checkTheCard();
        if (!result.ok) {
          setCardCheck({ state: result.refused ? 'refused' : 'error', paymentMethodId: null });
          setPaymentError(result.message);
          if (result.refused) clearRefusedCard();
          return;
        }
        paymentMethodId = result.paymentMethodId;
      }

      console.log('🚀 Starting Stripe payment confirmation...');

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId,
      });

      if (error) {
        console.error('❌ Stripe payment error:', error);
        // A declined card cannot be reused: the next Pay makes and checks it again.
        setCardCheck({ state: 'idle', paymentMethodId: null });
        
        // Handle specific Stripe error types
        let errorMessage = 'Payment failed. Please try again.';
        
        switch (error.type) {
          case 'card_error':
            errorMessage = error.message;
            break;
          case 'validation_error':
            errorMessage = 'Please check your card details and try again.';
            break;
          case 'rate_limit_error':
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 'api_connection_error':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'api_error':
            errorMessage = 'Payment processing error. Please try again.';
            break;
          default:
            errorMessage = error.message || 'An unexpected error occurred.';
        }
        
        setPaymentError(errorMessage);
        onError(errorMessage);
        return;
      }

      // 'requires_capture' = the money is held (feature 1015); the server takes it once the
      // tickets are made. 'succeeded' = already charged (older checkout).
      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
        console.log('✅ Stripe payment approved:', paymentIntent.id, paymentIntent.status);
        onSuccess(paymentIntent);
      } else {
        const statusMessage = `Payment status: ${paymentIntent.status}. Please try again.`;
        setPaymentError(statusMessage);
        onError(statusMessage);
      }

    } catch (unexpectedError) {
      console.error('❌ Unexpected payment error:', unexpectedError);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setPaymentError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardBlocked = cardCheck.state === 'checking' || cardCheck.state === 'refused';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Section */}
      <PaymentMethodForm 
        disabled={isProcessing || disabled}
        onReady={() => setPaymentError(null)}
        onValidationChange={handleCardValidation}
        cardCheckState={cardCheck.state}
      />

      {/* Error Display */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-md sm:rounded-lg p-3 sm:p-4">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-600 mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5" />
            <div className="flex-1">
              <h4 className="font-medium sm:font-semibold text-red-800 mb-0.5 sm:mb-1 text-sm sm:text-base">Payment Error</h4>
              <p className="text-xs sm:text-sm text-red-700">{paymentError}</p>
            </div>
          </div>
        </div>
      )}


      {/* Submit Button */}
      <div className="flex justify-center">
      <button
        type="submit"
        disabled={!stripe || isProcessing || disabled || !isCardValid || cardBlocked}
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors ${
          isProcessing || disabled || !isCardValid || cardBlocked
            ? 'bg-teal-700 opacity-50 cursor-not-allowed'
            : 'bg-teal-700 hover:bg-teal-800'
        }`}
      >
        {isProcessing ? (
          <>
            <FaSpinner className="animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <FaLock />
            Complete Payment ${totalAmount?.toFixed(2) || '0.00'}
          </>
        )}
      </button>
      </div>

      {/* Security Notice */}
      <div className="flex items-center justify-center text-sm text-slate-500">
        <FaLock className="mr-2" />
        <span>Your payment information is secure and encrypted</span>
      </div>
    </form>
  );
};

const StripePaymentForm = ({ 
  clientSecret,
  eventId,
  stripeAccountId, 
  buyerInfo, 
  totalAmount,
  onSuccess, 
  onError,
  disabled = false 
}) => {
  // ✅ Create Stripe instance with connected account context
  const stripePromise = useMemo(
    () => {
      console.log('🔧 Creating Stripe instance with account:', stripeAccountId);
      return loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        { 
          stripeAccount: stripeAccountId
        }
      );
    },
    [stripeAccountId]
  );

  // Stripe Elements options (simplified)
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#16a34a',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#dc2626',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  console.log('🔍 Stripe Elements options:', {
    hasClientSecret: !!options.clientSecret,
    organizerAccount: stripeAccountId
  });

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        clientSecret={clientSecret}
        eventId={eventId}
        buyerInfo={buyerInfo}
        totalAmount={totalAmount}
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled}
      />
    </Elements>
  );
};

export default StripePaymentForm;
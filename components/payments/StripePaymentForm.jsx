// components/payments/StripePaymentForm.jsx

'use client';

import React, { useState, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import PaymentMethodForm from './PaymentMethodForm';
import { FaSpinner, FaLock, FaExclamationTriangle } from 'react-icons/fa';

// Initialize Stripe outside component to avoid re-creating on each render
//const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const PaymentForm = ({ 
  clientSecret, 
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Payment system not initialized. Please refresh the page.');
      return;
    }

    if (!isCardValid) {
      setPaymentError('Please enter a valid Visa or Mastercard to continue.');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      console.log('🚀 Starting Stripe payment confirmation...');

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement('card'),
          billing_details: {
            name: `${buyerInfo.firstName} ${buyerInfo.lastName}`,
            email: buyerInfo.email,
            phone: buyerInfo.phone,
          },
        },
      });

      if (error) {
        console.error('❌ Stripe payment error:', error);
        
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

      if (paymentIntent.status === 'succeeded') {
        console.log('✅ Stripe payment succeeded:', paymentIntent.id);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Section */}
      <PaymentMethodForm 
        disabled={isProcessing || disabled}
        onReady={() => setPaymentError(null)}
        onValidationChange={(valid, errorType) => {
          setIsCardValid(valid);
          setCardValidationError(errorType);
        }}
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
        disabled={!stripe || isProcessing || disabled || !isCardValid}
        className={`w-auto py-3 px-6 sm:px-8 rounded-lg font-semibold text-white transition-all flex items-center justify-center ${
          isProcessing || disabled || !isCardValid
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-teal-700 hover:bg-teal-800 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2'
        }`}
      >
        {isProcessing ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <FaLock className="mr-2" />
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
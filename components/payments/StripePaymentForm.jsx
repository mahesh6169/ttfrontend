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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setPaymentError('Payment system not initialized. Please refresh the page.');
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
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaLock className="mr-2 text-green-600" />
          Payment Information
        </h3>
        
        <PaymentMethodForm 
          disabled={isProcessing || disabled}
          onReady={() => setPaymentError(null)}
        />
      </div>

      {/* Payment Error Display */}
      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-red-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Payment Error</h4>
              <p className="text-sm text-red-700 mt-1">{paymentError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing || disabled}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center ${
          isProcessing || disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
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

      {/* Security Notice */}
      <div className="flex items-center justify-center text-sm text-gray-500">
        <FaLock className="mr-2" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Test Mode Notice (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future date and CVC.
          </p>
        </div>
      )}
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
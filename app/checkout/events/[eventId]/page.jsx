// app/checkout/events/[eventId]/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaExclamationTriangle,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle
} from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import RequireLogin from '@/components/Auth/RequireLogin';
import LoadingSpinner from '@/components/LoadingSpinner';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import PaymentSummary from '@/components/payments/PaymentSummary';

const CheckoutPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.user);
  
  // State management
  const [ticketSelection, setTicketSelection] = useState(null);
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Payment states
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [currentStep, setCurrentStep] = useState('details'); // 'details' | 'payment' | 'success'
  
  // Form state
  const [buyerInfo, setBuyerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agreeToTerms: false
  });

  // Load ticket selection and event data
  useEffect(() => {
    const loadCheckoutData = async () => {
      try {
        setIsLoading(true);
        
        // Get ticket selection from sessionStorage
        const storedSelection = sessionStorage.getItem('ticketSelection');
        if (!storedSelection) {
          alert('No ticket selection found. Please select tickets first.');
          router.push(`/events/views/${params.eventId}`);
          return;
        }

        const selection = JSON.parse(storedSelection);
        
        // Validate selection hasn't expired (10 minutes max)
        const selectionAge = Date.now() - selection.timestamp;
        if (selectionAge > 10 * 60 * 1000) {
          alert('Your ticket selection has expired. Please select tickets again.');
          sessionStorage.removeItem('ticketSelection');
          router.push(`/events/views/${params.eventId}`);
          return;
        }

        // Validate selection is for correct event
        if (selection.eventId !== params.eventId) {
          alert('Invalid ticket selection. Please select tickets again.');
          sessionStorage.removeItem('ticketSelection');
          router.push(`/events/views/${params.eventId}`);
          return;
        }

        setTicketSelection(selection);

        // Load event details
        const eventResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/views/${params.eventId}`, {
          credentials: 'include'
        });
        
        if (!eventResponse.ok) {
          throw new Error('Failed to load event details');
        }
        
        const eventData = await eventResponse.json();
        setEvent(eventData);

        // Pre-fill buyer info with user data
        if (user) {
          setBuyerInfo(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || ''
          }));
        }

      } catch (error) {
        console.error('Error loading checkout data:', error);
        alert('Error loading checkout page. Please try again.');
        router.push(`/events/views/${params.eventId}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.eventId) {
      loadCheckoutData();
    }
  }, [params.eventId, router, user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBuyerInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!buyerInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!buyerInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!buyerInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerInfo.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!buyerInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(buyerInfo.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!buyerInfo.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle proceeding to payment step
  const handleProceedToPayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      console.log('🚀 Creating payment intent...');

      // Create Payment Intent
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/paid/create-payment-intent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tickets: ticketSelection.tickets,
          buyerInfo
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create payment intent');
      }

      console.log('✅ Payment Intent created:', data.paymentIntentId);
      
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setCurrentStep('payment');

    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      setErrors({ 
        payment: error.message || 'Failed to initialize payment. Please try again.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentIntent) => {
    setIsProcessing(true);

    try {
      console.log('🎉 Payment succeeded, confirming with backend...');

      // Confirm payment and create tickets
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/paid/confirm-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          tickets: ticketSelection.tickets,
          buyerInfo
          // No simulatePayment flag - this is real payment
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to confirm payment');
      }

      console.log('✅ Payment confirmed, tickets created:', data.ticketCount);

      // Clear ticket selection
      sessionStorage.removeItem('ticketSelection');
      
      // Move to success step
      setCurrentStep('success');

    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      setErrors({ 
        payment: error.message || 'Payment successful but failed to create tickets. Please contact support.' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('❌ Payment failed:', error);
    setErrors({ 
      payment: error || 'Payment failed. Please try again.' 
    });
  };

  // Handle back to ticket selection
  const handleBackToTickets = () => {
    router.push(`/events/views/${params.eventId}`);
  };

  // Handle back to details step
  const handleBackToDetails = () => {
    setCurrentStep('details');
    setClientSecret(null);
    setPaymentIntentId(null);
    setErrors({});
  };

  // Format event date/time
  const getFormattedDateTime = () => {
    if (!event?.dateTime) return { date: '', time: '' };
    
    const timeZone = event.timeZone || 'Australia/Sydney';
    const date = formatInTimeZone(event.dateTime, timeZone, 'EEEE, MMMM do, yyyy');
    const time = formatInTimeZone(event.dateTime, timeZone, 'h:mm a');
    
    return { date, time };
  };

  // Get selected tickets for display
  const getSelectedTickets = () => {
    if (!event?.ticketTypes || !ticketSelection?.tickets) return [];
    
    return event.ticketTypes
      .map(ticketType => {
        const quantity = ticketSelection.tickets[ticketType._id] || 0;
        if (quantity === 0) return null;
        
        return {
          ...ticketType,
          quantity,
          totalPrice: (ticketType.price || 0) * quantity
        };
      })
      .filter(Boolean);
  };

  if (isLoading) {
    return (
      <RequireLogin message="You must be logged in to complete your purchase.">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="large" />
        </div>
      </RequireLogin>
    );
  }

  if (!ticketSelection || !event) {
    return (
      <RequireLogin message="You must be logged in to complete your purchase.">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Checkout Error</h2>
            <p className="text-gray-600 mb-6">Unable to load checkout information.</p>
            <button
              onClick={() => router.push(`/events/views/${params.eventId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Event
            </button>
          </div>
        </div>
      </RequireLogin>
    );
  }

  const { date, time } = getFormattedDateTime();
  const selectedTickets = getSelectedTickets();
  const totals = ticketSelection.totals;

  // Success Step
  if (currentStep === 'success') {
    return (
      <RequireLogin message="You must be logged in to complete your purchase.">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <FaCheckCircle className="mx-auto text-6xl text-green-600 mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
              <p className="text-lg text-gray-600 mb-6">
                Your tickets have been purchased successfully.
              </p>
              
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
                <ul className="text-green-700 space-y-1">
                  <li>📧 Check your email for confirmation and tickets</li>
                  <li>🎫 Your tickets will be delivered within 5 minutes</li>
                  <li>📱 Save your tickets to your phone for easy access</li>
                  <li>🎪 Present your tickets at the event entrance</li>
                </ul>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => router.push('/users/profile/mytickets')}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View My Tickets
                </button>
                
                <button
                  onClick={() => router.push(`/events/views/${params.eventId}`)}
                  className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Back to Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin message="You must be logged in to complete your purchase.">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={currentStep === 'payment' ? handleBackToDetails : handleBackToTickets}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <FaArrowLeft className="mr-2" />
              {currentStep === 'payment' ? 'Back to Details' : 'Back to Ticket Selection'}
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
            <p className="text-gray-600 mt-2">
              {currentStep === 'details' 
                ? 'Review your order and enter your details' 
                : 'Enter your payment information'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${currentStep === 'details' ? 'text-blue-600' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'details' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  {currentStep === 'details' ? '1' : <FaCheckCircle />}
                </div>
                <span className="ml-2 font-medium">Details</span>
              </div>
              
              <div className={`w-16 h-1 ${currentStep === 'payment' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center ${currentStep === 'payment' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentStep === 'details' ? (
                /* Details Step */
                <>
                  {/* Event Info */}
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Event Details</h2>
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 text-blue-600" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center">
                          <FaClock className="mr-2 text-green-600" />
                          <span>{time}</span>
                        </div>
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="mr-2 text-red-600" />
                          <span>{event.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buyer Information Form */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <FaUser className="mr-2 text-blue-600" />
                      Buyer Information
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={buyerInfo.firstName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter your first name"
                          />
                          {errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                          )}
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={buyerInfo.lastName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter your last name"
                          />
                          {errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={buyerInfo.email}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter your email address"
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={buyerInfo.phone}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            placeholder="Enter your phone number"
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>

                      {/* Terms Agreement */}
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          name="agreeToTerms"
                          checked={buyerInfo.agreeToTerms}
                          onChange={handleInputChange}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-600">
                          I agree to the{' '}
                          <a href="/support/terms" target="_blank" className="text-blue-600 hover:underline">
                            Terms and Conditions
                          </a>{' '}
                          and{' '}
                          <a href="/support/privacy" target="_blank" className="text-blue-600 hover:underline">
                            Privacy Policy
                          </a>
                        </label>
                      </div>
                      {errors.agreeToTerms && (
                        <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
                      )}

                      {/* Proceed to Payment Button */}
                      <button
                        onClick={handleProceedToPayment}
                        disabled={isProcessing}
                        className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center ${
                          isProcessing
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isProcessing ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Preparing Payment...
                          </>
                        ) : (
                          'Proceed to Payment'
                        )}
                      </button>

                      {/* Error Display */}
                      {errors.payment && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <FaExclamationTriangle className="text-red-600 mr-3 mt-1" />
                            <p className="text-sm text-red-700">{errors.payment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Payment Step */
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
                  
                  <StripePaymentForm
                    clientSecret={clientSecret}
                    buyerInfo={buyerInfo}
                    totalAmount={totals.total}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    disabled={isProcessing}
                  />
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <PaymentSummary
                event={event}
                selectedTickets={selectedTickets}
                totals={totals}
                buyerInfo={currentStep === 'payment' ? buyerInfo : null}
                showEventDetails={true}
                showBuyerInfo={currentStep === 'payment'}
                className="sticky top-8"
              />
            </div>
          </div>
        </div>
      </div>
    </RequireLogin>
  );
};

export default CheckoutPage;
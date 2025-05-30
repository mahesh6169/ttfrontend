// app/checkout/events/[eventId]/page.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { 
  FaTicketAlt, 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCreditCard,
  FaLock,
  FaExclamationTriangle,
  FaArrowLeft,
  FaSpinner
} from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import RequireLogin from '@/components/Auth/RequireLogin';
import LoadingSpinner from '@/components/LoadingSpinner';

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

  // Handle form submission
  // Handle form submission
  // Handle form submission - SIMULATED PAYMENT VERSION
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setIsProcessing(true);
  setErrors({});

  try {
    console.log('🚀 Starting SIMULATED payment process...');

    // Step 1: Create Payment Intent
    const paymentIntentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/paid/create-payment-intent`, {
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

    const paymentIntentData = await paymentIntentResponse.json();
    
    if (!paymentIntentData.success) {
      throw new Error(paymentIntentData.message || 'Failed to create payment intent');
    }

    console.log('✅ Payment Intent created:', paymentIntentData.paymentIntentId);

    // Step 2: Simulate card payment processing
    console.log('💳 Simulating card payment...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Simulated payment completed');

    // Step 3: Confirm payment and create tickets (with simulation flag)
    const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${params.eventId}/paid/confirm-payment`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        paymentIntentId: paymentIntentData.paymentIntentId,
        tickets: ticketSelection.tickets,
        buyerInfo,
        simulatePayment: true // Add this flag for simulated payments
      })
    });

    const confirmData = await confirmResponse.json();
    
    if (!confirmData.success) {
      throw new Error(confirmData.message || 'Failed to confirm payment');
    }

    console.log('🎉 Simulated payment confirmed, tickets created:', confirmData.ticketCount);

    // Clear ticket selection
    sessionStorage.removeItem('ticketSelection');

    // Success! Show confirmation and redirect
    alert(`🎉 Simulated Payment Successful! 
    
✅ ${confirmData.ticketCount} ticket(s) purchased
📧 Confirmation email sent to ${buyerInfo.email}
🎫 Tickets will be delivered via email shortly
🧪 Note: This was a simulated payment for testing

Transaction ID: ${confirmData.transaction}`);
    
    router.push(`/events/views/${params.eventId}`);

  } catch (error) {
    console.error('❌ Simulated payment processing error:', error);
    setErrors({ 
      payment: error.message || 'Simulated payment failed. Please try again.' 
    });
  } finally {
    setIsProcessing(false);
  }
};

  // Handle back to ticket selection
  const handleBackToTickets = () => {
    router.push(`/events/views/${params.eventId}`);
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

  return (
    <RequireLogin message="You must be logged in to complete your purchase.">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToTickets}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <FaArrowLeft className="mr-2" />
              Back to Ticket Selection
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Purchase</h1>
            <p className="text-gray-600 mt-2">Review your order and enter payment details</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary - Left/Top */}
            <div className="lg:col-span-2">
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
                
                <form onSubmit={handleSubmit} className="space-y-4">
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

                  {/* Payment Error */}
                  {errors.payment && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <FaExclamationTriangle className="text-red-600 mr-3 mt-1" />
                        <p className="text-sm text-red-700">{errors.payment}</p>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* Order Summary - Right/Bottom */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FaTicketAlt className="mr-2 text-green-600" />
                  Order Summary
                </h2>

                {/* Selected Tickets */}
                <div className="space-y-3 mb-6">
                  {selectedTickets.map((ticket) => (
                    <div key={ticket._id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{ticket.name}</p>
                        <p className="text-sm text-gray-600">Qty: {ticket.quantity}</p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${ticket.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {totals.gst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST (10%)</span>
                      <span className="font-medium">${totals.gst.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold text-green-600 pt-2 border-t">
                    <span>Total</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Complete Purchase Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold text-white transition-all flex items-center justify-center ${
                    isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
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
                      Complete Purchase ${totals.total.toFixed(2)}
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
                  <FaLock className="mr-1" />
                  <span>Secure payment processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireLogin>
  );
};

export default CheckoutPage;
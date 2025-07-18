// components/events/addevents/EventTypeStep.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toggleIsPaid } from '@/store/slices/events/eventSlice';
import { toast } from 'react-toastify';

const EventTypeStep = ({ formData = {}, errors = {} }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.user);

  // Check if this is a recurring event
  const isRecurringEvent = formData.recurrence?.isRecurring || false;

  // Get Stripe account status from user data
  const stripeAccountStatus = user?.stripeAccountStatus || 'no_account';
  const isStripeFullyActive = stripeAccountStatus === 'fully_active';

  // Auto-select free event when recurring is enabled (paid not supported for recurring)
  useEffect(() => {
    if (isRecurringEvent && formData.isPaid) {
      dispatch(toggleIsPaid(false));
    }
  }, [isRecurringEvent, formData.isPaid, dispatch]);

  const handlePaidToggle = (isPaid) => {
    // Don't allow selecting paid if recurring event
    if (isPaid && isRecurringEvent) {
      return;
    }
    
    // Don't allow selecting paid if Stripe is not fully active
    if (isPaid && !isStripeFullyActive) {
      toast.info('Please complete your payment account setup first to create paid events.');
      return;
    }
    
    dispatch(toggleIsPaid(isPaid));
  };

  // Calculate recurring event details for display
  const getRecurringScheduleText = () => {
    if (!isRecurringEvent || !formData.recurrence?.repeatSchedule?.length) {
      return '';
    }
    
    const schedules = formData.recurrence.repeatSchedule;
    if (schedules.length === 1) {
      return `Every ${schedules[0].day} at ${schedules[0].time}`;
    } else {
      const days = schedules.map(s => s.day).join(', ');
      return `Multiple times per week (${days})`;
    }
  };

  // Get status-specific button text and description
  const getStripeSetupInfo = () => {
    switch (stripeAccountStatus) {
      case 'no_account':
        return {
          buttonText: 'Setup Stripe Payment Account',
          description: 'To create paid events, you need to set up your Stripe payment account.'
        };
      case 'incomplete_setup':
        return {
          buttonText: 'Complete Stripe Payment Account Setup',
          description: 'Complete your Stripe payment account setup to enable paid events.'
        };
      case 'action_required':
        return {
          buttonText: 'Stripe Payment Account Setup - Action Required',
          description: 'Your payment account requires additional information. Please complete the required actions.'
        };
      case 'account_restricted':
        return {
          buttonText: 'Stripe Payment Account Setup - Fix Account Issues',
          description: 'Your payment account has restrictions that need to be resolved before you can accept payments.'
        };
      case 'under_review':
        return {
          buttonText: 'Stripe Payment Account Setup - Under Review',
          description: 'Your account is currently being reviewed by Stripe. Check your progress and current status.'
        };
      case 'capabilities_pending':
        return {
          buttonText: 'Stripe Payment Account Setup - Under Review',
          description: 'Your account setup is being processed by Stripe. Check progress for any updates.'
        };
      case 'fully_active':
        return {
          buttonText: 'Stripe Setup Completed',
          description: 'Your Stripe setup is successfully completed.'
        };
      default:
        return {
          buttonText: 'Setup Stripe Payment Account',
          description: 'To create paid events, you need to set up your Stripe payment account.'
        };
    }
  };

  // Handle Stripe setup - always redirect to setup page
  const handleStripeSetup = () => {
    // Always redirect to setup page for any status
    router.push('/users/profile/settings/stripeSetup');
  };

  const setupInfo = getStripeSetupInfo();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Event Type</h2>
      
      {/* Recurring Event Info Banner */}
      {isRecurringEvent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Recurring Event Detected</h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>
                  This is a recurring event: <strong>{getRecurringScheduleText()}</strong>
                  {formData.recurrence?.endDate && (
                    <span> until {new Date(formData.recurrence.endDate).toLocaleDateString()}</span>
                  )}
                </p>
                <p className="mt-1">
                  Recurring events can only be free events. Paid tickets are not supported for recurring events.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-6">
        {/* Free Event Option */}
        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            !formData.isPaid
              ? 'border-teal-600 bg-teal-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
          onClick={() => handlePaidToggle(false)}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  !formData.isPaid
                    ? 'border-teal-600 bg-white'
                    : 'border-gray-400'
                }`}
              >
                {!formData.isPaid && (
                  <div className="w-3 h-3 rounded-full bg-teal-600"></div>
                )}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Free Event</h3>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  Registration Only
                </span>
              </div>
              <p className="text-gray-600 mt-2">
                Create a free event with simple registration. Perfect for community gatherings,
                meetups, networking events, and informal gatherings.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Simple attendee registration
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Manage event capacity
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Track and manage attendees
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Custom registration fields
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Email confirmations
                </div>

              </div>
            </div>
          </div>
        </div>
        
        {/* Paid Event Option */}
        <div
          className={`p-6 border-2 rounded-lg transition-all duration-200 ${
            formData.isPaid
              ? 'border-teal-600 bg-teal-50 shadow-md'
              : isRecurringEvent || !isStripeFullyActive
              ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
          }`}
          onClick={!isRecurringEvent && isStripeFullyActive ? () => handlePaidToggle(true) : undefined}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  formData.isPaid
                    ? 'border-teal-600 bg-white'
                    : 'border-gray-400'
                }`}
              >
                {formData.isPaid && (
                  <div className="w-3 h-3 rounded-full bg-teal-600"></div>
                )}
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Paid Event</h3>
                
                {/* Status badges */}
                {isRecurringEvent && (
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                    Not Available for Recurring Events
                  </span>
                )}
                
                {/* Status badges with consistent styling */}
                {!isRecurringEvent && !isStripeFullyActive && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                    Payment Setup Required
                  </span>
                )}

                {!isRecurringEvent && isStripeFullyActive && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    ✓ Payment Setup Completed
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 mt-2">
                Sell tickets for your event with multiple pricing tiers and optional seating
                arrangements. Ideal for concerts, workshops, conferences, and premium events.
              </p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Multiple ticket types & pricing
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Optional seating arrangements
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Secure payment processing
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Attendee management
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Setup Section - button and purpose only */}
      {!isRecurringEvent && (
        <div className="p-4 border border-gray-200 rounded-lg">
          <button
            onClick={handleStripeSetup}
            className={`w-full px-4 py-2 rounded transition-colors flex items-center justify-center gap-2 ${
              isStripeFullyActive
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            {setupInfo.buttonText}
          </button>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {setupInfo.description}
          </p>
        </div>
      )}

      {/* Display any errors */}
      {errors && Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-700 text-sm">
            {Object.entries(errors).map(([key, errorArray]) => (
              <p key={key}>
                {Array.isArray(errorArray) ? errorArray.join(', ') : errorArray}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTypeStep;
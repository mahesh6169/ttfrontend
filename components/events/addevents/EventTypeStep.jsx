// components/events/addevents/EventTypeStep.jsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleIsPaid, updateRefundPolicy } from '@/store/slices/events/eventSlice';
import { validateToken } from '@/store/slices/users/userSlice';
import { toast } from 'react-toastify';

const EventTypeStep = ({ formData = {}, errors = {} }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  
  // Local state for tracking setup status
  const [isCheckingStripe, setIsCheckingStripe] = useState(false);
  
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

  // Periodic check for Stripe setup completion (when user returns from setup)
  useEffect(() => {
    let intervalId;
    
    if (formData.isPaid && !isStripeFullyActive && !isCheckingStripe) {
      intervalId = setInterval(async () => {
        setIsCheckingStripe(true);
        try {
          await dispatch(validateToken()).unwrap();
        } catch (error) {
          console.log('Error refreshing user data:', error);
        } finally {
          setIsCheckingStripe(false);
        }
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [formData.isPaid, isStripeFullyActive, isCheckingStripe, dispatch]);

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

  // Get status label for display
  const getStatusLabel = (status) => {
    const statusMap = {
      'no_account': 'Not Connected',
      'account_restricted': 'Action Required',
      'action_required': 'Setup Incomplete',
      'incomplete_setup': 'Setup Incomplete',
      'under_review': 'Under Review',
      'capabilities_pending': 'Processing',
      'fully_active': 'Connected & Active',
      'unknown': 'Status Unknown'
    };
    
    return statusMap[status] || 'Status Unknown';
  };

  // Get status message for display
  const getStatusMessage = (status) => {
    switch (status) {
      case 'no_account':
        return 'Connect your payment account to start receiving payments from ticket sales.';
      case 'account_restricted':
        return '🚨 Your account needs immediate attention to continue receiving payments.';
      case 'action_required':
      case 'incomplete_setup':
        return 'Complete your account setup to start receiving payments.';
      case 'under_review':
        return 'Your account is being reviewed. This usually takes a few minutes.';
      case 'capabilities_pending':
        return 'Your account is being processed. Payment capabilities are being enabled.';
      case 'fully_active':
        return '🎉 Your account is ready! Payments will be deposited to your bank account.';
      default:
        return 'Please check your account status and complete any required setup.';
    }
  };

  // Get button text based on status
  const getButtonText = (status, loading) => {
    if (loading) {
      return status === 'no_account' ? 'Creating Account...' : 'Redirecting to Setup...';
    }
    
    switch (status) {
      case 'no_account':
        return 'Connect Payment Account';
      case 'account_restricted':
        return 'Fix Issues Now';
      case 'action_required':
      case 'incomplete_setup':
        return 'Complete Setup';
      case 'under_review':
      case 'capabilities_pending':
        return 'Setup In Progress - Please Wait';
      case 'fully_active':
        return 'View Payment Dashboard';
      default:
        return 'Continue Setup';
    }
  };

  // Get button styling based on status
  const getButtonStyle = (status) => {
    switch (status) {
      case 'fully_active':
        return 'w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors';
      case 'account_restricted':
        return 'w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50';
      case 'action_required':
      case 'incomplete_setup':
        return 'w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50';
      case 'under_review':
      case 'capabilities_pending':
        return 'w-full px-4 py-2 bg-gray-200 text-gray-600 rounded cursor-not-allowed';
      default:
        return 'w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50';
    }
  };

  // Handle opening Stripe setup
  const handleStripeSetup = () => {
    if (stripeAccountStatus === 'fully_active') {
      // Open Stripe dashboard for fully active accounts
      window.open('https://dashboard.stripe.com', '_blank');
      return;
    }

    // For all other statuses, open setup flow
    const currentPath = window.location.pathname + window.location.search;
    const stripeSetupUrl = `/users/profile/settings/stripeSetup?returnTo=${encodeURIComponent(currentPath)}`;
    
    // Open in new tab
    const stripeWindow = window.open(stripeSetupUrl, '_blank');
    
    if (!stripeWindow) {
      toast.error('Please allow popups for this site to complete payment account setup');
      return;
    }
    
    // Listen for completion via polling (check every 2 seconds)
    const pollInterval = setInterval(async () => {
      try {
        // Check if window is closed manually
        if (stripeWindow.closed) {
          clearInterval(pollInterval);
          console.log('Stripe window closed, refreshing user data...');
          await dispatch(validateToken());
          return;
        }
        
        // Check stripe status via API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stripe/account-status`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.computedStatus === 'fully_active') {
            // Setup complete!
            clearInterval(pollInterval);
            
            // Refresh user data first
            await dispatch(validateToken());
            
            // Show success message
            toast.success('🎉 Payment account setup completed! You can now create paid events.');
            
            console.log('Stripe setup complete detected');
          }
        }
      } catch (error) {
        console.log('Error checking Stripe status:', error);
      }
    }, 2000);
    
    // Clean up interval after 10 minutes to prevent memory leaks
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 600000);
    
    // Show helpful message
    toast.info('Payment account setup opened in new tab. Complete the setup and this page will automatically detect when you\'re done!', {
      autoClose: 5000
    });
  };

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
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  No transaction fees
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
                
                {!isRecurringEvent && !isStripeFullyActive && (
                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full animate-pulse">
                    Setup Required: {getStatusLabel(stripeAccountStatus)}
                  </span>
                )}
                
                {!isRecurringEvent && isStripeFullyActive && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    ✓ Ready
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
                  Advanced attendee management
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Setup Required/Status Section */}
      {!isStripeFullyActive && (
        <div className={`p-6 border-2 rounded-lg ${
          stripeAccountStatus === 'account_restricted' 
            ? 'bg-red-50 border-red-200' 
            : stripeAccountStatus === 'under_review' || stripeAccountStatus === 'capabilities_pending'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className={`h-6 w-6 ${
                stripeAccountStatus === 'account_restricted' ? 'text-red-600' :
                stripeAccountStatus === 'under_review' || stripeAccountStatus === 'capabilities_pending' ? 'text-yellow-600' :
                'text-orange-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-lg font-medium mb-2 ${
                stripeAccountStatus === 'account_restricted' ? 'text-red-800' :
                stripeAccountStatus === 'under_review' || stripeAccountStatus === 'capabilities_pending' ? 'text-yellow-800' :
                'text-orange-800'
              }`}>
                Payment Account: {getStatusLabel(stripeAccountStatus)}
              </h3>
              
              <div className={`space-y-3 ${
                stripeAccountStatus === 'account_restricted' ? 'text-red-700' :
                stripeAccountStatus === 'under_review' || stripeAccountStatus === 'capabilities_pending' ? 'text-yellow-700' :
                'text-orange-700'
              }`}>
                <p>{getStatusMessage(stripeAccountStatus)}</p>
                
                {/* Setup information for accounts that need action */}
                {(stripeAccountStatus === 'no_account' || stripeAccountStatus === 'incomplete_setup' || stripeAccountStatus === 'action_required') && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">What you'll need to set up:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Personal details</li>
                      <li>• Business details (Industry: "Event Ticketing", Website: "https://telugufy.com.au/")</li>
                      <li>• Bank account information for payouts</li>
                      <li>• Identity verification documents</li>
                    </ul>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleStripeSetup}
                    disabled={stripeAccountStatus === 'under_review' || stripeAccountStatus === 'capabilities_pending'}
                    className={getButtonStyle(stripeAccountStatus)}
                  >
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    {getButtonText(stripeAccountStatus, isCheckingStripe)}
                  </button>
                  
                  {isCheckingStripe && (
                    <div className="flex items-center px-4 py-3 bg-blue-100 text-blue-800 rounded-lg">
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking for setup completion...
                    </div>
                  )}
                </div>

                {/* Helpful tip */}
                {(stripeAccountStatus === 'no_account' || stripeAccountStatus === 'incomplete_setup' || stripeAccountStatus === 'action_required') && (
                  <div className="text-sm bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-blue-800">
                      <strong>💡 Tip:</strong> The setup process opens in a new tab. Your event details 
                      will be saved here, and this page will automatically detect when you're done!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Setup Success */}
      {isStripeFullyActive && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p className="text-green-800 font-medium">
              ✓ Payment account is fully set up and ready! You can proceed to configure your ticket pricing.
            </p>
          </div>
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
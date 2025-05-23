// components/events/addevents/EventTypeStep.jsx

import React from 'react';
import { useDispatch } from 'react-redux';
import { toggleIsPaid } from '@/store/slices/events/eventSlice';

const EventTypeStep = ({ formData = {}, errors = {} }) => {
  const dispatch = useDispatch();

  const handlePaidToggle = (isPaid) => {
    dispatch(toggleIsPaid(isPaid));
  };

  // Check if this is a recurring event
  const isRecurringEvent = formData.recurrence?.isRecurring || false;
  
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
                  The pricing and configuration you choose will apply to all instances of this recurring event.
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
                  No Cost
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
              {isRecurringEvent && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Recurring Benefit:</strong> Attendees can register for individual occurrences or the entire series
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Paid Event Option */}
        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
            formData.isPaid
              ? 'border-teal-600 bg-teal-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
          onClick={() => handlePaidToggle(true)}
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
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  Premium
                </span>
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
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Tax management (GST)
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Revenue tracking & reporting
                </div>
              </div>
              {isRecurringEvent && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Recurring Benefit:</strong> Sell season passes or individual event tickets with flexible pricing
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Important Notes Section */}
      <div className="space-y-4">
        {/* Dynamic Important Note */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
              <div className="mt-2 text-sm text-yellow-700">
                {formData.isPaid ? (
                  <div className="space-y-2">
                    <p>
                      <strong>Payment Setup Required:</strong> You'll need to configure your payment settings 
                      to receive funds. Make sure you've set up your payout details in your account settings.
                    </p>
                    <p>
                      <strong>Transaction Fees:</strong> A processing fee of 2.9% + $0.30 AUD applies to each transaction.
                    </p>
                    {isRecurringEvent && (
                      <p>
                        <strong>Recurring Events:</strong> Each occurrence will be treated as a separate 
                        ticketing event with the same pricing structure.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>
                      <strong>Registration Required:</strong> Even though your event is free, attendees 
                      still need to register. You can set a maximum capacity and collect additional 
                      information on the next screen.
                    </p>
                    {isRecurringEvent && (
                      <p>
                        <strong>Recurring Events:</strong> Attendees can register for individual 
                        occurrences or subscribe to the entire recurring series.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Setup Reminder for Paid Events */}
        {formData.isPaid && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Payment Account Setup</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Don't have payment processing set up yet? You can complete your event creation 
                    and set up payments later, but you'll need to activate payments before selling tickets.
                  </p>
                  <a 
                    href="/users/profile/settings" 
                    className="mt-2 inline-flex items-center text-sm text-teal-600 hover:text-teal-500 font-medium"
                  >
                    Set up payment account
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
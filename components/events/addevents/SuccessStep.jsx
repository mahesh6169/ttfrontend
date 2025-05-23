// components/events/addevents/SuccessStep.jsx

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

const SuccessStep = ({ event = {}, onAddAnother, onManageEvents }) => {
  // Check if this is a recurring event
  const isRecurringEvent = event.recurrence?.isRecurring || false;
  
  // Get recurring schedule summary
  const getRecurringScheduleText = () => {
    if (!isRecurringEvent || !event.recurrence?.repeatSchedule?.length) {
      return '';
    }
    
    const schedules = event.recurrence.repeatSchedule;
    if (schedules.length === 1) {
      return `Every ${schedules[0].day} at ${schedules[0].time}`;
    } else {
      const days = schedules.map(s => s.day).join(', ');
      return `Multiple times per week (${days})`;
    }
  };

  // Calculate total revenue potential for paid events
  const calculateTotalRevenue = () => {
    if (!event.isPaid || !event.ticketTypes?.length) return 0;
    return event.ticketTypes.reduce((total, ticket) => {
      return total + ((ticket.price || 0) * (ticket.quantity || 0));
    }, 0);
  };

  // Get event status message
  const getEventStatusMessage = () => {
    if (isRecurringEvent) {
      return 'and all recurring instances are now ready for attendees to register';
    }
    return event.status === 'draft' ? 'and is now ready to be published' : 'and is now ready for attendees to register';
  };

  return (
    <div className="text-center max-w-4xl mx-auto">
      {/* Success Icon */}
      <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-teal-100 to-green-100 shadow-lg">
        <svg className="w-12 h-12 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      
      {/* Success Message */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Event Created Successfully!
        </h2>
        <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
          Your event <span className="font-semibold text-gray-900">"{event.title || 'Untitled Event'}"</span> has been created {getEventStatusMessage()}.
        </p>
        
        {/* Event Type & Recurring Badges */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            event.isPaid 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {event.isPaid ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Paid Event
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free Event
              </>
            )}
          </span>
          
          {isRecurringEvent && (
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recurring Event
            </span>
          )}
        </div>
      </div>
      
      {/* Event Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Event Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Date & Time:</span>
              <span className="font-medium text-right">
                {event.dateTime ? format(new Date(event.dateTime), 'PPp') : 'Not set'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium text-right max-w-48 truncate" title={event.venue}>
                {event.venue || 'Not specified'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Time Zone:</span>
              <span className="font-medium">{event.timeZone || 'Australia/Sydney'}</span>
            </div>
            
            {event.category && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium">{event.category}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Coordinators:</span>
              <span className="font-medium">{(event.coordinators || []).length}</span>
            </div>
          </div>
        </div>

        {/* Event Configuration Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            {event.isPaid ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Ticket Types:</span>
                  <span className="font-medium">{(event.ticketTypes || []).length}</span>
                </div>
                
                {calculateTotalRevenue() > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Revenue Potential:</span>
                    <span className="font-medium text-green-600">
                      ${calculateTotalRevenue().toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Seating Layout:</span>
                  <span className="font-medium">
                    {(event.seatingLayout || []).length > 0 ? 'Configured' : 'Open seating'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">GST Applied:</span>
                  <span className="font-medium">{event.applyGST !== false ? 'Yes' : 'No'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Capacity:</span>
                  <span className="font-medium">
                    {(event.capacity || 0) > 0 ? `${event.capacity} people` : 'Unlimited'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Max Per Registration:</span>
                  <span className="font-medium">{event.maxAttendeesPerRegistration || 5} people</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Custom Fields:</span>
              <span className="font-medium">{(event.registrationFields || []).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Event Details */}
      {isRecurringEvent && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-purple-900">Recurring Event Schedule</h3>
          </div>
          
          <div className="text-center">
            <p className="text-purple-800 font-medium mb-2">
              {getRecurringScheduleText()}
            </p>
            {event.recurrence?.endDate && (
              <p className="text-purple-600 text-sm">
                Recurring until {format(new Date(event.recurrence.endDate), 'PP')}
              </p>
            )}
            <p className="text-purple-600 text-sm mt-2">
              Attendees can register for individual instances or the entire series
            </p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What's Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-teal-600 font-semibold">1</span>
            </div>
            <p className="font-medium">Review Your Event</p>
            <p className="text-gray-500 mt-1">Check all details are correct before publishing</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-teal-600 font-semibold">2</span>
            </div>
            <p className="font-medium">{event.isPaid ? 'Setup Payments' : 'Share Your Event'}</p>
            <p className="text-gray-500 mt-1">
              {event.isPaid 
                ? 'Complete payment account setup to receive funds'
                : 'Start promoting your event to attract attendees'
              }
            </p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-teal-600 font-semibold">3</span>
            </div>
            <p className="font-medium">Manage Registrations</p>
            <p className="text-gray-500 mt-1">Track attendees and manage check-ins</p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <button
          onClick={onAddAnother}
          className="inline-flex items-center justify-center px-6 py-3 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-all duration-200 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Another Event
        </button>
        
        <button
          onClick={onManageEvents}
          className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 font-medium shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Manage My Events
        </button>
      </div>

      {/* Additional Actions */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
          <Link 
            href="/users/profile/manageevents" 
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Event Dashboard
          </Link>
          
          {event.isPaid && (
            <Link 
              href="/users/profile/settings" 
              className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Payment Settings
            </Link>
          )}
          
          <Link 
            href={`/events/views/${event._id || event.id}`}
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Event Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessStep;
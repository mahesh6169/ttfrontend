// components/events/addevents/SuccessStep.jsx

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import ShareIcons from '@/components/shared/ShareIcons';

const SuccessStep = ({ 
  
  event = {}, 
  mode = 'add', // 'add' | 'edit'
  onAddAnother, 
  onManageEvents,
  onViewEvent,
  onEditEvent,
  customActions = []
}) => {

  
  // Get latest event from Redux (for add mode)
  const latestEvent = useSelector(state => {
    const myEvents = state.events?.myEvents || [];
    return myEvents.length > 0 ? myEvents[myEvents.length - 1] : null;
  });
  
  // Simple event ID logic without router
  const eventId = latestEvent?._id ||  // From Redux (add mode) 
                  event._id ||         // From props
                  event.id;            // Fallback

  // 🔍 TEMPORARY DEBUG - Remove after testing
console.log('🔍 SuccessStep Debug:', {
  mode,
  latestEvent: latestEvent?._id ? 'Found' : 'Not found',
  eventFromProps: event._id || event.id || 'Not found',
  finalEventId: eventId || 'UNDEFINED',
  eventObject: event
});

  
  // Mode-specific configurations
  const modeConfig = {
    add: {
      title: '🎉 Event Created Successfully!',
      subtitle: ' has been created and is now ready for attendees to register.',
      icon: '✅',
      primaryAction: 'Manage My Events',
      secondaryAction: 'Add Another Event'
    },
    edit: {
      title: '✅ Event Updated Successfully!', 
      subtitle: ' have been updated.',
      icon: '🔄',
      primaryAction: 'View Updated Event',
      secondaryAction: 'Manage My Events'
    }
  };

  const config = modeConfig[mode] || modeConfig.add;
  
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



  // Handle primary action based on mode
  const handlePrimaryAction = () => {
    switch (mode) {
      case 'add':
        if (onManageEvents) onManageEvents();
        break;
      case 'edit':
        if (onViewEvent) onViewEvent();
        break;
      default:
        if (onManageEvents) onManageEvents();
    }
  };

  // Handle secondary action based on mode
  const handleSecondaryAction = () => {
    switch (mode) {
      case 'add':
        if (onAddAnother) onAddAnother();
        break;
      case 'edit':
        if (onManageEvents) onManageEvents();
        break;
      default:
        if (onAddAnother) onAddAnother();
    }
  };

  return (
    <div className="text-center max-w-4xl mx-auto px-3 sm:px-4">
      {/* Success Message - Mobile optimized */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
          {config.title}
        </h2>
        
        {/* Event Type & Recurring Badges - Mobile optimized */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
            event.isPaid 
              ? 'bg-teal-100 text-teal-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {event.isPaid ? (
              <>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Paid Event
              </>
            ) : (
              <>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Free Event
              </>
            )}
          </span>
          
          {isRecurringEvent && (
            <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-purple-100 text-purple-800">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recurring
            </span>
          )}

          {/* Mode indicator badge */}
          <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
            mode === 'add' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'
          }`}>
            {mode === 'add' && '✨ New'}
            {mode === 'edit' && '🔄 Updated'}
          </span>
        </div>
        
        {/* Share Icons - Mobile optimized */}
        <div className="flex items-center justify-center py-2 sm:py-3">
          <span className="text-xs sm:text-sm text-gray-600 mr-2 sm:mr-3">Share:</span>
          <ShareIcons 
            type="event"
            title={event.title || latestEvent?.title || 'Event'}
            id={eventId}
          />
        </div>
      </div>
      
      {/* Event Summary Card - Single card only */}
      <div className="max-w-md mx-auto mb-4 sm:mb-6">
        {/* Basic Event Details */}
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm">
          <div className="flex items-center mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Event Details</h3>
          </div>
          
          <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-start">
              <span className="text-gray-500 flex-shrink-0">Event Title:</span>
              <span className="font-medium text-right ml-2 line-clamp-2">
                {event.title || latestEvent?.title || 'Untitled Event'}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-gray-500 flex-shrink-0">Date:</span>
              <span className="font-medium text-right ml-2">
                {event.dateTime ? format(new Date(event.dateTime), 'PPp') : 'Not set'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500">Time Zone:</span>
              <span className="font-medium text-xs sm:text-sm">{event.timeZone || 'Australia/Sydney'}</span>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-gray-500 flex-shrink-0">Location:</span>
              <span className="font-medium text-right ml-2 line-clamp-2" title={event.venue}>
                {event.venue || 'Not specified'}
              </span>
            </div>            
            
            {event.address?.formattedAddress && (
              <div className="flex justify-between items-start">
                <span className="text-gray-500 flex-shrink-0">Address:</span>
                <span className="font-medium text-right ml-2 line-clamp-2">
                  {event.address.formattedAddress.replace(/,?\s*Australia\s*$/, '')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recurring Event Details - Mobile optimized */}
      {isRecurringEvent && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-purple-900">
              {mode === 'edit' ? 'Updated Schedule' : 'Recurring Schedule'}
            </h3>
          </div>
          
          <div className="text-center">
            <p className="text-purple-800 font-medium text-sm sm:text-base mb-1 sm:mb-2">
              {getRecurringScheduleText()}
            </p>
            {event.recurrence?.endDate && (
              <p className="text-purple-600 text-xs sm:text-sm">
                Until {format(new Date(event.recurrence.endDate), 'PP')}
              </p>
            )}
            <p className="text-purple-600 text-xs sm:text-sm mt-1 sm:mt-2 px-2">
              {mode === 'edit' 
                ? 'Changes applied to future instances'
                : 'Attendees can register for individual dates'
              }
            </p>
          </div>
        </div>
      )}
      
      {/* Action Buttons - Mobile optimized */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center mb-4 sm:mb-6">
        <button
          onClick={handlePrimaryAction}
          className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-all duration-200 font-medium text-sm sm:text-base shadow-md"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mode === 'add' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
            {mode === 'edit' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
          </svg>
          {config.primaryAction}
        </button>
        
        <button
          onClick={handleSecondaryAction}
          className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-teal-600 text-teal-600 hover:bg-teal-50 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mode === 'add' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />}
            {mode === 'edit' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
          </svg>
          {config.secondaryAction}
        </button>
      </div>

      {/* Custom Actions - Mobile optimized */}
      {customActions.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:gap-2.5 justify-center mb-4 sm:mb-6">
          {customActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                action.variant === 'primary' 
                  ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                  : 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50'
              }`}
            >
              {action.icon && <span className="mr-1 sm:mr-1.5">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Additional Actions - Mobile optimized */}
      <div className="border-t border-gray-200 pt-3 sm:pt-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
          {eventId && mode === 'add' ? (
            <Link 
              href={`/events/views/${eventId}`}
              className="inline-flex items-center text-teal-600 hover:text-teal-700 hover:underline font-medium transition-colors"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Event Page
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SuccessStep;
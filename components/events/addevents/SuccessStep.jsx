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
      color: 'teal',
      primaryAction: 'Manage My Events',
      secondaryAction: 'Add Another Event'
    },
    edit: {
      title: '✅ Event Updated Successfully!', 
      subtitle: ' have been updated.',
      icon: '🔄',
      color: 'blue',
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

  // Get color classes based on mode
  const getColorClasses = (type = 'primary') => {
    const colors = {
      teal: {
        primary: 'bg-teal-600 hover:bg-teal-700 text-white',
        secondary: 'border-teal-600 text-teal-600 hover:bg-teal-50',
        accent: 'text-teal-600',
        bg: 'bg-teal-100'
      },
      blue: {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'border-blue-600 text-blue-600 hover:bg-blue-50',
        accent: 'text-blue-600',
        bg: 'bg-blue-100'
      }
    };
    
    return colors[config.color]?.[type] || colors.teal[type];
  };

  return (
    <div className="text-center max-w-4xl mx-auto">
      {/* Success Message */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {config.title}
        </h2>
        <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
          Your event <span className="font-semibold text-gray-900">"{event.title || 'Untitled Event'}"</span> {config.subtitle}
        </p>
        

        
        {/* Event Type & Recurring Badges */}
        <div className="flex items-center justify-center space-x-3 mb-6 mt-4">
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

          {/* Mode indicator badge */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getColorClasses('bg')} ${getColorClasses('accent')}`}>
            {mode === 'add' && '✨ New Event'}
            {mode === 'edit' && '🔄 Updated'}
          </span>
        </div>
        
        {/* Share Icons */}
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-gray-600 mr-3">Share your event:</span>
          <ShareIcons 
            type="event"
            title={event.title || latestEvent?.title || 'Event'}
            id={eventId}
          />
        </div>
      </div>
      
      {/* Event Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Event Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 ${getColorClasses('bg')} rounded-lg flex items-center justify-center mr-3`}>
              <svg className={`w-5 h-5 ${getColorClasses('accent')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span className="text-gray-500">Time Zone:</span>
              <span className="font-medium">{event.timeZone || 'Australia/Sydney'}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Location:</span>
              <span className="font-medium text-right max-w-48 truncate" title={event.venue}>
                {event.venue || 'Not specified'}
              </span>
            </div>            
            
            
            {event.address?.formattedAddress && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Address:</span>
                <span className="font-medium">{event.address.formattedAddress.replace(/,?\s*Australia\s*$/, '')}</span>
              </div>
            )}
            

          </div>
        </div>

        {/* Event Configuration Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-4">
            <div className={`w-10 h-10 ${getColorClasses('bg')} rounded-lg flex items-center justify-center mr-3`}>
              <svg className={`w-5 h-5 ${getColorClasses('accent')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            {event.isPaid ? (
              <>
                {/* Display ticket types with names and prices */}
                {(event.ticketTypes || []).length > 0 && (
                  <div className="space-y-2">
                    {event.ticketTypes.map((ticket, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-500">{ticket.name || `Ticket ${index + 1}`}:</span>
                        <span className="font-medium">
                          ${(ticket.price || 0).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Refund Policy:</span>
                  <span className="font-medium">
                    {event.refundPolicy?.processingFeePolicy === 'refunded' ? 'Refundable' : 'Non-refundable'}
                  </span>
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
                    {(event.seatingLayout || []).length > 0 ? 'Configured' : 'General Admission'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">GST Included:</span>
                  <span className="font-medium">{event.gstIncluded ? 'Yes' : 'No'}</span>
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

              </>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Attendee Information:</span>
              <span className="font-medium">
  {(event.registrationFields || [])
      .map(f => f.fieldName)
      .filter(Boolean)
      .join(', ') || 'None'}
</span>
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
            <h3 className="text-lg font-semibold text-purple-900">
              {mode === 'edit' ? 'Updated Recurring Schedule' : 'Recurring Event Schedule'}
            </h3>
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
              {mode === 'edit' 
                ? 'Changes have been applied to all future recurring instances'
                : 'Attendees can register for individual instances'
              }
            </p>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <button
          onClick={handlePrimaryAction}
          className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-md ${getColorClasses('primary')}`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mode === 'add' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
            {mode === 'edit' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
          </svg>
          {config.primaryAction}
        </button>
        
        <button
          onClick={handleSecondaryAction}
          className={`inline-flex items-center justify-center px-6 py-3 border-2 rounded-lg transition-all duration-200 font-medium ${getColorClasses('secondary')}`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mode === 'add' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />}
            {mode === 'edit' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
          </svg>
          {config.secondaryAction}
        </button>
      </div>

      {/* Custom Actions */}
      {customActions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {customActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`inline-flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                action.variant === 'primary' ? getColorClasses('primary') : getColorClasses('secondary')
              }`}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Additional Actions */}
<div className="border-t border-gray-200 pt-6">
  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-600">
    {eventId && mode === 'add' ? (
      <Link 
        href={`/events/views/${eventId}`}
        className={`inline-flex items-center ${getColorClasses('accent')} hover:underline font-medium transition-colors`}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
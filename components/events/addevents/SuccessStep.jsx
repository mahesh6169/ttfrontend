// components/events/addevents/SuccessStep.jsx

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

const SuccessStep = ({ 
  event = {}, 
  mode = 'add', // 'add' | 'edit' | 'view'
  onAddAnother, 
  onManageEvents,
  onViewEvent,
  onEditEvent,
  customActions = []
}) => {
  // Mode-specific configurations
  const modeConfig = {
    add: {
      title: '🎉 Event Created Successfully!',
      subtitle: 'Your event has been created and is now ready for attendees to register.',
      icon: '✅',
      color: 'teal',
      primaryAction: 'Manage My Events',
      secondaryAction: 'Add Another Event'
    },
    edit: {
      title: '✅ Event Updated Successfully!', 
      subtitle: 'Your changes have been saved and attendees will be notified of important updates.',
      icon: '🔄',
      color: 'blue',
      primaryAction: 'View Updated Event',
      secondaryAction: 'Manage My Events'
    },
    view: {
      title: '📋 Event Information',
      subtitle: 'Complete event details and information.',
      icon: '👁️',
      color: 'gray',
      primaryAction: 'Back to Events',
      secondaryAction: 'Edit Event'
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

  // Get event status message based on mode
  const getEventStatusMessage = () => {
    switch (mode) {
      case 'add':
        if (isRecurringEvent) {
          return 'and all recurring instances are now ready for attendees to register';
        }
        return event.status === 'draft' ? 'and is now ready to be published' : 'and is now ready for attendees to register';
      
      case 'edit':
        if (isRecurringEvent) {
          return 'All changes have been applied to future recurring instances. Registered attendees have been notified of important updates.';
        }
        return 'Changes have been saved successfully. Registered attendees have been notified of important updates.';
      
      case 'view':
        return 'View all event details and information below.';
      
      default:
        return '';
    }
  };

  // Mode-specific next steps
  const getNextSteps = () => {
    switch (mode) {
      case 'add':
        return [
          {
            step: 1,
            title: 'Review Your Event',
            description: 'Check all details are correct before publishing',
            color: 'teal'
          },
          {
            step: 2,
            title: event.isPaid ? 'Setup Payments' : 'Share Your Event',
            description: event.isPaid 
              ? 'Complete payment account setup to receive funds'
              : 'Start promoting your event to attract attendees',
            color: 'teal'
          },
          {
            step: 3,
            title: 'Manage Registrations',
            description: 'Track attendees and manage check-ins',
            color: 'teal'
          }
        ];
      
      case 'edit':
        return [
          {
            step: 1,
            title: 'Changes Applied',
            description: 'Your updates are now live and visible to attendees',
            color: 'blue'
          },
          {
            step: 2,
            title: 'Attendee Notifications',
            description: 'Important changes have been automatically communicated',
            color: 'blue'
          },
          {
            step: 3,
            title: 'Monitor Impact',
            description: 'Check registration status and attendee feedback',
            color: 'blue'
          }
        ];
      
      case 'view':
        return [
          {
            step: 1,
            title: 'Event Details',
            description: 'Complete information about this event',
            color: 'gray'
          },
          {
            step: 2,
            title: 'Registration',
            description: 'Join this event if registration is open',
            color: 'gray'
          },
          {
            step: 3,
            title: 'Share Event',
            description: 'Tell others about this event',
            color: 'gray'
          }
        ];
      
      default:
        return [];
    }
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
      case 'view':
        if (onManageEvents) onManageEvents();
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
      case 'view':
        if (onEditEvent) onEditEvent();
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
      },
      gray: {
        primary: 'bg-gray-600 hover:bg-gray-700 text-white',
        secondary: 'border-gray-600 text-gray-600 hover:bg-gray-50',
        accent: 'text-gray-600',
        bg: 'bg-gray-100'
      }
    };
    
    return colors[config.color]?.[type] || colors.teal[type];
  };

  return (
    <div className="text-center max-w-4xl mx-auto">
      {/* Success Icon */}
      <div className={`mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full ${getColorClasses('bg')} shadow-lg`}>
        <span className="text-4xl">{config.icon}</span>
      </div>
      
      {/* Success Message */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {config.title}
        </h2>
        <p className="text-lg text-gray-600 mb-4 max-w-2xl mx-auto">
          Your event <span className="font-semibold text-gray-900">"{event.title || 'Untitled Event'}"</span> {config.subtitle}
        </p>
        
        {/* Mode-specific status message */}
        <p className="text-gray-600 max-w-2xl mx-auto">
          {getEventStatusMessage()}
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
            {mode === 'view' && '👁️ Viewing'}
          </span>
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
                : 'Attendees can register for individual instances or the entire series'
              }
            </p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          {mode === 'view' ? 'Event Options' : "What's Next?"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {getNextSteps().map((step, index) => (
            <div key={index} className="text-center">
              <div className={`w-8 h-8 ${getColorClasses('bg')} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <span className={`${getColorClasses('accent')} font-semibold`}>{step.step}</span>
              </div>
              <p className="font-medium">{step.title}</p>
              <p className="text-gray-500 mt-1">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <button
          onClick={handlePrimaryAction}
          className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-200 font-medium shadow-md ${getColorClasses('primary')}`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mode === 'add' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />}
            {mode === 'edit' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}
            {mode === 'view' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />}
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
            {mode === 'view' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
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
          <Link 
            href="/users/profile/manageevents" 
            className={`inline-flex items-center ${getColorClasses('accent')} hover:underline font-medium transition-colors`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Event Dashboard
          </Link>
          
          {event.isPaid && mode !== 'view' && (
            <Link 
              href="/users/profile/settings" 
              className={`inline-flex items-center ${getColorClasses('accent')} hover:underline font-medium transition-colors`}
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
            className={`inline-flex items-center ${getColorClasses('accent')} hover:underline font-medium transition-colors`}
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
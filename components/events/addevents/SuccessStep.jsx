// components/events/addevents/SuccessStep.jsx

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import ShareIcons from '@/components/shared/ShareIcons';

const SuccessStep = ({
  event = {},
  mode = 'add',
  onAddAnother,
  onManageEvents,
  onViewEvent,
}) => {
  // Get latest event from Redux (for add mode)
  const latestEvent = useSelector(state => {
    const myEvents = state.events?.myEvents || [];
    return myEvents.length > 0 ? myEvents[myEvents.length - 1] : null;
  });

  const eventId = latestEvent?._id || event._id || event.id;
  const eventTitle = event.title || latestEvent?.title || 'Untitled Event';
  const isRecurringEvent = event.recurrence?.isRecurring || false;

  const getRecurringScheduleText = () => {
    if (!isRecurringEvent || !event.recurrence?.repeatSchedule?.length) return '';
    const schedules = event.recurrence.repeatSchedule;
    if (schedules.length === 1) {
      return `Every ${schedules[0].day} at ${schedules[0].time}`;
    }
    return `${schedules.length} times per week`;
  };

  const handlePrimaryAction = () => {
    if (mode === 'edit' && onViewEvent) {
      onViewEvent();
    } else if (onManageEvents) {
      onManageEvents();
    }
  };

  const handleSecondaryAction = () => {
    if (mode === 'edit' && onManageEvents) {
      onManageEvents();
    } else if (onAddAnother) {
      onAddAnother();
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Success Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-lg sm:text-xl font-semibold text-slate-800 text-center mb-1">
        {mode === 'edit' ? 'Event Updated' : 'Event Created'}
      </h2>
      <p className="text-sm text-slate-500 text-center mb-6">
        {mode === 'edit' ? 'Your changes have been saved' : 'Your event is now live'}
      </p>

      {/* Event Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-slate-800 mb-3 line-clamp-2">{eventTitle}</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span className="text-slate-700">
              {event.dateTime ? format(new Date(event.dateTime), 'PPp') : 'Not set'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Location</span>
            <span className="text-slate-700 text-right ml-4 line-clamp-1">
              {event.venue || 'Not specified'}
            </span>
          </div>

          {isRecurringEvent && (
            <div className="flex justify-between">
              <span className="text-slate-500">Schedule</span>
              <span className="text-slate-700">{getRecurringScheduleText()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Share */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <span className="text-sm text-slate-500">Share:</span>
        <ShareIcons
          type="event"
          title={eventTitle}
          id={eventId}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3">
        {eventId && (
          <Link
            href={`/events/views/${eventId}`}
            className="text-sm text-teal-700 hover:text-teal-800 hover:underline"
          >
            View event page →
          </Link>
        )}

        <button
          onClick={handlePrimaryAction}
          className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
        >
          {mode === 'edit' ? 'Back to event' : 'Manage my events'} →
        </button>

        <button
          onClick={handleSecondaryAction}
          className="text-sm text-slate-600 hover:text-slate-800 hover:underline"
        >
          {mode === 'edit' ? 'Manage my events' : 'Add another event'} →
        </button>
      </div>
    </div>
  );
};

export default SuccessStep;

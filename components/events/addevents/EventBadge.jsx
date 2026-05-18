// components/events/addevents/EventBadge.jsx

import React from 'react';

const EventBadge = ({ isPaid, isRecurring, eventIntent }) => {
  // Determine badge text and styling
  const getBadgeConfig = () => {
    // Check for promotional events first
    if (eventIntent === 'promote') {
      return {
        text: isPaid ? 'Promo (Paid)' : 'Promo (RSVP)',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        )
      };
    }

    if (isPaid) {
      return {
        text: 'Paid',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        )
      };
    }

    if (isRecurring) {
      return {
        text: 'RSVP/Recurring',
        bgColor: 'bg-teal-100',
        textColor: 'text-teal-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      };
    }

    return {
      text: 'RSVP',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      icon: (
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
  };

  const config = getBadgeConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      {config.icon}
      {config.text}
    </span>
  );
};

export default EventBadge;
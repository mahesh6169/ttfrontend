// components/events/checkin/checkinpaid_EventCard.jsx
//
// One event card on the PAID check-in LIST page (events-paid-checkin-redesign.md D4).
// Sibling of checkinrsvp_EventCard (paid = use #2 of the pattern; not shared - see D17). Same
// look (rounded-xl slate-200 card, neutral slate eventCode pill, muted meta), but NO Save PDF -
// the whole card taps through to the per-event check-in view.

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';
import { FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

const formatDateTime = (dateTime, timeZone = 'Australia/Sydney') => {
  if (!dateTime) return '';
  try {
    return `${formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy')} at ${formatInTimeZone(dateTime, timeZone, 'h:mm a')}`;
  } catch {
    return new Date(dateTime).toLocaleString();
  }
};

export default function CheckinPaid_EventCard({ event }) {
  const router = useRouter();
  const open = () => router.push(`/users/profile/checkin-paid/${event._id}`);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
      data-testid="checkinpaid-event-card"
      className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-300"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-800 truncate">{event.title}</h3>
        {event.eventCode && (
          <span className="shrink-0 text-xs font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
            {event.eventCode}
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1 text-xs text-slate-500">
        {event.dateTime && (
          <div className="flex items-center gap-1.5">
            <FaRegCalendarAlt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatDateTime(event.dateTime, event.timeZone)}</span>
          </div>
        )}
        {event.venue && (
          <div className="flex items-center gap-1.5">
            <FaMapMarkerAlt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
      </div>
    </div>
  );
}

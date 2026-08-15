// components/events/checkin/checkinrsvp_EventCard.jsx
//
// One event card on the RSVP check-in LIST page (events-rsvp-checkin-redesign.md D5/D6).
// Look defers to the shared guides: rounded-xl slate-200 card (design-system #5), neutral
// slate eventCode pill (#7), muted meta for date/venue (#2/#3), a secondary Save PDF button
// (#4). Tapping the Save PDF button exports the attendee list without navigating; tapping
// anywhere else on the card opens the per-event check-in screen. No check-in count here.

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { formatInTimeZone } from 'date-fns-tz';
import { FaDownload, FaRegCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { saveAttendeePdf } from '@/utils/events/attendeePdf';

const formatDateTime = (dateTime, timeZone = 'Australia/Sydney') => {
  if (!dateTime) return '';
  try {
    return `${formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy')} at ${formatInTimeZone(dateTime, timeZone, 'h:mm a')}`;
  } catch {
    return new Date(dateTime).toLocaleString();
  }
};

export default function CheckinRsvp_EventCard({ event }) {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const open = () => router.push(`/users/profile/checkinrsvp/${event._id}`);

  const handleSavePdf = async (e) => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const result = await saveAttendeePdf(event);
      if (result?.empty) toast.info('No attendees to export yet');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

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
      data-testid="checkinrsvp-event-card"
      className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 cursor-pointer hover:border-slate-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title + eventCode pill */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{event.title}</h3>
            {event.eventCode && (
              <span className="shrink-0 text-xs font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                {event.eventCode}
              </span>
            )}
          </div>

          {/* Date + venue, muted meta */}
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

        {/* Save PDF - secondary button; does not open the card */}
        <button
          type="button"
          onClick={handleSavePdf}
          disabled={isDownloading}
          className="shrink-0 inline-flex items-center gap-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaDownload size={12} />
          {isDownloading ? 'Saving...' : 'Save PDF'}
        </button>
      </div>
    </div>
  );
}

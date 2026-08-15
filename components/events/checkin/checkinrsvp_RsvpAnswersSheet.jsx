// components/events/checkin/checkinrsvp_RsvpAnswersSheet.jsx
//
// The "RSVP answers" sheet (events-rsvp-checkin-redesign.md D17). Read-only, per booking.
// Content only - the shell (bottom sheet / dialog, close control, scrim, Escape, scroll-lock) is
// the shared ResponsiveSheet (00-shared/shared-components.md). Header = reg no; body = the custom
// RSVP answers as label : value lines; no footer.

'use client';

import React from 'react';
import ResponsiveSheet from '@/components/shared/ResponsiveSheet';

export default function CheckinRsvp_RsvpAnswersSheet({ registration, onClose }) {
  if (!registration) return null;

  const answers = (registration.formResponses || []).filter(
    (r) => r && r.response !== undefined && r.response !== null && String(r.response).trim() !== ''
  );

  const header = (
    <>
      <h2 className="text-base font-semibold text-slate-900">Attendee information</h2>
      <p className="text-xs text-slate-500 font-mono break-all">{registration.registrationNumber}</p>
    </>
  );

  return (
    <ResponsiveSheet onClose={onClose} testId="rsvp-answers-sheet" ariaLabel="Attendee information" header={header}>
      <div className="p-4 space-y-2">
        {answers.length === 0 ? (
          <p className="text-sm text-slate-500">No information on this booking.</p>
        ) : (
          answers.map((a, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm">
              <span className="font-medium text-slate-700">{a.fieldName}:</span>{' '}
              <span className="text-slate-600 whitespace-pre-line break-words">{String(a.response)}</span>
            </div>
          ))
        )}
      </div>
    </ResponsiveSheet>
  );
}

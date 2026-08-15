// components/events/checkin/checkinpaid_AttendeeInfo.jsx
//
// The paid "Attendee Info" sheet (events-paid-checkin-redesign.md D12/D16). Content only - the shell
// is the shared ResponsiveSheet (no footer). Paid custom questions are asked ONCE per order and the
// answer is duplicated onto every ticket, so this shows the order's answers ONCE. Read-only; title
// "Attendee Info" to match the buy-flow term.

'use client';

import React from 'react';
import ResponsiveSheet from '@/components/shared/ResponsiveSheet';

export default function CheckinPaid_AttendeeInfo({ invoice, onClose }) {
  if (!invoice) return null;

  // Answers are per-order (duplicated on each ticket) - take them from the first ticket that has any.
  const ticketWithAnswers = (invoice.tickets || []).find((t) =>
    (t.formResponses || []).some((r) => r && r.response !== undefined && r.response !== null && String(r.response).trim() !== '')
  );
  const answers = (ticketWithAnswers?.formResponses || []).filter(
    (r) => r && r.response !== undefined && r.response !== null && String(r.response).trim() !== ''
  );

  const header = (
    <>
      <h2 className="text-base font-semibold text-slate-900">Attendee Info</h2>
      <p className="text-xs text-slate-500 font-mono break-all">{invoice.invoiceNumber}</p>
    </>
  );

  return (
    <ResponsiveSheet onClose={onClose} testId="checkinpaid-info-sheet" ariaLabel="Attendee Info" header={header}>
      <div className="p-4 space-y-2">
        {answers.length === 0 ? (
          <p className="text-sm text-slate-500">No information on this order.</p>
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

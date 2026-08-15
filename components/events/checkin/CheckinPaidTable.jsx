// components/events/checkin/CheckinPaidTable.jsx
//
// PURPOSE: render a paid event's bookings for the door console, grouped into INVOICE rows - a table
// on desktop, a stacked list on mobile. Paid sibling of CheckinTable (events/check-in scope; paid is
// use #2, so this is a sibling, not a generalisation - see events-paid-checkin-redesign.md D17).
// Contract: designguide/01-events/10-components.md.
//
// DO NOT use outside paid check-in. It knows the paid invoice shape
// { invoiceNumber, buyer, tickets:[{ _id, ticketNumber, ticketType, seats, attendees:[{_id,checkedIn}],
//   formResponses }] } and nothing else. Rule of three: a third real use is a planner promotion.
//
// Guarantees (mirroring CheckinTable): Invoice Number NEVER truncates (auto column desktop / own
// wrapping line mobile); the info icon sits immediately after the Buyer name and only when the order
// has answers; NO Cancel X (cancelling paid = a refund, its own page); the check-in control adapts
// to order size (1 ticket = direct toggle, 2+ = n/m counter opening the sheet); the column header is
// sticky-capable (the page passes stickyTop). Composes ResponsiveSheet for the two sheets.

'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MdInfoOutline, MdCheck } from 'react-icons/md';
import { toast } from 'react-toastify';
import CheckinPaid_CheckInSheet from './checkinpaid_CheckInSheet';
import CheckinPaid_AttendeeInfo from './checkinpaid_AttendeeInfo';
import {
  checkInPaidAttendee,
  undoCheckInPaidAttendee,
  updateLocalCheckIn,
} from '@/store/slices/events/checkInPaidSlice';

// Invoice | Buyer (flex) | info | Check-in. No Cancel X.
export const GRID_COLS_PAID = 'grid grid-cols-[6.5rem_minmax(0,1fr)_1.75rem_7rem] items-center gap-2';

export const orderHasAnswers = (invoice) =>
  (invoice.tickets || []).some((t) =>
    (t.formResponses || []).some((r) => r && r.response !== undefined && r.response !== null && String(r.response).trim() !== '')
  );

export const buyerOf = (invoice) => {
  const b = invoice.buyer || {};
  const name = `${b.firstName || ''} ${b.lastName || ''}`.trim();
  return name || invoice.tickets?.[0]?.user?.name || b.email || 'Guest';
};

const ticketCheckedIn = (t) => !!t.attendees?.[0]?.checkedIn;

function InfoButton({ invoice, onOpen }) {
  if (!orderHasAnswers(invoice)) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(invoice.invoiceNumber)}
      aria-label="View attendee information"
      className="shrink-0 p-1.5 text-slate-500 hover:text-slate-700"
    >
      <MdInfoOutline className="w-4 h-4" />
    </button>
  );
}

function CheckInControl({ invoice, actionLoading, onToggleSingle, onOpenSheet, labeled = false, block = false }) {
  const tickets = invoice.tickets || [];
  const total = tickets.length;
  const checkedIn = tickets.filter(ticketCheckedIn).length;
  const w = block ? 'w-full ' : '';

  if (total === 1) {
    const checked = ticketCheckedIn(tickets[0]);
    return (
      <button
        type="button"
        onClick={() => onToggleSingle(tickets[0])}
        disabled={actionLoading}
        className={`${w}inline-flex items-center justify-center gap-1 whitespace-nowrap px-3 py-2 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
          checked ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100' : 'bg-teal-700 text-white hover:bg-teal-800'
        }`}
      >
        {checked && <MdCheck className="w-3.5 h-3.5" />}
        {checked ? 'Checked in' : 'Check in'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onOpenSheet(invoice.invoiceNumber)}
      aria-label={`Check in order, ${checkedIn} of ${total} checked in`}
      className={`${w}inline-flex items-center justify-center gap-1 whitespace-nowrap px-3 py-2 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors`}
    >
      {labeled && <span className="font-normal text-slate-500">Check-in</span>}
      {checkedIn}/{total}
    </button>
  );
}

export default function CheckinPaidTable({ invoices, eventId, stickyTop = 0 }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.checkInPaid);
  const [sheetInvoiceNo, setSheetInvoiceNo] = useState(null);
  const [infoInvoiceNo, setInfoInvoiceNo] = useState(null);

  const sheetInvoice = invoices.find((i) => i.invoiceNumber === sheetInvoiceNo) || null;
  const infoInvoice = invoices.find((i) => i.invoiceNumber === infoInvoiceNo) || null;

  // Direct toggle for a single-ticket order (its one attendee).
  const toggleSingle = async (ticket) => {
    if (actionLoading) return;
    const attendee = ticket.attendees?.[0];
    if (!attendee) return;
    try {
      if (attendee.checkedIn) {
        await dispatch(undoCheckInPaidAttendee({ eventId, ticketId: ticket._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: ticket._id, attendeeId: attendee._id, checkedIn: false, checkInTime: null }));
      } else {
        await dispatch(checkInPaidAttendee({ eventId, ticketId: ticket._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: ticket._id, attendeeId: attendee._id, checkedIn: true, checkInTime: new Date().toISOString() }));
      }
    } catch (err) {
      toast.error(err || 'Check-in failed');
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white py-10 text-center text-sm text-slate-500">
        No bookings found.
      </div>
    );
  }

  const controlProps = { actionLoading, onToggleSingle: toggleSingle, onOpenSheet: setSheetInvoiceNo };
  const thClass = 'sticky z-10 whitespace-nowrap bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500';

  return (
    <>
      {/* Desktop: a real table so the Invoice Number column grows and never truncates. */}
      <div className="hidden md:block min-w-0 rounded-lg border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={{ top: stickyTop }} className={`${thClass} text-left rounded-tl-lg`}>Invoice Number</th>
              <th style={{ top: stickyTop }} className={`${thClass} text-left w-full`}>Buyer</th>
              <th style={{ top: stickyTop }} className={`${thClass}`} aria-hidden="true" />
              <th style={{ top: stickyTop }} className={`${thClass} text-center rounded-tr-lg`}>Check-in</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.invoiceNumber} data-testid="checkinpaid-row" className="border-t border-slate-100">
                {/* Invoice stays on one line (grows to fit) and never wraps while there is room; the
                    buyer column (max-w-0 w-full) yields space and truncates instead of starving it. */}
                <td data-testid="checkinpaid-invoiceno" className="px-3 py-2.5 align-middle whitespace-nowrap font-mono text-xs text-slate-700">
                  {invoice.invoiceNumber}
                </td>
                <td className="w-full max-w-0 px-3 py-2.5 align-middle">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="truncate text-sm text-slate-700" title={buyerOf(invoice)}>{buyerOf(invoice)}</span>
                    <InfoButton invoice={invoice} onOpen={setInfoInvoiceNo} />
                  </div>
                </td>
                <td className="px-1 py-2.5 align-middle" />
                <td className="px-3 py-2.5 align-middle w-[8rem]">
                  <CheckInControl invoice={invoice} {...controlProps} block />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards. Invoice number on its own line (bold, wraps); buyer + info then the control. */}
      <div className="md:hidden divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {invoices.map((invoice) => (
          <div key={invoice.invoiceNumber} data-testid="checkinpaid-row-m" className="p-3">
            <div data-testid="checkinpaid-invoiceno" className="font-mono text-sm font-semibold text-slate-800 break-all">
              {invoice.invoiceNumber}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <span className="truncate text-sm text-slate-700" title={buyerOf(invoice)}>{buyerOf(invoice)}</span>
                <InfoButton invoice={invoice} onOpen={setInfoInvoiceNo} />
              </div>
              <CheckInControl invoice={invoice} {...controlProps} labeled />
            </div>
          </div>
        ))}
      </div>

      {sheetInvoice && (
        <CheckinPaid_CheckInSheet invoice={sheetInvoice} eventId={eventId} onClose={() => setSheetInvoiceNo(null)} />
      )}
      {infoInvoice && (
        <CheckinPaid_AttendeeInfo invoice={infoInvoice} onClose={() => setInfoInvoiceNo(null)} />
      )}
    </>
  );
}

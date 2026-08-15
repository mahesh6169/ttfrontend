// components/events/checkin/checkinpaid_CheckInSheet.jsx
//
// The paid multi-ticket check-in sheet (events-paid-checkin-redesign.md D10/D11). Content only -
// the shell is the shared ResponsiveSheet. Header: invoice no + status badge, buyer contact. Body:
// the order's tickets, each shown by TYPE + SEAT (paid names every ticket after the buyer, so a name
// would just repeat - D11) with the ticket number as muted meta. Footer: "Check in all" (disabled
// "All checked in" once every active ticket is in). Instant toggle; undo = tap again.

'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MdCheck } from 'react-icons/md';
import { toast } from 'react-toastify';
import ResponsiveSheet from '@/components/shared/ResponsiveSheet';
import {
  checkInPaidAttendee,
  undoCheckInPaidAttendee,
  updateLocalCheckIn,
} from '@/store/slices/events/checkInPaidSlice';

const seatLabel = (t) => (t.seats || []).map((s) => `${s.row || ''}${s.seatNumber || ''}`).filter(Boolean).join(', ');
const ticketPrimary = (t) => {
  const type = t.ticketType?.name || 'Ticket';
  const seat = seatLabel(t);
  return seat ? `${type} - ${seat}` : type;
};
const isCancelled = (t) => t.checkInStatus === 'cancelled';
const isCheckedIn = (t) => !!t.attendees?.[0]?.checkedIn;

export default function CheckinPaid_CheckInSheet({ invoice, eventId, onClose }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.checkInPaid);

  if (!invoice) return null;

  const tickets = invoice.tickets || [];
  const active = tickets.filter((t) => !isCancelled(t));
  const allIn = active.length > 0 && active.every(isCheckedIn);
  const b = invoice.buyer || {};
  const buyerName = `${b.firstName || ''} ${b.lastName || ''}`.trim();

  const toggleTicket = async (t) => {
    if (actionLoading || isCancelled(t)) return;
    const attendee = t.attendees?.[0];
    if (!attendee) return;
    try {
      if (attendee.checkedIn) {
        await dispatch(undoCheckInPaidAttendee({ eventId, ticketId: t._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: t._id, attendeeId: attendee._id, checkedIn: false, checkInTime: null }));
      } else {
        await dispatch(checkInPaidAttendee({ eventId, ticketId: t._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: t._id, attendeeId: attendee._id, checkedIn: true, checkInTime: new Date().toISOString() }));
      }
    } catch (err) {
      toast.error(err || 'Check-in failed');
    }
  };

  const checkInAll = async () => {
    if (actionLoading || allIn) return;
    for (const t of active) {
      if (isCheckedIn(t)) continue;
      const attendee = t.attendees?.[0];
      if (!attendee) continue;
      try {
        await dispatch(checkInPaidAttendee({ eventId, ticketId: t._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: t._id, attendeeId: attendee._id, checkedIn: true, checkInTime: new Date().toISOString() }));
      } catch (err) {
        toast.error(err || 'Check-in failed');
      }
    }
  };

  const header = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-mono font-semibold text-slate-700 break-all">{invoice.invoiceNumber}</span>
        <span className="shrink-0 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
          {allIn ? 'Done' : 'Paid'}
        </span>
      </div>
      <div className="mt-1 space-y-0.5 text-xs text-slate-500">
        {buyerName && <p className="truncate text-slate-700 font-medium">{buyerName}</p>}
        {b.email && <p className="truncate">{b.email}</p>}
        {b.phone && <p className="truncate">{b.phone}</p>}
      </div>
    </>
  );

  const footer = (
    <button
      type="button"
      onClick={checkInAll}
      disabled={actionLoading || allIn}
      className="w-full inline-flex items-center justify-center bg-teal-700 text-white hover:bg-teal-800 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {allIn ? 'All checked in' : 'Check in all'}
    </button>
  );

  return (
    <ResponsiveSheet onClose={onClose} testId="checkinpaid-sheet" ariaLabel="Check in tickets" header={header} footer={footer}>
      <div className="p-2 space-y-1">
        {tickets.map((t) => {
          const cancelled = isCancelled(t);
          const checked = isCheckedIn(t);
          return (
            <button
              key={t._id}
              type="button"
              onClick={() => toggleTicket(t)}
              disabled={actionLoading || cancelled}
              aria-pressed={checked}
              aria-label={`${ticketPrimary(t)}, ${cancelled ? 'cancelled' : checked ? 'checked in' : 'not checked in'}`}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border text-left transition-colors ${
                cancelled
                  ? 'bg-slate-100 border-slate-200 cursor-not-allowed'
                  : checked
                    ? 'bg-teal-50 border-teal-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
              } ${actionLoading ? 'opacity-60' : ''}`}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded flex items-center justify-center border ${
                  checked && !cancelled ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-slate-300'
                }`}
              >
                {checked && !cancelled && <MdCheck className="w-3.5 h-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium truncate ${cancelled ? 'text-slate-500' : checked ? 'text-teal-700' : 'text-slate-700'}`}>
                  {ticketPrimary(t)}
                </span>
                <span className="block text-xs text-slate-400 font-mono truncate">{t.ticketNumber}</span>
              </span>
              {cancelled && (
                <span className="shrink-0 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">Cancelled</span>
              )}
            </button>
          );
        })}
      </div>
    </ResponsiveSheet>
  );
}

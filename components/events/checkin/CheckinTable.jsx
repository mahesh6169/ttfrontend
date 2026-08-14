// components/events/checkin/CheckinTable.jsx
//
// PURPOSE: render a list of event REGISTRATIONS for the organiser's free-event door console -
// a table on desktop, a compact stacked list on mobile. Contract + guarantees:
// designguide/01-events/10-components.md (events / check-in scoped).
//
// DO NOT use outside check-in (not for invoices, listings, deals, coupons or any non-registration
// data). It knows the registration shape { registrationNumber, user/userId.name, email, mobile,
// attendees[{ _id, name, checkedIn }], formResponses } and nothing else. Do not generalise it on
// your own - a genuine third use is a planner promotion (park a note in planneragentsignoff.md).
//
// Guarantees enforced here: Reg Number NEVER truncates (auto column on desktop, own wrapping line
// on mobile); the info icon sits immediately AFTER the Booked-by name and only when answers exist;
// the Cancel X shows only when nobody is checked in; the check-in control adapts to party size; the
// column header is sticky-capable (the page passes stickyTop). Composes ResponsiveSheet for the
// check-in sheet and the RSVP-answers sheet.

'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MdClose, MdInfoOutline, MdCheck } from 'react-icons/md';
import { toast } from 'react-toastify';
import ConfirmModal from '@/components/ConfirmModal';
import CheckinRsvp_CheckInSheet from './checkinrsvp_CheckInSheet';
import CheckinRsvp_RsvpAnswersSheet from './checkinrsvp_RsvpAnswersSheet';
import {
  checkInAttendee,
  undoCheckInAttendee,
  updateLocalCheckIn,
  cancelRegistration,
} from '@/store/slices/events/checkinRsvpSlice';

const hasRsvpAnswers = (reg) =>
  (reg.formResponses || []).some(
    (r) => r && r.response !== undefined && r.response !== null && String(r.response).trim() !== ''
  );

// "Booked by": a member's account name, or - for a guest, whose name is blank or the 'Guest'
// placeholder (see waitlistController: "'Guest' is the guest placeholder, treat as blank") - the
// email they gave. A free registration always carries an email, so guests show their email, never
// the bare word "Guest".
const bookerOf = (reg) => {
  const name = reg.user?.name || reg.userId?.name;
  if (name && name !== 'Guest') return name;
  return reg.email || 'Guest';
};

// ── Shared cell pieces (single-sourced so desktop + mobile behave identically) ──
function InfoButton({ reg, onOpen }) {
  if (!hasRsvpAnswers(reg)) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(reg._id)}
      aria-label="View attendee information"
      className="shrink-0 p-1.5 text-slate-500 hover:text-slate-700"
    >
      <MdInfoOutline className="w-4 h-4" />
    </button>
  );
}

function CancelButton({ reg, noneCheckedIn, onOpen }) {
  if (!noneCheckedIn) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(reg)}
      aria-label="Cancel registration"
      className="shrink-0 p-2 text-slate-500 hover:text-slate-700"
    >
      <MdClose className="w-4 h-4" />
    </button>
  );
}

// block = fill the parent width (desktop table cell); labeled = carry an inline "Check-in" label on
// the party counter (mobile cards, which have no column header to explain the n/m number).
function CheckInControl({ reg, actionLoading, onToggleSingle, onOpenSheet, labeled = false, block = false }) {
  const attendees = reg.attendees || [];
  const total = attendees.length;
  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const w = block ? 'w-full ' : '';

  if (total === 1) {
    const checked = !!attendees[0]?.checkedIn;
    return (
      <button
        type="button"
        onClick={() => onToggleSingle(reg)}
        disabled={actionLoading}
        className={`${w}inline-flex items-center justify-center gap-1 whitespace-nowrap px-3 py-2 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 ${
          checked
            ? 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
            : 'bg-teal-700 text-white hover:bg-teal-800'
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
      onClick={() => onOpenSheet(reg._id)}
      aria-label={`Check in party, ${checkedInCount} of ${total} checked in`}
      className={`${w}inline-flex items-center justify-center gap-1 whitespace-nowrap px-3 py-2 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors`}
    >
      {labeled && <span className="font-normal text-slate-500">Check-in</span>}
      {checkedInCount}/{total}
    </button>
  );
}

export default function CheckinTable({ registrations, eventId, onRefresh, stickyTop = 0 }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.checkinRsvp);
  const [sheetRegId, setSheetRegId] = useState(null);
  const [answersRegId, setAnswersRegId] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);

  const sheetReg = registrations.find((r) => r._id === sheetRegId) || null;
  const answersReg = registrations.find((r) => r._id === answersRegId) || null;

  const toggleSingle = async (reg) => {
    if (actionLoading) return;
    const attendee = reg.attendees[0];
    try {
      if (attendee.checkedIn) {
        await dispatch(undoCheckInAttendee({ eventId, ticketId: reg._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: reg._id, attendeeId: attendee._id, checkedIn: false, checkInTime: null }));
      } else {
        await dispatch(checkInAttendee({ eventId, ticketId: reg._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: reg._id, attendeeId: attendee._id, checkedIn: true, checkInTime: new Date().toISOString() }));
      }
    } catch (err) {
      toast.error(err || 'Check-in failed');
    }
  };

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    try {
      await dispatch(cancelRegistration({ eventId, ticketId: pendingCancel._id })).unwrap();
      toast.success('Registration cancelled');
      setPendingCancel(null);
      onRefresh?.();
    } catch (err) {
      toast.error(err || 'Failed to cancel registration');
      setPendingCancel(null);
    }
  };

  if (registrations.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white py-10 text-center text-sm text-slate-500">
        No registrations found.
      </div>
    );
  }

  const controlProps = { actionLoading, onToggleSingle: toggleSingle, onOpenSheet: setSheetRegId };
  const thClass = 'sticky z-10 whitespace-nowrap bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500';

  return (
    <>
      {/* Desktop: a real table so the Reg Number column auto-grows to its content and never
          truncates, while the columns stay aligned across every row. The header is sticky-capable
          - the page passes the offset below its pinned search + tabs strip. */}
      <div className="hidden md:block min-w-0 rounded-lg border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th style={{ top: stickyTop }} className={`${thClass} text-left rounded-tl-lg`}>Reg Number</th>
              <th style={{ top: stickyTop }} className={`${thClass} text-left w-full`}>Booked by</th>
              <th style={{ top: stickyTop }} className={`${thClass} text-center`}>Check-in</th>
              <th style={{ top: stickyTop }} className={`${thClass} rounded-tr-lg`}><span className="sr-only">Cancel</span></th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((reg) => {
              const noneCheckedIn = (reg.attendees || []).every((a) => !a.checkedIn);
              return (
                <tr key={reg._id} data-testid="checkinrsvp-row" className="border-t border-slate-100">
                  {/* Reg wraps (break-words) instead of nowrap so a very long reg number never forces the
                      table wider than its container (which would clip the Check-in / Cancel columns) - it
                      is never truncated with an ellipsis either way. */}
                  <td data-testid="checkinrsvp-regno" className="px-3 py-2.5 align-middle break-words font-mono text-xs text-slate-700">
                    {reg.registrationNumber}
                  </td>
                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="truncate max-w-[18rem] text-sm text-slate-700" title={bookerOf(reg)}>
                        {bookerOf(reg)}
                      </span>
                      <InfoButton reg={reg} onOpen={setAnswersRegId} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle w-[8rem]">
                    <CheckInControl reg={reg} {...controlProps} block />
                  </td>
                  <td className="px-2 py-2.5 align-middle text-right">
                    <CancelButton reg={reg} noneCheckedIn={noneCheckedIn} onOpen={setPendingCancel} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: a compact stacked list. The reg number gets its own full-width line and wraps
          rather than truncating; the name + info sit on the next line beside the controls. */}
      <div className="md:hidden divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {registrations.map((reg) => {
          const noneCheckedIn = (reg.attendees || []).every((a) => !a.checkedIn);
          return (
            <div key={reg._id} data-testid="checkinrsvp-row-m" className="p-3">
              {/* Row 1: Reg Number (bold, wraps, never truncates) + the Cancel X - anchored together so
                  the X never orphans onto its own row (X only when nobody is checked in). */}
              <div className="flex items-start justify-between gap-2">
                <div data-testid="checkinrsvp-regno" className="min-w-0 font-mono text-sm font-semibold text-slate-800 break-all">
                  {reg.registrationNumber}
                </div>
                <CancelButton reg={reg} noneCheckedIn={noneCheckedIn} onOpen={setPendingCancel} />
              </div>
              {/* Row 2: Booked-by name + info icon on the left; the check-in control on the right. */}
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <span className="truncate text-sm text-slate-700" title={bookerOf(reg)}>{bookerOf(reg)}</span>
                  <InfoButton reg={reg} onOpen={setAnswersRegId} />
                </div>
                <CheckInControl reg={reg} {...controlProps} labeled />
              </div>
            </div>
          );
        })}
      </div>

      {sheetReg && (
        <CheckinRsvp_CheckInSheet registration={sheetReg} eventId={eventId} onClose={() => setSheetRegId(null)} />
      )}
      {answersReg && (
        <CheckinRsvp_RsvpAnswersSheet registration={answersReg} onClose={() => setAnswersRegId(null)} />
      )}

      <ConfirmModal
        isOpen={!!pendingCancel}
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
        isLoading={actionLoading}
        title="Cancel this registration?"
        message="This frees the spot and emails the registrant and organiser. This cannot be undone."
        confirmText="Yes, cancel it"
        cancelText="Keep it"
      />
    </>
  );
}

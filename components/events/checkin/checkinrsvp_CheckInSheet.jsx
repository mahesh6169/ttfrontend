// components/events/checkin/checkinrsvp_CheckInSheet.jsx
//
// The party-of-2+ check-in sheet (events-rsvp-checkin-redesign.md D15/D16). Content only -
// the bottom-sheet/dialog shell, close control, scrim, Escape and scroll-lock are provided by
// the shared ResponsiveSheet (00-shared/shared-components.md). Header = booking contact; body =
// attendee toggle rows; footer = Check in all. Every tap commits instantly through the reused
// thunks (checkInAttendee / undoCheckInAttendee / bulkCheckInRegistration) with an optimistic
// local update; undo is tapping a checked row again (D14). Attendee-row look per D16.

'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MdCheck } from 'react-icons/md';
import { toast } from 'react-toastify';
import ResponsiveSheet from '@/components/shared/ResponsiveSheet';
import {
  checkInAttendee,
  undoCheckInAttendee,
  bulkCheckInRegistration,
  updateLocalCheckIn,
  updateLocalBulkCheckIn,
} from '@/store/slices/events/checkinRsvpSlice';

export default function CheckinRsvp_CheckInSheet({ registration, eventId, onClose }) {
  const dispatch = useDispatch();
  const { actionLoading } = useSelector((state) => state.checkinRsvp);

  if (!registration) return null;

  const attendees = registration.attendees || [];
  const checkedInCount = attendees.filter((a) => a.checkedIn).length;
  const allCheckedIn = attendees.length > 0 && checkedInCount === attendees.length;
  const bookerName = registration.user?.name || registration.userId?.name;

  const toggleAttendee = async (attendee) => {
    if (actionLoading) return;
    try {
      if (attendee.checkedIn) {
        await dispatch(undoCheckInAttendee({ eventId, ticketId: registration._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: registration._id, attendeeId: attendee._id, checkedIn: false, checkInTime: null }));
      } else {
        await dispatch(checkInAttendee({ eventId, ticketId: registration._id, attendeeId: attendee._id })).unwrap();
        dispatch(updateLocalCheckIn({ ticketId: registration._id, attendeeId: attendee._id, checkedIn: true, checkInTime: new Date().toISOString() }));
      }
    } catch (err) {
      toast.error(err || 'Check-in failed');
    }
  };

  const toggleAll = async () => {
    if (actionLoading) return;
    const checkIn = !allCheckedIn;
    try {
      await dispatch(bulkCheckInRegistration({ eventId, ticketId: registration._id, checkIn })).unwrap();
      dispatch(updateLocalBulkCheckIn({ ticketId: registration._id, checkedIn: checkIn, checkInTime: checkIn ? new Date().toISOString() : null }));
    } catch (err) {
      toast.error(err || 'Bulk check-in failed');
    }
  };

  const header = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-mono font-semibold text-slate-700 break-all">{registration.registrationNumber}</span>
        <span className="shrink-0 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
          {allCheckedIn ? 'Done' : "RSVP'd"}
        </span>
      </div>
      <div className="mt-1 space-y-0.5 text-xs text-slate-500">
        {bookerName && <p className="truncate text-slate-700 font-medium">{bookerName}</p>}
        {registration.email && <p className="truncate">{registration.email}</p>}
        {registration.mobile && <p className="truncate">{registration.mobile}</p>}
      </div>
    </>
  );

  const footer = (
    <button
      type="button"
      onClick={toggleAll}
      disabled={actionLoading}
      className="w-full inline-flex items-center justify-center bg-teal-700 text-white hover:bg-teal-800 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {allCheckedIn ? 'Check out all' : 'Check in all'}
    </button>
  );

  return (
    <ResponsiveSheet onClose={onClose} testId="checkin-sheet" ariaLabel="Check in attendees" header={header} footer={footer}>
      <div className="p-2 space-y-1">
        {attendees.map((att) => (
          <button
            key={att._id}
            type="button"
            onClick={() => toggleAttendee(att)}
            disabled={actionLoading}
            aria-pressed={!!att.checkedIn}
            aria-label={`${att.name}, ${att.checkedIn ? 'checked in' : 'not checked in'}`}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border text-left transition-colors disabled:opacity-60 ${
              att.checkedIn ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span
              className={`shrink-0 w-5 h-5 rounded flex items-center justify-center border ${
                att.checkedIn ? 'bg-teal-600 border-teal-600 text-white' : 'bg-white border-slate-300'
              }`}
            >
              {att.checkedIn && <MdCheck className="w-3.5 h-3.5" />}
            </span>
            <span className={`text-sm font-medium truncate ${att.checkedIn ? 'text-teal-700' : 'text-slate-700'}`}>
              {att.name}
            </span>
          </button>
        ))}
      </div>
    </ResponsiveSheet>
  );
}

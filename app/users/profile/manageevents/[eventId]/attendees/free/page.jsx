'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventAttendees, checkinFreeEvent, resetAttendeesState, undoCheckinFreeEvent } from '@/store/slices/events/freeEventSlice';

import LoadingSpinner from '@/components/LoadingSpinner';

const ManageAttendeesFreePage = () => {
  const dispatch = useDispatch();
  const { eventId } = useParams();

  // Select from Redux
  const {
    currentEventAttendees,
    attendeesStatus,
    attendeesError,
    checkinStatus,
    checkinError
  } = useSelector((state) => state.freeEvents);

  // Fetch attendees on mount or eventId change
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventAttendees(eventId));
    }
    // Reset on unmount (optional, for cleanliness)
    return () => {
      dispatch(resetAttendeesState());
    };
  }, [eventId, dispatch]);

  // Check in a specific attendee
  const handleCheckin = (ticketId, attendeeId) => {
    dispatch(checkinFreeEvent({ eventId, ticketId, attendeeId }));
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-teal-700">Manage Attendees (Free Event)</h1>

      {attendeesStatus === 'loading' ? (
        <LoadingSpinner />
      ) : attendeesError ? (
        <div className="text-red-600">{attendeesError}</div>
      ) : (
        <>
          {currentEventAttendees.length === 0 ? (
            <div className="text-gray-500">No registrations for this event yet.</div>
          ) : (
            <div className="space-y-8">
              {currentEventAttendees.map((registration) => (
                <div key={registration._id} className="border rounded-lg p-4 shadow-sm">
                  <div className="font-bold text-teal-700 mb-2">
                    Registration #: {registration.registrationNumber}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold">Email:</span> {registration.email}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Attendees:</span>
                  </div>
                  <table className="w-full mb-2 border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-1 px-2">Name</th>
                        <th className="py-1 px-2">Age</th>
                        <th className="py-1 px-2">Status</th>
                        <th className="py-1 px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registration.attendees.map((attendee, idx) => (
                        <tr key={idx}>
                          <td className="py-1 px-2">{attendee.name}</td>
                          <td className="py-1 px-2">{attendee.age ?? '-'}</td>
                          <td className="py-1 px-2">
                            {attendee.checkedIn ? (
                              <span className="text-green-600 font-semibold">Checked In</span>
                            ) : (
                              <span className="text-orange-600">Not Checked In</span>
                            )}
                          </td>
<td className="py-1 px-2">
  {attendee.checkedIn ? (
    <button
      className="bg-yellow-500 text-white px-3 py-1 rounded disabled:opacity-50"
      disabled={checkinStatus === 'loading'}
      onClick={() => dispatch(
        undoCheckinFreeEvent({ eventId, ticketId: registration._id, attendeeId: attendee._id })
      )}
    >
      {checkinStatus === 'loading' ? 'Undoing...' : 'Undo Check-In'}
    </button>
  ) : (
    <button
      className="bg-teal-600 text-white px-3 py-1 rounded disabled:opacity-50"
      disabled={checkinStatus === 'loading'}
      onClick={() => handleCheckin(registration._id, attendee._id)}
    >
      {checkinStatus === 'loading' ? 'Checking In...' : 'Check In'}
    </button>
  )}
</td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-xs text-gray-400">Created: {new Date(registration.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {checkinError && <div className="text-red-600 mt-4">{checkinError}</div>}
    </div>
  );
};

export default ManageAttendeesFreePage;

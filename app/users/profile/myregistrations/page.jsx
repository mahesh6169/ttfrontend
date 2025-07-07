'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatInTimeZone } from 'date-fns-tz';

import { fetchMyFreeRegistrations, registerForFreeEvent, unregisterFromFreeEvent, resetRegistrationState } from '@/store/slices/events/freeEventSlice';

import LoadingSpinner from '@/components/LoadingSpinner';

const MyFreeEventRegistrationsPage = () => {
  const dispatch = useDispatch();

  // Grab relevant state
  const {
    myFreeRegistrations,
    myFreeRegistrationsStatus,
    myFreeRegistrationsError,
  } = useSelector((state) => state.freeEvents);

  // For button disable state
  const { registrationStatus } = useSelector((state) => state.freeEvents);

  useEffect(() => {
    dispatch(fetchMyFreeRegistrations());
  }, [dispatch]);

  useEffect(() => {
    if (registrationStatus === 'succeeded') {
      dispatch(fetchMyFreeRegistrations());
      // Optional: Reset the registration status so this doesn't fire repeatedly
      setTimeout(() => dispatch(resetRegistrationState()), 500);
    }
  }, [registrationStatus, dispatch]);

  // Handler for register (this can be extended with attendee info as needed)
  const handleRegister = (eventId) => {
    // Here you'd usually show a modal/form for attendee details. For now:
    dispatch(registerForFreeEvent({ eventId, registrationData: { attendees: [{ name: 'Your Name' }] } }));
  };

  const handleUnregister = (eventId) => {
    dispatch(unregisterFromFreeEvent(eventId));
  };

  // Create a lookup map for quick registered check
  const registrationMap = {};
  myFreeRegistrations.forEach((reg) => {
    registrationMap[reg.event._id] = reg;
  });

  // Render
  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">My Free Event Registrations</h1>

      {myFreeRegistrationsStatus === 'loading' && (
        <div className="flex justify-center items-center">
          <LoadingSpinner />
        </div>
      )}

      {myFreeRegistrationsError && (
        <div className="text-red-500 mb-4">
          {myFreeRegistrationsError}
        </div>
      )}

      {myFreeRegistrationsStatus === 'succeeded' && myFreeRegistrations.length === 0 && (
        <div className="text-gray-500">You have not registered for any free events yet.</div>
      )}

      {myFreeRegistrationsStatus === 'succeeded' && myFreeRegistrations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Event Title</th>
                <th className="py-2 px-4 text-left">Date & Time</th>
                <th className="py-2 px-4 text-left">Venue</th>
                <th className="py-2 px-4 text-left">Registration Status</th>
              </tr>
            </thead>
            <tbody>
              {myFreeRegistrations.map((reg) => {
                // Use EXACT same timezone-aware formatting as EventCard
                const dateTimeZone = reg.event.timeZone || 'Australia/Sydney';

                // Use single formatInTimeZone call like EventCard to avoid timezone issues
                const formattedDateTime = formatInTimeZone(
                  reg.event.dateTime,
                  dateTimeZone,
                  'EEE dd MMM yyyy, h:mm a'
                );

                // Split the formatted string to display on separate lines
                const [datePart, timePart] = formattedDateTime.split(', ');

                return (
                  <tr key={reg.event._id} className="border-t">
                    <td className="py-2 px-4 font-medium">{reg.event.title}</td>
                    <td className="py-2 px-4">
                      <div className="text-sm">
                        <div className="font-medium">
                          {datePart}
                        </div>
                        <div className="text-gray-600">
                          {timePart}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dateTimeZone}
                        </div>
                      </div>
                    </td>
<td className="py-2 px-4 text-sm">
  <div className="font-medium">{reg.event.venue}</div>
  {reg.event.address?.formattedAddress ? (
    <div className="text-gray-600 text-xs">
      {reg.event.address.formattedAddress}
    </div>
  ) : reg.event.address?.suburb && (
    <div className="text-gray-600 text-xs">
      {reg.event.address.suburb}, {reg.event.address.state}
    </div>
  )}
</td>
                    <td className="py-2 px-4">
                      <button
                        className={
                          reg.status === 'registered'
                            ? 'bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700'
                            : 'bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700'
                        }
                        onClick={() =>
                          reg.status === 'registered'
                            ? handleUnregister(reg.event._id)
                            : handleRegister(reg.event._id)
                        }
                        disabled={registrationStatus === 'loading'}
                      >
                        {registrationStatus === 'loading'
                          ? 'Processing...'
                          : reg.status === 'registered'
                            ? 'Unregister'
                            : 'Register'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyFreeEventRegistrationsPage;
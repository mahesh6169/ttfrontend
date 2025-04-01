'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById } from '@/store/slices/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';

const EventDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  const { selectedEvent: event, loading, error } = useSelector((state) => state.events);

  useEffect(() => {
    if (id) {
      dispatch(fetchEventById(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  }

  if (!event) {
    return <div className="text-center text-gray-500 mt-8">Event not found.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
        <p className="text-gray-600 mb-2">
          {new Date(event.dateTime).toLocaleString('en-AU', { timeZone: event.timeZone })}
        </p>
        <p className="text-gray-700 mb-4">{event.description}</p>

        <div className="mb-4">
          <strong>Venue:</strong> {event.venue}
        </div>

        <div className="mb-4">
  <strong>Organiser:</strong> {event.organiser?.name}<br />
  <strong>Email:</strong> {event.organiser?.email || 'N/A'}<br />
  <strong>Website:</strong> {event.organiser?.website || 'N/A'}<br />
  <strong>Primary Contact:</strong>{' '}
  {event.organiser?.primaryContact?.name} ({event.organiser?.primaryContact?.phone})<br />
  {event.organiser?.secondaryContact?.name && (
    <>
      <strong>Secondary Contact:</strong>{' '}
      {event.organiser.secondaryContact.name} ({event.organiser.secondaryContact.phone})
    </>
  )}
</div>


        <div className="mb-4">
          <strong>Location:</strong> {event.address?.formattedAddress || 'N/A'}
        </div>

        {event.images?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {event.images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={`event-image-${i}`}
                className="rounded w-full h-40 object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;

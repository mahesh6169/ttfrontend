'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { fetchMyEvents, deleteMyEvent } from '@/store/slices/events/eventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import Link from 'next/link';

const ManageEventsPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const { myEvents, loading, error, deleteStatus, deleteError, formStatus } = useSelector((state) => state.events);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchMyEvents());
  }, [dispatch]);

  const handleEdit = (event) => {
    router.push(`/events/edit/${event._id}`);
  };

  const confirmDelete = (eventId) => {
    setEventToDelete(eventId);
    setIsModalOpen(true);
  };

const handleDelete = async () => {
  // Prevent multiple clicks
  if (deleteStatus === 'loading') return;
  
  try {
    const result = await dispatch(deleteMyEvent(eventToDelete));

    if (deleteMyEvent.fulfilled.match(result)) {
      toast.success('Event deleted successfully.');
      setIsModalOpen(false);
      setEventToDelete(null);
    } else {
      toast.error(result.payload || 'Failed to delete event.');
    }
  } catch (err) {
    toast.error('Unexpected error occurred.');
  }
};

const handleModalCancel = () => {
  // Prevent closing modal while deleting
  if (deleteStatus === 'loading') return;
  setIsModalOpen(false);
  setEventToDelete(null);
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-6">{error}</div>;
  }

  return (
    <div className="m-2">
      <h1 className="text-2xl font-bold text-center mb-6 text-teal-700" >Manage Events</h1>
      <Link
        href="/events/add"
        onClick={() =>
          localStorage.setItem(
            'cancelRedirectUrl',
            '/users/profile/manageevents'
          )
        }
        className="block my-2 p-2 bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100 font-semibold lg:w-1/4 text-center rounded"
      >
        + Post New Event
      </Link>

      {myEvents.length === 0 ? (
        <p className="text-center text-gray-600">
          You haven’t posted any events yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {myEvents.map((event) => {
  const isExpired = new Date() > new Date(event.willExpire);

  return (
    <div
      key={event._id}
      className="p-4 border rounded shadow hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
  <h2 className="text-lg font-bold">{event.title}</h2>
  {isExpired && (
    <span className="text-sm font-semibold text-red-600">Expired</span>
  )}
</div>


      <p className="text-sm text-gray-500 mb-2">
        {new Date(event.dateTime).toLocaleString('en-AU', {
          timeZone: event.timeZone,
        })}
      </p>
      {event.images?.[0]?.url && (
        <img
          src={event.images[0].url}
          alt={event.title}
          className="w-full h-40 object-cover rounded mb-2"
        />
      )}
<div className="flex flex-wrap items-center mt-4">
  <button
    onClick={() => !isExpired && handleEdit(event)}
    className={`px-4 py-1 rounded flex items-center gap-1 ${
      isExpired || formStatus === 'loading'
        ? 'bg-gray-400 text-white cursor-not-allowed'
        : 'bg-teal-600 text-lime-100 hover:bg-teal-700 hover:text-lime-100'
    }`}
    disabled={isExpired || formStatus === 'loading'}
  >
    {formStatus === 'loading' && (
      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
    )}
    {formStatus === 'loading' ? 'Loading...' : 'Edit'}
  </button>
  <button
    onClick={() => confirmDelete(event._id)}
    disabled={deleteStatus === 'loading'}
    className={`bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 ml-4 ${
      deleteStatus === 'loading' ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    Delete
  </button>
</div>

    </div>
  );
})}
        </div>
      )}

      <ConfirmModal
  isOpen={isModalOpen}
  onConfirm={handleDelete}
  onCancel={handleModalCancel}
  title="Delete Event"
  message={deleteStatus === 'loading' ? "Deleting event..." : "Are you sure you want to delete this event?"}
  confirmText={deleteStatus === 'loading' ? "Deleting..." : "Delete"}
  isLoading={deleteStatus === 'loading'}
/>
    </div>
  );
};

export default ManageEventsPage;

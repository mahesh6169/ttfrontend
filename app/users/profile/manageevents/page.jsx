'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { fetchMyEvents, deleteMyEvent } from '@/store/slices/events/eventSlice';
import axios from '@/utils/axiosConfig';
import LoadingSpinner from '@/components/LoadingSpinner';
import ConfirmModal from '@/components/ConfirmModal';
import Link from 'next/link';

const ManageEventsPage = () => {
  const FALLBACK_IMAGE = process.env.NEXT_PUBLIC_FALLBACK_EVENT_IMAGE_URL;
  const dispatch = useDispatch();
  const router = useRouter();

  const { myEvents, status, error, deleteStatus, deleteError, formStatus } = useSelector((state) => state.events);
  const loading = status === 'loading';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchMyEvents());
  }, [dispatch]);

  const handleEdit = (event) => {
    // Save where we came from for Cancel button
    localStorage.setItem('cancelRedirectUrl', '/users/profile/manageevents');
    router.push(`/events/edit/${event._id}`);
  };

  const handleToggleGoLive = async (event) => {
    try {
      const newGoLiveStatus = !event.goLive;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      const response = await axios.patch(
        `${API_BASE_URL}/events/${event._id}/toggle-golive`,
        { goLive: newGoLiveStatus },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Refetch events to update UI
        dispatch(fetchMyEvents());
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const confirmDelete = (event) => {
    setEventToDelete(event);
    setIsModalOpen(true);
  };

const handleDelete = async () => {
  // Prevent multiple clicks
  if (deleteStatus === 'loading') return;
  
  try {
    const result = await dispatch(deleteMyEvent(eventToDelete._id));

    if (deleteMyEvent.fulfilled.match(result)) {
      toast.success('Event deleted successfully.');
      setIsModalOpen(false);
      setEventToDelete(null);
      // Refetch events to ensure consistency
      try {
        await dispatch(fetchMyEvents()).unwrap();
      } catch (refetchError) {
        console.error('Failed to refetch events:', refetchError);
        toast.warning('Event deleted but failed to refresh list. Please reload the page.');
      }
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
    <div className="p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-6 text-teal-700">Manage Events</h1>
      <Link
        href="/events/add"
        onClick={() =>
          localStorage.setItem(
            'cancelRedirectUrl',
            '/users/profile/manageevents'
          )
        }
        className="block mb-3 sm:mb-4 p-2 sm:p-3 bg-teal-600 text-lime-100 hover:bg-teal-700 hover:text-lime-100 font-semibold sm:w-auto md:w-1/3 lg:w-1/4 text-center rounded text-sm sm:text-base"
      >
        + Post New Event
      </Link>

      {myEvents.length === 0 ? (
        <p className="text-center text-gray-600 text-sm sm:text-base">
          You haven't posted any events yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {myEvents.map((event) => {
  const isExpired = new Date() > new Date(event.willExpire);

  return (
    <div
      key={event._id}
      className="p-2 sm:p-4 border rounded shadow hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
  <h2 
    className="text-sm sm:text-lg font-bold cursor-pointer hover:underline line-clamp-2"
    onClick={() => router.push(`/events/views/${event._id}`)}
  >
    {event.title}
  </h2>
  {isExpired && (
    <span className="text-xs sm:text-sm font-semibold text-red-600 whitespace-nowrap">Expired</span>
  )}
</div>


      <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">
        {new Date(event.dateTime).toLocaleString('en-AU', {
          timeZone: event.timeZone,
        })}
      </p>
      <img
        src={event.images?.[0]?.url || FALLBACK_IMAGE}
        alt={event.title}
        className="w-full h-auto rounded mb-2"
      />
<div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-4">
  <button
    onClick={() => !isExpired && handleEdit(event)}
    className={`px-2 sm:px-4 py-1 rounded flex items-center gap-1 text-xs sm:text-sm ${
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
    onClick={() => confirmDelete(event)}
    disabled={deleteStatus === 'loading'}
    className={`bg-red-500 text-white px-2 sm:px-4 py-1 rounded hover:bg-red-600 text-xs sm:text-sm ${
      deleteStatus === 'loading' ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    Delete
  </button>
  <button
    onClick={() => handleToggleGoLive(event)}
    disabled={status === 'loading'}
    className={`px-2 sm:px-4 py-1 rounded font-medium transition-colors text-xs sm:text-sm ${
      event.goLive !== false
        ? 'bg-green-500 text-white hover:bg-green-600'
        : 'bg-gray-400 text-gray-700 hover:bg-gray-500'
    } ${
      status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''
    }`}
    title={event.goLive !== false ? 'Click to take offline' : 'Click to go live'}
  >
    {event.goLive !== false ? '● LIVE' : '○ OFFLINE'}
  </button>
</div>
{event.recurrence?.isRecurring && (
  <p className="text-xs text-orange-600 mt-1 sm:mt-2 italic">
    ⚠️ Recurring event. Changes apply to all occurrences.
  </p>
)}

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
  message={
    deleteStatus === 'loading' 
      ? "Deleting event..." 
      : eventToDelete?.recurrence?.isRecurring
        ? "⚠️ This is a recurring event. Deleting will remove ALL occurrences and associated data. Are you sure you want to delete this entire event series?"
        : "Are you sure you want to delete this event?"
  }
  confirmText={deleteStatus === 'loading' ? "Deleting..." : "Delete"}
  isLoading={deleteStatus === 'loading'}
/>
    </div>
  );
};

export default ManageEventsPage;

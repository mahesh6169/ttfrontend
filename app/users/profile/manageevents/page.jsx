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

  const { myEvents, status, error, deleteStatus, formStatus } = useSelector((state) => state.events);
  const loading = status === 'loading';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchMyEvents());
  }, [dispatch]);

  const handleEdit = (event) => {
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
    if (deleteStatus === 'loading') return;

    try {
      const result = await dispatch(deleteMyEvent(eventToDelete._id));

      if (deleteMyEvent.fulfilled.match(result)) {
        toast.success('Event deleted successfully.');
        setIsModalOpen(false);
        setEventToDelete(null);
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
    if (deleteStatus === 'loading') return;
    setIsModalOpen(false);
    setEventToDelete(null);
  };

  const PageHeader = () => (
    <div className="mb-6">
      {/* Back button */}
      <Link
        href="/users/profile"
        className="inline-flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors mb-4"
      >
        <span>&lt;</span>
        <span>back</span>
      </Link>

      {/* Hero section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manage Events</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create, edit and manage your events</p>
        </div>
        <Link
          href="/events/add"
          onClick={() =>
            localStorage.setItem('cancelRedirectUrl', '/users/profile/manageevents')
          }
          className="inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-teal-700 text-white hover:bg-teal-800 font-semibold text-sm rounded-lg shadow-sm transition-colors"
        >
          + Post New Event
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="px-2 py-6 sm:px-6 sm:py-8">
        <PageHeader />
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 py-6 sm:px-6 sm:py-8">
        <PageHeader />
        <div className="text-center py-12">
          <p className="text-red-600 font-semibold">Error loading events</p>
          <p className="text-slate-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-6 sm:px-6 sm:py-8">
      <PageHeader />

      {myEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">You haven't posted any events yet.</p>
          <p className="text-slate-500 text-sm mt-1">Click "+ Post New Event" to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {myEvents.map((event) => {
            const isExpired = new Date() > new Date(event.willExpire);
            const isLive = event.goLive !== false;

            return (
              <div
                key={event._id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Image */}
                <div
                  className="w-full h-32 sm:h-40 rounded-t-xl overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/events/views/${event._id}`)}
                >
                  <img
                    src={event.images?.[0]?.url || FALLBACK_IMAGE}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="p-2 pt-1.5">
                  <h3
                    className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-teal-700"
                    onClick={() => router.push(`/events/views/${event._id}`)}
                  >
                    {event.title}
                  </h3>

                  {/* Status line */}
                  <p className={`text-xs mt-0.5 ${
                    isExpired
                      ? 'text-red-600 font-medium'
                      : isLive
                      ? 'text-green-600'
                      : 'text-slate-500'
                  }`}>
                    {isExpired ? 'Expired' : isLive ? 'Live' : 'Offline'}
                    {event.recurrence?.isRecurring && ' · ↻ Recurring'}
                  </p>

                  {/* Date/time */}
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {new Date(event.dateTime).toLocaleString('en-AU', {
                      timeZone: event.timeZone,
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between sm:justify-center sm:gap-6 mt-2 text-sm">
                    <button
                      type="button"
                      onClick={() => !isExpired && handleEdit(event)}
                      disabled={isExpired}
                      className={`font-semibold py-1 active:underline ${
                        isExpired
                          ? 'text-slate-400'
                          : 'text-teal-700 hover:text-teal-900'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleGoLive(event)}
                      className="text-teal-700 hover:text-teal-900 active:underline font-semibold py-1"
                    >
                      {isLive ? 'Offline' : 'Go Live'}
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(event)}
                      className="text-red-600 hover:text-red-700 active:underline font-semibold py-1"
                    >
                      Delete
                    </button>
                  </div>
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
        message={
          deleteStatus === 'loading'
            ? "Deleting event..."
            : eventToDelete?.recurrence?.isRecurring
              ? "This is a recurring event. Deleting will remove ALL occurrences. Are you sure?"
              : "Are you sure you want to delete this event?"
        }
        confirmText={deleteStatus === 'loading' ? "Deleting..." : "Delete"}
        isLoading={deleteStatus === 'loading'}
      />
    </div>
  );
};

export default ManageEventsPage;

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import { formatInTimeZone } from 'date-fns-tz';
import { FaRedo } from 'react-icons/fa';

const ManageEventsPage = () => {
  // State management - replaces Redux store
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ 
    totalPages: 1, 
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10
  });
  const [sendingReminders, setSendingReminders] = useState({});
  const [deletingEvents, setDeletingEvents] = useState({});
  
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Fetch events - replaces getManageEvents Redux action
  const fetchEvents = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${BASE_URL}/admin/events/manage?page=${pageNum}&limit=10`,
        { withCredentials: true }
      );
      
      if (data.success) {
        setEvents(data.events || []);
        setMeta(data.meta || { 
          totalPages: 1, 
          totalItems: 0,
          currentPage: pageNum,
          itemsPerPage: 10
        });
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to load events');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvents(1);
  }, []);

  // Handle pagination - replaces updateAdminEventFilter Redux action
  const handlePageChange = (newPage) => {
    fetchEvents(newPage);
  };

  // Send reminder - replaces sendEventReminder Redux action
  const handleNotify = async (eventId, type) => {
    const key = `${eventId}-${type}`;
    setSendingReminders(prev => ({ ...prev, [key]: true }));
    
    try {
      const { data } = await axios.post(
        `${BASE_URL}/admin/events/remind/${eventId}`,
        { type },
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success(`Notify ${type} email sent successfully`);
        
        // Refresh the list after a small delay to ensure backend has updated
        setTimeout(() => {
          fetchEvents(page);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast.error(error.response?.data?.message || 'Failed to send reminder');
    } finally {
      setSendingReminders(prev => ({ ...prev, [key]: false }));
    }
  };

  // Delete event - replaces deleteEventById Redux action
  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    setDeletingEvents(prev => ({ ...prev, [eventId]: true }));
    
    try {
      const { data } = await axios.delete(
        `${BASE_URL}/admin/events/byid/${eventId}`,
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success('Event deleted successfully');
        
        // If we deleted the last item on a page, go to previous page
        if (events.length === 1 && page > 1) {
          fetchEvents(page - 1);
        } else {
          fetchEvents(page);
        }
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
    } finally {
      setDeletingEvents(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // Render
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Event Deletion Management</h1>

      {loading && <LoadingSpinner />}
      
      {!loading && events.length === 0 && (
        <p className="text-gray-500">No events found.</p>
      )}

      {!loading && events.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {events.length} of {meta.totalItems} events
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Owner Email</th>
                  <th className="border p-2">Event Date</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Actions</th>
                  <th className="border p-2">Moderation</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const { _id, title, email, dateTime, timeZone, status, actions, isRecurring } = event;
                  const reminderKey1 = `${_id}-1`;
                  const reminderKey2 = `${_id}-2`;

                  return (
                    <tr
                      key={_id}
                      className={
                        status === 'expired' ? 'bg-red-50' : status === 'active' ? 'bg-white' : ''
                      }
                    >
                      <td className="border p-2">{title}</td>
                      <td className="border p-2">{email}</td>
                      <td className="border p-2">
                        <div className="flex items-center gap-2">
                          {formatInTimeZone(
                            dateTime,
                            timeZone || 'Australia/Sydney',
                            'dd/MM/yyyy h:mm a zzz'
                          )}
                          {isRecurring && (
                            <FaRedo 
                              className="text-blue-500" 
                              title="Recurring Event"
                              size={12}
                            />
                          )}
                        </div>
                      </td>
                      <td className="border p-2 capitalize">{status}</td>

                      <td className="border p-2 space-x-2">
                        {/* Notify 1 */}
                        <button
                          disabled={!actions.notify1.enabled || sendingReminders[reminderKey1]}
                          onClick={() => handleNotify(_id, '1')}
                          className={`px-2 py-1 text-xs rounded transition ${
                            actions.notify1.enabled
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {sendingReminders[reminderKey1] ? 'Sending...' : 'Notify 1'}
                        </button>

                        {/* Notify 2 */}
                        <button
                          disabled={!actions.notify2.enabled || sendingReminders[reminderKey2]}
                          onClick={() => handleNotify(_id, '2')}
                          className={`px-2 py-1 text-xs rounded transition ${
                            actions.notify2.enabled
                              ? 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {sendingReminders[reminderKey2] ? 'Sending...' : 'Notify 2'}
                        </button>

                        {/* Delete */}
                        <button
                          disabled={!actions.delete.enabled || deletingEvents[_id]}
                          onClick={() => handleDelete(_id)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            actions.delete.enabled
                              ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {deletingEvents[_id] ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>

                      <td className="border p-2">
                        <button
                          disabled={!actions.moderationDelete.enabled || deletingEvents[_id]}
                          onClick={() => handleDelete(_id)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            actions.moderationDelete.enabled
                              ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          {deletingEvents[_id] ? 'Deleting...' : 'Moderation Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={meta?.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ManageEventsPage;
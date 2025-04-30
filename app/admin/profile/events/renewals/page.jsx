'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getManageEvents,
  updateAdminEventFilter,
  sendEventReminder,
  deleteEventById,
} from '@/store/slices/admin/events/adminManageEventSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';

const ManageEventsPage = () => {
  const dispatch = useDispatch();

  const { manageEvents, status, error, page, limit, meta } = useSelector(
    (state) => state.adminManageEvent
  );

  useEffect(() => {
    dispatch(getManageEvents());
  }, [dispatch, page, limit]);

  const handlePageChange = (newPage) => {
    dispatch(updateAdminEventFilter({ page: newPage }));
  };

  const handleNotify = (eventId, type) => {
    dispatch(sendEventReminder({ eventId, type }));
  };

  const handleDelete = (eventId) => {
    if (confirm('Are you sure you want to delete this event?')) {
      dispatch(deleteEventById(eventId));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Events</h1>

      {status === 'loading' && <LoadingSpinner />}
      {error && <p className="text-red-500">Error: {error}</p>}
      {status === 'success' && manageEvents.length === 0 && (
        <p className="text-gray-500">No events found.</p>
      )}

      {status === 'success' && manageEvents.length > 0 && (
        <>
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
                {manageEvents.map((event) => {
                  const { _id, title, email, dateTime, status, actions } = event;

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
                        {new Date(dateTime).toLocaleString('en-AU')}
                      </td>
                      <td className="border p-2 capitalize">{status}</td>

                      <td className="border p-2 space-x-2">
                        {/* Notify 1 */}
                        <button
                          disabled={!actions.notify1.enabled}
                          onClick={() => handleNotify(_id, '1')}
                          className={`px-2 py-1 text-xs rounded transition ${
                            actions.notify1.enabled
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          Notify 1
                        </button>

                        {/* Notify 2 */}
                        <button
                          disabled={!actions.notify2.enabled}
                          onClick={() => handleNotify(_id, '2')}
                          className={`px-2 py-1 text-xs rounded transition ${
                            actions.notify2.enabled
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          Notify 2
                        </button>

                        {/* Delete */}
                        <button
                          disabled={!actions.delete.enabled}
                          onClick={() => handleDelete(_id)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            actions.delete.enabled
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          Delete
                        </button>
                      </td>

                      <td className="border p-2">
                        <button
                          disabled={!actions.moderationDelete.enabled}
                          onClick={() => handleDelete(_id)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            actions.moderationDelete.enabled
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          Moderation Delete
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

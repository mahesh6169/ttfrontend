"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getManageEvents,
  updateAdminEventFilter,
  sendEventReminder,
  deleteEventById,
} from "@/store/slices/adminManageEventSlice";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";

const ManageEventsPage = () => {
  const dispatch = useDispatch();

  const {
    manageEvents,
    status,
    error,
    page,
    limit,
    meta,
  } = useSelector((state) => state.adminManageEvent);

  useEffect(() => {
    dispatch(getManageEvents());
  }, [dispatch, page, limit]);

  const handlePageChange = (newPage) => {
    dispatch(updateAdminEventFilter({ page: newPage }));
  };

  const handleNotify = (eventId) => {
    dispatch(sendEventReminder(eventId));
  };

  const handleDelete = (eventId) => {
    if (confirm("Are you sure you want to delete this event?")) {
      dispatch(deleteEventById(eventId));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Events</h1>

      {status === "loading" && <LoadingSpinner />}
      {error && <p className="text-red-500">Error: {error}</p>}
      {status === "success" && manageEvents.length === 0 && (
        <p className="text-gray-500">No events found.</p>
      )}

      {status === "success" && manageEvents.length > 0 && (
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
                  const { _id, title, email, dateTime, status } = event;

                  return (
                    <tr
                      key={_id}
                      className={
                        status === "notify"
                          ? "bg-yellow-50"
                          : status === "delete"
                          ? "bg-red-50"
                          : status === "notified"
                          ? "bg-gray-50"
                          : ""
                      }
                    >
                      <td className="border p-2">{title}</td>
                      <td className="border p-2">{email}</td>
                      <td className="border p-2">
                        {new Date(dateTime).toLocaleString("en-AU")}
                      </td>
                      <td className="border p-2 capitalize">{status}</td>

                      <td className="border p-2">
                        {status === "notify" && (
                          <button
                            className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => handleNotify(_id)}
                          >
                            Notify
                          </button>
                        )}
                        {status === "delete" && (
                          <button
                            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                            onClick={() => handleDelete(_id)}
                          >
                            Delete
                          </button>
                        )}
                        {status === "notified" && (
                          <span className="text-xs text-gray-600">Waiting</span>
                        )}
                      </td>

                      <td className="border p-2">
                        <button
                          className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                          onClick={() => handleDelete(_id)}
                        >
                          Delete
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

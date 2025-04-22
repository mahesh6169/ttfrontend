"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getManageAdverts,
  updateAdminAdvertFilter,
  deleteAdvertById, 
  sendAdvertReminder,
} from "@/store/slices/adminManageAdvertSlice";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";

const ManageAdvertsPage = () => {
  const dispatch = useDispatch();

  const {
    manageAdverts,
    status,
    error,
    page,
    limit,
    meta,
  } = useSelector((state) => state.adminManageAdvert);

  // 🔁 Fetch on load and when page/limit changes
  useEffect(() => {
    dispatch(getManageAdverts());
  }, [dispatch, page, limit]);

  // 🔄 Handle pagination
  const handlePageChange = (newPage) => {
    dispatch(updateAdminAdvertFilter({ page: newPage }));
  };

  // ❌ Handle delete
  const handleDelete = (advertId) => {
    if (confirm("Are you sure you want to delete this advert?")) {
      dispatch(deleteAdvertById(advertId));
    }
  };

  const handleReminder = async (advertId, type) => {
    await dispatch(sendAdvertReminder({ advertId, type }));
    dispatch(getManageAdverts()); // Refresh list
  };
  
  

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Advert Renewals</h1>

      {status === "loading" && <LoadingSpinner />}
      {error && <p className="text-red-500">Error: {error}</p>}
      {status === "success" && manageAdverts.length === 0 && (
        <p className="text-gray-500">No adverts found.</p>
      )}

      {status === "success" && manageAdverts.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Owner Email</th>
                  <th className="border p-2">Days Left</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Actions</th>
                  <th className="border p-2">Moderation</th>
                </tr>
              </thead>
              <tbody>
  {manageAdverts.map((ad) => {
    const { _id, title, email, daysLeft, renewalStatus } = ad;

    let statusText = "Valid";
    if (renewalStatus === "notify1") statusText = "Due (14d)";
    else if (renewalStatus === "notify2") statusText = "Due (7d)";
    else if (renewalStatus === "pendingNotification2") statusText = "Pending Notif (7d)";
    else if (renewalStatus === "expired") statusText = "Expired";

    const isGreyedOut = renewalStatus === "notify1";

    return (
      <tr
        key={_id}
        className={isGreyedOut ? "bg-gray-100 text-gray-400" : ""}
      >
        <td className="border p-2">{title}</td>
        <td className="border p-2">{email}</td>
        <td className="border p-2">{daysLeft} days</td>
        <td className="border p-2">{statusText}</td>
        <td className="border p-2">
        {renewalStatus === "notify1" && (
  <button
    className="px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600"
    onClick={() => handleReminder(_id, '14')}
  >
    Notify (14d)
  </button>
)}

{renewalStatus === "notify2" && (
  <button
    className="px-2 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600"
    onClick={() => handleReminder(_id, '7')}
  >
    Notify (7d)
  </button>
)}

          {renewalStatus === "pendingNotification2" && (
            <span className="inline-block px-2 py-1 text-xs rounded bg-gray-300 text-gray-700">
              Waiting (7d)
            </span>
          )}
          {renewalStatus === "expired" && (
            <button
              className="ml-2 px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleDelete(_id)}
            >
              Delete
            </button>
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

export default ManageAdvertsPage;

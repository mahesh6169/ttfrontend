"use client";

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getManageAdverts,
  updateAdminAdvertFilter,
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

  // 🔁 Fetch data when page or limit changes
  useEffect(() => {
    dispatch(getManageAdverts());
  }, [dispatch, page, limit]);

  // 🔄 Handle page change
  const handlePageChange = (newPage) => {
    dispatch(updateAdminAdvertFilter({ page: newPage }));
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
                </tr>
              </thead>
              <tbody>
                {manageAdverts.map((ad) => {
                  const { _id, title, email, daysLeft, renewalStatus } = ad;

                  let statusText = "Valid";
                  if (renewalStatus === "notify1") statusText = "Due (14d)";
                  else if (renewalStatus === "notify2") statusText = "Due (7d)";
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
                        {(renewalStatus === "notify1" ||
                          renewalStatus === "notify2") && (
                          <button className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700">
                            Notify
                          </button>
                        )}
                        {renewalStatus === "expired" && (
                          <button className="ml-2 px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

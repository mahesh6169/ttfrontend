'use client';

// Admin purge queue (events-past-events.md D5): events organisers have soft-deleted, awaiting a hard
// delete that frees storage (the doc + images + FreeTickets; PaidTickets + EventInvoices are preserved).
// Minimal admin view reusing the existing admin events page pattern - list + a Purge button per row.
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import { formatInTimeZone } from 'date-fns-tz';

const PurgeQueuePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, totalItems: 0, currentPage: 1, itemsPerPage: 20 });
  const [purging, setPurging] = useState({});

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchQueue = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${BASE_URL}/admin/events/purge-queue?page=${pageNum}&limit=20`,
        { withCredentials: true }
      );
      if (data.success) {
        setEvents(data.events || []);
        setMeta(data.meta || { totalPages: 1, totalItems: 0, currentPage: pageNum, itemsPerPage: 20 });
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching purge queue:', error);
      toast.error(error.response?.status === 401 ? 'Session expired. Please login again.' : 'Failed to load the purge queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(1); }, []);

  const handlePurge = async (eventId) => {
    if (!confirm('Permanently delete this event and free its storage? PaidTickets and invoices are kept; this cannot be undone.')) {
      return;
    }
    setPurging((prev) => ({ ...prev, [eventId]: true }));
    try {
      const { data } = await axios.delete(`${BASE_URL}/admin/events/byid/${eventId}`, { withCredentials: true });
      if (data.success) {
        toast.success('Event purged');
        if (events.length === 1 && page > 1) fetchQueue(page - 1);
        else fetchQueue(page);
      }
    } catch (error) {
      console.error('Error purging event:', error);
      toast.error(error.response?.data?.message || 'Failed to purge event');
    } finally {
      setPurging((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-1">Purge queue</h1>
      <p className="mb-4 text-sm text-slate-500">
        Events organisers have deleted. Purging frees storage (the event, its images and RSVPs); paid
        tickets and invoices are always preserved.
      </p>

      {loading && <LoadingSpinner />}

      {!loading && events.length === 0 && (
        <p className="text-slate-500">Nothing to purge.</p>
      )}

      {!loading && events.length > 0 && (
        <>
          <div className="mb-4 text-sm text-slate-600">
            Showing {events.length} of {meta.totalItems} deleted events
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border p-2 text-left">Title</th>
                  <th className="border p-2 text-left">Owner</th>
                  <th className="border p-2 text-left">Event date</th>
                  <th className="border p-2 text-left">Deleted</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const { _id, title, email, dateTime, deletedAt, isPaid } = event;
                  return (
                    <tr key={_id} className="bg-white">
                      <td className="border p-2">
                        {title} <span className="text-[10px] text-slate-400">({isPaid ? 'paid' : 'free'})</span>
                      </td>
                      <td className="border p-2">{email}</td>
                      <td className="border p-2">
                        {dateTime ? formatInTimeZone(dateTime, 'Australia/Sydney', 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="border p-2">
                        {deletedAt ? formatInTimeZone(deletedAt, 'Australia/Sydney', 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="border p-2 text-center">
                        <button
                          disabled={!!purging[_id]}
                          onClick={() => handlePurge(_id)}
                          className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {purging[_id] ? 'Purging...' : 'Purge'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={meta?.totalPages || 1} onPageChange={fetchQueue} />
        </>
      )}
    </div>
  );
};

export default PurgeQueuePage;

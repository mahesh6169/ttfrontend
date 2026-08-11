'use client';

// Admin "Past events" curation (events-past-events.md): the public Past strip on /events is admin-picked.
// This lists past-dated events; the admin toggles "Show in Past" per event. Minimal admin view, same
// pattern as the purge queue.
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import { formatInTimeZone } from 'date-fns-tz';

const PastCurationPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalPages: 1, totalItems: 0, currentPage: 1, itemsPerPage: 20 });
  const [saving, setSaving] = useState({});

  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const fetchList = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${BASE_URL}/admin/events/past-curation?page=${pageNum}&limit=20`,
        { withCredentials: true }
      );
      if (data.success) {
        setEvents(data.events || []);
        setMeta(data.meta || { totalPages: 1, totalItems: 0, currentPage: pageNum, itemsPerPage: 20 });
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching past-events curation list:', error);
      toast.error(error.response?.status === 401 ? 'Session expired. Please login again.' : 'Failed to load past events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(1); }, []);

  const toggleFeatured = async (eventId, next) => {
    setSaving((prev) => ({ ...prev, [eventId]: true }));
    try {
      const { data } = await axios.patch(
        `${BASE_URL}/admin/events/${eventId}/past-featured`,
        { featured: next },
        { withCredentials: true }
      );
      if (data.success) {
        setEvents((prev) => prev.map((e) => (e._id === eventId ? { ...e, featuredInPast: data.featuredInPast } : e)));
        toast.success(next ? 'Now showing in Past events' : 'Hidden from Past events');
      }
    } catch (error) {
      console.error('Error updating featured state:', error);
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setSaving((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-1">Past events curation</h1>
      <p className="mb-4 text-sm text-slate-500">
        Pick which past events appear in the public &quot;Past events&quot; strip on /events. Only the ones you
        show here are visible to visitors.
      </p>

      {loading && <LoadingSpinner />}

      {!loading && events.length === 0 && (
        <p className="text-slate-500">No past events yet.</p>
      )}

      {!loading && events.length > 0 && (
        <>
          <div className="mb-4 text-sm text-slate-600">
            Showing {events.length} of {meta.totalItems} past events
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border p-2 text-left">Title</th>
                  <th className="border p-2 text-left">Owner</th>
                  <th className="border p-2 text-left">Event date</th>
                  <th className="border p-2">In Past strip</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const { _id, title, email, dateTime, featuredInPast, deletedByOrganiser } = event;
                  return (
                    <tr key={_id} className={featuredInPast ? 'bg-teal-50' : 'bg-white'}>
                      <td className="border p-2">
                        {title}
                        {deletedByOrganiser && <span className="ml-1 text-[10px] text-amber-600">(organiser-deleted)</span>}
                      </td>
                      <td className="border p-2">{email}</td>
                      <td className="border p-2">
                        {dateTime ? formatInTimeZone(dateTime, 'Australia/Sydney', 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="border p-2 text-center">
                        {featuredInPast ? <span className="text-teal-700 font-medium">Showing</span> : <span className="text-slate-400">Hidden</span>}
                      </td>
                      <td className="border p-2 text-center">
                        <button
                          disabled={!!saving[_id]}
                          onClick={() => toggleFeatured(_id, !featuredInPast)}
                          className={`px-3 py-1 text-xs rounded text-white transition disabled:opacity-50 ${
                            featuredInPast ? 'bg-slate-500 hover:bg-slate-600' : 'bg-teal-700 hover:bg-teal-800'
                          }`}
                        >
                          {saving[_id] ? 'Saving...' : featuredInPast ? 'Hide' : 'Show in Past'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={page} totalPages={meta?.totalPages || 1} onPageChange={fetchList} />
        </>
      )}
    </div>
  );
};

export default PastCurationPage;

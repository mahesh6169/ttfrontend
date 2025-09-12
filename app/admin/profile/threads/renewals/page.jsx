'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import ValidateAdmin from '@/components/admin/ValidateAdmin';
import axios from '@/utils/axiosConfig';

const AdminThreadRenewals = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchThreads = async (pageNum = 1) => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${BASE_URL}/admin/threads/manage?page=${pageNum}&limit=20`,
        { withCredentials: true }
      );
      
      setThreads(data.threads || []);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast.error('Failed to load threads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleDelete = async (threadId) => {
    if (!confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      return;
    }

    setDeletingId(threadId);
    try {
      await axios.delete(`${BASE_URL}/admin/threads/byid/${threadId}`, {
        withCredentials: true
      });
      
      toast.success('Thread deleted successfully');
      // Refresh the list
      fetchThreads(page);
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error('Failed to delete thread');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <ValidateAdmin>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Thread Moderation</h1>
        
        {loading ? (
          <div className="text-center py-8">Loading threads...</div>
        ) : threads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No threads found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Author</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {threads.map((thread) => (
                    <tr key={thread._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate font-medium">
                          {thread.title}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium">{thread.authorName}</div>
                          <div className="text-gray-500">{thread.authorEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatDate(thread.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(thread._id)}
                          disabled={deletingId === thread._id}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === thread._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => fetchThreads(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => fetchThreads(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ValidateAdmin>
  );
};

export default AdminThreadRenewals;
'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';

const ThreadModerationPage = () => {
  // State management - non-Redux implementation
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ 
    totalPages: 1, 
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 20
  });
  const [deletingThreads, setDeletingThreads] = useState({});
  
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  // Fetch threads
  const fetchThreads = async (pageNum = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${BASE_URL}/admin/threads/manage?page=${pageNum}&limit=20`,
        { withCredentials: true }
      );
      
      if (data.success) {
        setThreads(data.threads || []);
        setMeta({ 
          totalPages: data.totalPages || 1, 
          totalItems: data.totalThreads || 0,
          currentPage: data.currentPage || pageNum,
          itemsPerPage: 20
        });
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Failed to load threads');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchThreads(1);
  }, []);

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchThreads(newPage);
  };

  // Delete thread
  const handleDelete = async (threadId) => {
    if (!confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      return;
    }

    setDeletingThreads(prev => ({ ...prev, [threadId]: true }));
    
    try {
      const { data } = await axios.delete(
        `${BASE_URL}/admin/threads/byid/${threadId}`,
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success('Thread deleted successfully');
        
        // If we deleted the last item on a page, go to previous page
        if (threads.length === 1 && page > 1) {
          fetchThreads(page - 1);
        } else {
          fetchThreads(page);
        }
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast.error(error.response?.data?.message || 'Failed to delete thread');
    } finally {
      setDeletingThreads(prev => ({ ...prev, [threadId]: false }));
    }
  };

  // Render
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Thread Moderation</h1>
      <p className="text-sm text-gray-600 mb-4">
        Manage threads reported for abuse or inappropriate content
      </p>

      {loading && <LoadingSpinner />}
      
      {!loading && threads.length === 0 && (
        <p className="text-gray-500">No threads found.</p>
      )}

      {!loading && threads.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {threads.length} of {meta.totalItems} threads
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border p-2 text-left">Thread Title</th>
                  <th className="border p-2 text-left">Posted By</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2">Created Date</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => {
                  const { _id, title, authorName, authorEmail, createdAt } = thread;

                  return (
                    <tr key={_id} className="hover:bg-gray-50">
                      <td className="border p-2">
                        <div className="max-w-xs truncate" title={title}>
                          {title}
                        </div>
                      </td>
                      <td className="border p-2">{authorName}</td>
                      <td className="border p-2">
                        <a 
                          href={`mailto:${authorEmail}`} 
                          className="text-blue-600 hover:underline"
                        >
                          {authorEmail}
                        </a>
                      </td>
                      <td className="border p-2 text-center">
                        {new Date(createdAt).toLocaleDateString('en-AU')}
                      </td>
                      <td className="border p-2 text-center">
                        <button
                          onClick={() => handleDelete(_id)}
                          disabled={deletingThreads[_id]}
                          className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingThreads[_id] ? 'Deleting...' : 'Delete'}
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
            totalPages={meta.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ThreadModerationPage;
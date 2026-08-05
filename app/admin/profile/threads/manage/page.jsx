'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserThreads,
  deleteThread,
} from '@/store/slices/threads/threadSlice';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { buildSlugUrl } from '@/utils/slugUtils';

const ManageThreads = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { threads, status, error } = useSelector((state) => state.threads);
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    if (user && user._id) {
      dispatch(fetchUserThreads());
    }
  }, [dispatch, user]);

  const handleDelete = async (threadId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this thread?'
    );
    if (!confirmDelete) return;

    const result = await dispatch(deleteThread(threadId));

    if (deleteThread.fulfilled.match(result)) {
      toast.success('Thread deleted successfully!');
      dispatch(fetchUserThreads());
    } else {
      toast.error(result.payload || 'Failed to delete thread.');
    }
  };

  const handleEditClick = (threadId) => {
    router.push(`/threads/edit/${threadId}`);
  };

  return (
    <div>
      <h1 className="text-lg md:text-2xl font-bold mb-2 text-center">
        Manage Your Threads
      </h1>
      <Link
        href="/admin/profile/threads/add"
        onClick={() =>
          localStorage.setItem(
            'cancelRedirectUrl',
            '/admin/profile/threads/manage'
          )
        }
        className="block my-2 p-2 bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-slate-900 font-semibold lg:w-1/4 text-center rounded"
      >
        + Post New Thread
      </Link>

      {status === 'loading' && (
        <p className="text-blue-500">Loading threads...</p>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {threads.length === 0 && !error && status !== 'loading' && (
        <p>No threads found. Start a new discussion!</p>
      )}

      {threads.length > 0 && (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li
              key={thread._id}
              className="border rounded-lg p-4 flex justify-between items-center hover:bg-slate-100 transition-all duration-200"
            >
              <div
                onClick={() => router.push(buildSlugUrl('thread', thread.title, thread._id))}
                className="cursor-pointer flex-1"
              >
                <h2 className="text-lg font-semibold text-blue-600 hover:underline">
                  {thread.title}
                </h2>
                <p className="text-sm text-slate-700 italic">
                  {thread.question}
                </p>
                <p className="text-sm text-slate-500">
                  Started by {thread.owner?.name || 'Unknown'}
                </p>
                <p className="text-xs text-slate-400">
                  Created on: {new Date(thread.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  className="text-blue-500 hover:text-blue-700"
                  title="Edit Thread"
                  onClick={() => handleEditClick(thread._id)}
                >
                  <FaEdit size={18} />
                </button>
                <button
                  className="text-red-500 hover:text-red-700"
                  title="Delete Thread"
                  onClick={() => handleDelete(thread._id)}
                >
                  <FaTrash size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageThreads;

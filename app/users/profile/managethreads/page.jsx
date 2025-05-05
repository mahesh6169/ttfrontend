'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserThreads,
  deleteThread,
} from '@/store/slices/threads/threadSlice';
import {
  muteThreadNotification,
  unmuteThreadNotification,
} from '@/store/slices/users/userSlice';
import { useRouter } from 'next/navigation';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { MdNotificationsActive, MdNotificationsOff } from 'react-icons/md';
import { toast } from 'react-toastify';
import Link from 'next/link';

const ManageThreads = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { threads, status, error } = useSelector((state) => state.threads);
  const mutedThreads = useSelector((state) => state.user.mutedThreads || []);

  useEffect(() => {
    dispatch(fetchUserThreads());
  }, [dispatch]);

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
    <div className='m-2'>
      <h1 className="text-lg md:text-2xl font-bold mb-4 text-center text-teal-700">
        Manage Your Threads
      </h1>

      <Link
        href="/threads/new"
        onClick={() =>
          localStorage.setItem('cancelRedirectUrl', '/users/profile/managethreads')
        }
        className="block my-2 p-2 bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100 font-semibold lg:w-1/4 text-center rounded"
      >
        + Post New Thread
      </Link>

      {status === 'loading' && <p className="text-blue-500">Loading threads...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {threads.length === 0 && !error && status !== 'loading' && (
        <p>No threads found. Start a new discussion!</p>
      )}

      <ul className="space-y-4">
        {threads.map((thread) => {
          const isMuted = mutedThreads.includes(thread._id);

          const toggleMute = () => {
            isMuted
              ? dispatch(unmuteThreadNotification(thread._id))
              : dispatch(muteThreadNotification(thread._id));
          };

          return (
            <li
              key={thread._id}
              className="border rounded-lg p-4 shadow-md hover:bg-gray-50 transition-all duration-200"
            >
              {/* Thread Info */}
              <div
                onClick={() => router.push(`/threads/views/${thread._id}`)}
                className="cursor-pointer"
              >
                <h2 className="text-lg font-semibold ">
                  {thread.title}
                </h2>
                <p className="text-sm text-gray-700 italic line-clamp-2">
                  {thread.question}
                </p>
                <p className="text-sm text-gray-500">
                  Started by {thread.owner?.name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-400">
                  Created on: {new Date(thread.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Mute Icon Row */}
              <div className="flex justify-end mt-3">
  <button
    onClick={toggleMute}
    className="flex items-center gap-2 text-sm text-gray-700 hover:text-teal-700"
    title={isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
  >
    {isMuted ? (
      <>
        <MdNotificationsOff size={20} className="text-red-500" />
        Unmute Email Notifications
      </>
    ) : (
      <>
        <MdNotificationsActive size={20} className="text-green-600" />
        Mute Email Notifications
      </>
    )}
  </button>
</div>


              {/* Action Buttons */}
              <div className="flex justify-end  gap-4 mt-4 ">
                <button
                  onClick={() => handleEditClick(thread._id)}
                  className="px-4 py-2 bg-teal-600 text-lime-100 hover:bg-teal-700 hover:text-lime-100 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(thread._id)}
                  className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ManageThreads;

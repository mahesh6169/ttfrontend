'use client';

import React, { useEffect, useState } from 'react';
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
import { toast } from 'react-toastify';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import { MdNotifications, MdNotificationsOff } from 'react-icons/md';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';

const ManageThreads = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { threads, status, error } = useSelector((state) => state.threads);
  const mutedThreads = useSelector((state) => state.user.mutedThreads || []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('idle');

  useEffect(() => {
    dispatch(fetchUserThreads());
  }, [dispatch]);

  const handleDeleteClick = (thread) => {
    setThreadToDelete(thread);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    if (deleteStatus === 'loading') return;
    setIsModalOpen(false);
    setThreadToDelete(null);
    setDeleteStatus('idle');
  };

  const handleDelete = async () => {
    if (deleteStatus === 'loading' || !threadToDelete) return;

    setDeleteStatus('loading');

    try {
      const result = await dispatch(deleteThread(threadToDelete._id));

      if (deleteThread.fulfilled.match(result)) {
        toast.success('Thread deleted successfully!');
        setIsModalOpen(false);
        setThreadToDelete(null);
        dispatch(fetchUserThreads());
      } else {
        toast.error(result.payload || 'Failed to delete thread.');
      }
    } catch (error) {
      toast.error('Failed to delete thread.');
    } finally {
      setDeleteStatus('idle');
    }
  };

  const handleEditClick = (threadId) => {
    localStorage.setItem('cancelRedirectUrl', '/users/profile/managethreads');
    router.push(`/threads/edit/${threadId}`);
  };

  const toggleMute = (threadId, isMuted) => {
    if (isMuted) {
      dispatch(unmuteThreadNotification(threadId));
    } else {
      dispatch(muteThreadNotification(threadId));
    }
  };

  const PageHeader = () => (
    <>
      <ProfilePageHeading title="Manage Topics" description="Create, edit and manage your discussion topics" />
      <div className="flex justify-center mb-6">
        <Link
          href="/threads/new"
          onClick={() =>
            localStorage.setItem('cancelRedirectUrl', '/users/profile/managethreads')
          }
          className="inline-flex items-center justify-center gap-1 px-4 py-2.5 bg-teal-700 text-white hover:bg-teal-800 font-semibold text-sm rounded-lg shadow-sm transition-colors"
        >
          + Post New Topic
        </Link>
      </div>
    </>
  );

  const showSkeleton = useDelayedLoading(status === 'loading');

  if (status === 'loading' || showSkeleton) {
    return (
      <div>
        <PageHeader />
        {showSkeleton && <PageSkeleton variant="card" rows={6} />}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader />
        <ErrorState onRetry={() => dispatch(fetchUserThreads())} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader />

      {threads.length === 0 ? (
        <EmptyState
          title="No topics yet"
          description="You haven't posted any topics yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {threads.map((thread) => {
            const isMuted = mutedThreads.includes(thread._id);

            return (
              <div
                key={thread._id}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 p-3"
              >
                {/* Title */}
                <h3
                  className="text-sm font-semibold text-slate-900 line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-teal-700"
                  onClick={() => router.push(`/threads/views/${thread._id}`)}
                >
                  {thread.title}
                </h3>

                {/* Mute notifications toggle */}
                <button
                  type="button"
                  onClick={() => toggleMute(thread._id, isMuted)}
                  className={`flex items-center gap-1 text-xs mt-1 ${
                    isMuted
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {isMuted ? (
                    <MdNotificationsOff className="text-sm" />
                  ) : (
                    <MdNotifications className="text-sm" />
                  )}
                  <span>{isMuted ? 'Notifications muted' : 'Mute notifications'}</span>
                </button>

                {/* Question preview */}
                <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">
                  {thread.question}
                </p>

                {/* Date */}
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {new Date(thread.createdAt).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>

                {/* Actions */}
                <div className="flex items-center justify-between sm:justify-center sm:gap-6 mt-3 text-sm">
                  <button
                    type="button"
                    onClick={() => handleEditClick(thread._id)}
                    className="text-teal-700 hover:text-teal-900 active:underline font-semibold py-1"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(thread)}
                    className="text-red-600 hover:text-red-700 active:underline font-semibold py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onConfirm={handleDelete}
        onCancel={handleModalCancel}
        title="Delete Topic"
        message={
          deleteStatus === 'loading'
            ? "Deleting topic..."
            : "Are you sure you want to delete this topic? All messages will also be removed."
        }
        confirmText={deleteStatus === 'loading' ? "Deleting..." : "Delete"}
        isLoading={deleteStatus === 'loading'}
      />
    </div>
  );
};

export default ManageThreads;

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
import { FaPen, FaTrash, FaRegImage } from 'react-icons/fa';
import { stripHtmlToText, parsePictures, sizedPictureUrl } from '@/utils/helpers/threads/richText';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';
import { buildSlugUrl } from '@/utils/slugUtils';

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
        // Feature 1012: cards show the first picture of the post, the category, a plain-text preview
        // (no HTML), the chat switch, and icon actions. Newest first.
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...threads]
            .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))
            .map((thread) => {
            const isMuted = mutedThreads.includes(thread._id);
            const firstPicture = parsePictures(thread.question)[0]?.src;
            const preview = stripHtmlToText(thread.question);
            const viewUrl = buildSlugUrl('thread', thread.title, thread._id);

            return (
              <div
                key={thread._id}
                data-testid="manage-thread-card"
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* First picture of the post */}
                <Link href={viewUrl} className="block h-32 bg-slate-100 sm:h-36">
                  {firstPicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sizedPictureUrl(firstPicture, 600)} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-slate-300">
                      <FaRegImage size={28} aria-hidden="true" />
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-3">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    {thread.category && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{thread.category}</span>
                    )}
                    {thread.allowChat === false && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Chat off</span>
                    )}
                  </div>

                  <Link href={viewUrl} className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-teal-700">
                    {thread.title}
                  </Link>
                  {preview && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{preview}</p>}

                  <p className="mt-2 text-[11px] text-slate-500">
                    {new Date(thread.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>

                  {/* Notifications for this topic, on its own row */}
                  <button
                    type="button"
                    onClick={() => toggleMute(thread._id, isMuted)}
                    className={`mt-auto flex items-center gap-1.5 pt-3 text-xs font-medium ${
                      isMuted ? 'text-red-600 hover:text-red-700' : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    {isMuted ? <MdNotificationsOff size={16} aria-hidden="true" /> : <MdNotifications size={16} aria-hidden="true" />}
                    <span>{isMuted ? 'Notifications muted - turn on' : 'Mute notifications'}</span>
                  </button>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 border-t border-slate-100 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => handleEditClick(thread._id)}
                    className="flex items-center justify-center gap-1.5 border-r border-slate-100 py-2.5 text-teal-700 hover:bg-teal-50"
                  >
                    <FaPen size={12} aria-hidden="true" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(thread)}
                    className="flex items-center justify-center gap-1.5 py-2.5 text-red-600 hover:bg-red-50"
                  >
                    <FaTrash size={12} aria-hidden="true" /> Delete
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

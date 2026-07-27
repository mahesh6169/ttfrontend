'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { toast } from 'react-toastify';
import { formatInTimeZone } from 'date-fns-tz';
import axios from '@/utils/axiosConfig';
import ConfirmModal from '@/components/ConfirmModal';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';

// Organiser's waitlist page: the event's entries in arrival order plus the manual Send
// Notification action. Reached from the "N on the waitlist" link on the Manage Events card.
// See featureplans/events-waitlist.md.
const EventWaitlistPage = () => {
  const { eventId } = useParams();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [data, setData] = useState(null); // { event, entries, unnotifiedCount }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/events/${eventId}/waitlist/entries`, {
        withCredentials: true,
      });
      setData(res.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/events/${eventId}/waitlist/notify`,
        {},
        { withCredentials: true }
      );
      toast.success(res.data?.message || 'Notification sent.');
      setConfirmOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send the notification.');
    } finally {
      setSending(false);
    }
  };

  const fmt = (date) =>
    date
      ? formatInTimeZone(new Date(date), data?.event?.timeZone || 'Australia/Sydney', 'dd MMM yyyy, h:mm a')
      : null;

  const showSkeleton = useDelayedLoading(loading);

  if (loading || showSkeleton) {
    return (
      <div>
        <div className="mb-3 sm:mb-6">
          <BackButton href="/users/profile/manageevents" />
        </div>
        <ProfilePageHeading title="Waitlist" />
        {showSkeleton && <PageSkeleton variant="card" rows={6} />}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="mb-3 sm:mb-6">
          <BackButton href="/users/profile/manageevents" />
        </div>
        <ProfilePageHeading title="Waitlist" />
        <ErrorState onRetry={load} />
      </div>
    );
  }

  const { event, entries, unnotifiedCount } = data;

  return (
    <div>
      <div className="mb-3 sm:mb-6">
        <BackButton href="/users/profile/manageevents" />
      </div>
      <ProfilePageHeading title="Waitlist" description={event.title} />

      {entries.length === 0 ? (
        <EmptyState
          title="No one on the waitlist yet"
          description="When your event is full and the waitlist is on, people who join appear here."
        />
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Send action */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <p className="text-sm text-slate-600">
              {entries.length} on the waitlist - {unnotifiedCount} not yet notified
            </p>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={unnotifiedCount === 0}
              className="inline-flex items-center justify-center gap-2 bg-teal-700 text-white hover:bg-teal-800 px-4 py-2 rounded-full shadow-sm font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Notification ({unnotifiedCount})
            </button>
          </div>

          {/* Entries in arrival order (oldest first) */}
          <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {entries.map((entry) => (
              <div key={entry._id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {entry.name || 'Guest (email only)'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{entry.email}</p>
                  {entry.mobile && (
                    <p className="text-xs text-slate-500 truncate">{entry.mobile}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {entry.notifiedAt ? (
                    <>
                      <p className="text-xs font-semibold text-teal-700">Notified</p>
                      <p className="text-[11px] text-slate-400">{fmt(entry.notifiedAt)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Not notified</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onConfirm={handleSend}
        onCancel={() => setConfirmOpen(false)}
        isLoading={sending}
        title="Send notification?"
        message={`Email ${unnotifiedCount} ${unnotifiedCount === 1 ? 'person' : 'people'} that tickets are available. This cannot be unsent.`}
        confirmText={sending ? 'Sending...' : 'Send'}
        cancelText="Cancel"
      />
    </div>
  );
};

export default EventWaitlistPage;

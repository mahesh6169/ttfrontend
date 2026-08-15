// app/users/profile/checkinrsvp/page.jsx
//
// RSVP check-in LIST page (events-rsvp-checkin-redesign.md Stage A).
// A centred vertical scroll of the organiser's free events in two sections - Active
// (dated today or later) then Past (past-dated, most-recent-first with a Load more).
// Each card opens the per-event check-in screen or exports its attendee PDF. Reuses the
// existing fetchManagedFreeEvents thunk; no backend change.

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import CheckinRsvp_EventCard from '@/components/events/checkin/checkinrsvp_EventCard';
import { fetchManagedFreeEvents } from '@/store/slices/events/checkinRsvpSlice';

const PAST_PAGE_SIZE = 6;

export default function CheckinRsvpListPage() {
  const dispatch = useDispatch();
  const { managedEvents, managedLoading: loading } = useSelector((state) => state.checkinRsvp);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [pastShown, setPastShown] = useState(PAST_PAGE_SIZE);

  useEffect(() => {
    dispatch(fetchManagedFreeEvents()).finally(() => setHasAttemptedLoad(true));
  }, [dispatch]);

  // Split by event date: today-or-later = Active; past date = Past (D4).
  const { active, past } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const activeList = [];
    const pastList = [];
    for (const ev of managedEvents || []) {
      const when = ev.dateTime ? new Date(ev.dateTime) : null;
      if (when && when < startOfToday) pastList.push(ev);
      else activeList.push(ev);
    }
    // Active soonest-first (the endpoint already sorts ascending); Past most-recent-first.
    activeList.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    pastList.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    return { active: activeList, past: pastList };
  }, [managedEvents]);

  // Empty state only AFTER a fetch has resolved (never flash it on first paint).
  if (hasAttemptedLoad && !loading && (!managedEvents || managedEvents.length === 0)) {
    return (
      <div>
        <ProfilePageHeading title="RSVP Check-In" />
        <EmptyState
          title="No RSVP events yet"
          description="You haven't created any RSVP events yet."
          actionLabel="Create an Event"
          actionHref="/events/add"
        />
      </div>
    );
  }

  return (
    <div>
      <ProfilePageHeading title="RSVP Check-In" />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Active */}
        {active.length > 0 && (
          <section className="space-y-3" data-testid="checkinrsvp-active">
            <h2 className="text-base font-semibold text-slate-900">Active</h2>
            {active.map((ev) => (
              <CheckinRsvp_EventCard key={ev._id} event={ev} />
            ))}
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section className="space-y-3" data-testid="checkinrsvp-past">
            <h2 className="text-base font-semibold text-slate-900">Past</h2>
            {past.slice(0, pastShown).map((ev) => (
              <CheckinRsvp_EventCard key={ev._id} event={ev} />
            ))}
            {past.length > pastShown && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setPastShown((n) => n + PAST_PAGE_SIZE)}
                  className="inline-flex items-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                >
                  Load more
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

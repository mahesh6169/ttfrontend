// app/users/profile/checkin-paid/page.jsx
//
// PAID check-in LIST page (events-paid-checkin-redesign.md Stage B).
// A centred vertical scroll of the organiser's paid events in two sections - Active (dated today
// or later) then Past (past-dated, most-recent-first with a Load more). Tapping a card opens the
// per-event view. Reuses the existing fetchManagedPaidEvents thunk (D2); no backend change.

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import CheckinPaid_EventCard from '@/components/events/checkin/checkinpaid_EventCard';
import { fetchManagedPaidEvents } from '@/store/slices/events/checkInPaidSlice';

const PAST_PAGE_SIZE = 6;

export default function CheckinPaidListPage() {
  const dispatch = useDispatch();
  const { managedEvents, loading } = useSelector((state) => state.checkInPaid);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [pastShown, setPastShown] = useState(PAST_PAGE_SIZE);

  useEffect(() => {
    dispatch(fetchManagedPaidEvents()).finally(() => setHasAttemptedLoad(true));
  }, [dispatch]);

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
    activeList.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
    pastList.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    return { active: activeList, past: pastList };
  }, [managedEvents]);

  if (hasAttemptedLoad && !loading && (!managedEvents || managedEvents.length === 0)) {
    return (
      <div>
        <ProfilePageHeading title="Paid Check-In" />
        <EmptyState
          title="No paid events yet"
          description="You haven't created any paid events yet."
          actionLabel="Create an Event"
          actionHref="/events/add"
        />
      </div>
    );
  }

  return (
    <div>
      <ProfilePageHeading title="Paid Check-In" />

      <div className="max-w-2xl mx-auto space-y-6">
        {active.length > 0 && (
          <section className="space-y-3" data-testid="checkinpaid-active">
            <h2 className="text-base font-semibold text-slate-900">Active</h2>
            {active.map((ev) => (
              <CheckinPaid_EventCard key={ev._id} event={ev} />
            ))}
          </section>
        )}

        {past.length > 0 && (
          <section className="space-y-3" data-testid="checkinpaid-past">
            <h2 className="text-base font-semibold text-slate-900">Past</h2>
            {past.slice(0, pastShown).map((ev) => (
              <CheckinPaid_EventCard key={ev._id} event={ev} />
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

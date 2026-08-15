// app/users/profile/checkinrsvp/[eventId]/page.jsx
//
// Per-event RSVP check-in screen (events-rsvp-checkin-redesign.md Stage B, D7-D9).
// Header stack: page toolbar (Back + "Check-in"), event summary card, stats strip (no export),
// then a sticky strip of search + All/Pending/Done tabs; the CheckinTable follows, with a "Load
// more" button so large events load in batches (50 at a time) instead of all at once. Tabs and
// stats are server-driven (see checkinRsvpSlice) so they stay correct no matter how much is loaded.
// The sticky strip stays pinned while the toolbar/summary/stats scroll away (D8).

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { formatInTimeZone } from 'date-fns-tz';
import { FaRegCalendarAlt, FaMapMarkerAlt, FaUsers, FaSearch } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import BackButton from '@/components/BackButton';
import CheckinTable from '@/components/events/checkin/CheckinTable';
import {
  fetchManagedFreeEvents,
  fetchAttendeesPage,
  resetPerEvent,
} from '@/store/slices/events/checkinRsvpSlice';

const PAGE_SIZE = 50; // batch size for "Load more"
const HEADER_OFFSET = 68; // the fixed app header height; the table header pins below the search+tabs strip

// Not checked in first (the door's short worklist) -> Checked in -> All. Keys unchanged
// (the server status filter still maps pending/done).
const TABS = [
  { key: 'pending', label: 'Not checked in' },
  { key: 'done', label: 'Checked in' },
  { key: 'all', label: 'All' },
];

const formatDateTime = (dateTime, timeZone = 'Australia/Sydney') => {
  if (!dateTime) return '';
  try {
    return `${formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy')} at ${formatInTimeZone(dateTime, timeZone, 'h:mm a')}`;
  } catch {
    return new Date(dateTime).toLocaleString();
  }
};

export default function CheckinRsvpEventPage() {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const { managedEvents, rows, pagination, stats, listLoading, loadingMore } = useSelector((state) => state.checkinRsvp);

  const [activeTab, setActiveTab] = useState('pending'); // default to the "Not checked in" worklist
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce the search box (server search).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Measure the pinned search + tabs strip so the desktop table header pins directly beneath it.
  const stripRef = useRef(null);
  const [tableHeaderTop, setTableHeaderTop] = useState(HEADER_OFFSET + 96);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return undefined;
    const update = () => setTableHeaderTop(HEADER_OFFSET + el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const event = useMemo(
    () => (managedEvents || []).find((e) => e._id === eventId),
    [managedEvents, eventId]
  );

  // Event summary (managed list); clear any previous event's rows on switch.
  useEffect(() => {
    dispatch(fetchManagedFreeEvents());
    dispatch(resetPerEvent());
  }, [dispatch, eventId]);

  // First page whenever the event, tab, or (debounced) search changes - server-side filter.
  useEffect(() => {
    dispatch(fetchAttendeesPage({ eventId, page: 1, limit: PAGE_SIZE, search: debouncedSearch, status: activeTab }));
  }, [dispatch, eventId, activeTab, debouncedSearch]);

  const loadMore = () => {
    dispatch(fetchAttendeesPage({ eventId, page: pagination.currentPage + 1, limit: PAGE_SIZE, search: debouncedSearch, status: activeTab }));
  };

  // After a cancel, refetch the first page (the cancelled booking drops out and stats refresh).
  const refresh = () => {
    dispatch(fetchAttendeesPage({ eventId, page: 1, limit: PAGE_SIZE, search: debouncedSearch, status: activeTab }));
  };

  // Live-filter the loaded rows by the active tab (in addition to the server filter), so a booking
  // drops off the "Not checked in" list the moment it becomes fully checked in - matching paid.
  const displayed = useMemo(() => {
    if (activeTab === 'all') return rows;
    return rows.filter((reg) => {
      const total = reg.attendees?.length || 0;
      const checked = (reg.attendees || []).filter((a) => a.checkedIn).length;
      const allIn = total > 0 && checked === total;
      return activeTab === 'done' ? allIn : !allIn;
    });
  }, [rows, activeTab]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page toolbar: Back left + "Check-in" centred (D7) */}
      <div className="relative flex items-center mb-4">
        <BackButton href="/users/profile/checkinrsvp" />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-slate-900">Check-in</h1>
      </div>

      {/* Event summary card */}
      <div data-testid="checkinrsvp-summary" className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-base font-semibold text-slate-900">{event?.title || ' '}</h2>
          {event?.eventCode && (
            <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
              {event.eventCode}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {event?.dateTime && (
            <span className="flex items-center gap-1.5">
              <FaRegCalendarAlt className="w-3.5 h-3.5 text-slate-400" />
              {formatDateTime(event.dateTime, event.timeZone)}
            </span>
          )}
          {event?.venue && (
            <span className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="w-3.5 h-3.5 text-slate-400" />
              {event.venue}
            </span>
          )}
          {event?.capacity > 0 && (
            <span className="flex items-center gap-1.5">
              <FaUsers className="w-3.5 h-3.5 text-slate-400" />
              Capacity: {event.capacity}
            </span>
          )}
        </div>
      </div>

      {/* Stats strip - no export button here (D7). Event-wide, from the server. */}
      <div data-testid="checkinrsvp-stats" className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-3">
        <div className="flex items-center justify-around sm:justify-start sm:gap-8">
          <Stat label="Registrations" value={stats.totalRegistrations} />
          <Stat label="Attendees" value={stats.totalAttendees} />
          <Stat label="Checked In" value={stats.checkedInAttendees} />
        </div>
      </div>

      {/* Sticky strip: search + tabs (D8) */}
      <div ref={stripRef} data-testid="checkinrsvp-sticky" className="sticky top-[68px] z-20 bg-white pt-1 pb-2">
        {/* Search */}
        <div data-testid="checkinrsvp-search" className="relative mb-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <FaSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reg No, Name, Email"
            className="block w-full pl-10 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-300 focus:border-teal-400 outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <MdClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Segmented tabs (filters.md #3) - server-side filter */}
        <div data-testid="checkinrsvp-tabs" className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              aria-pressed={activeTab === t.key}
              className={`py-1.5 rounded-md text-sm font-semibold transition-colors ${
                activeTab === t.key ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Registration list */}
      {listLoading && rows.length === 0 ? (
        <div className="border border-slate-200 rounded-lg bg-white py-10 text-center text-sm text-slate-500">
          Loading registrations...
        </div>
      ) : (
        <>
          <CheckinTable registrations={displayed} eventId={eventId} onRefresh={refresh} stickyTop={tableHeaderTop} />

          {/* Load more - loads the next batch and appends; nobody is ever hidden. */}
          {pagination.hasNextPage && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                data-testid="checkinrsvp-loadmore"
                className="inline-flex items-center bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
              <span className="text-xs text-slate-500">Showing {rows.length} of {pagination.totalCount}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center sm:text-left">
      <span className="block text-lg font-bold text-teal-700 leading-none">{value ?? 0}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

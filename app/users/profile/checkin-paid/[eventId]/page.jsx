// app/users/profile/checkin-paid/[eventId]/page.jsx
//
// Per-event PAID check-in view (events-paid-checkin-redesign.md Stages C/D, D5-D9).
// Header stack: page toolbar (Back + "Check-in"), event summary card, stats strip (Total Tickets /
// Checked In / Cancelled - no revenue, no export), a placed "Scan QR" button, then a sticky strip of
// search + All/Pending/Done tabs; the CheckinPaidTable (invoice rows) follows. Reuses the existing
// paid thunks + the QR scanner (D2/D14); the event's tickets are loaded once and grouped into invoice
// rows in the browser, so no invoice is ever split (D8). No backend change.

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { formatInTimeZone } from 'date-fns-tz';
import { FaRegCalendarAlt, FaMapMarkerAlt, FaUsers, FaSearch, FaQrcode } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import BackButton from '@/components/BackButton';
import CheckinPaidTable from '@/components/events/checkin/CheckinPaidTable';
import CheckInPaid_QRScanner from '@/components/events/checkin/CheckInPaid_QRScanner';
import {
  fetchManagedPaidEvents,
  fetchPaidEventAttendees,
  setSelectedEvent,
  clearCheckInData,
} from '@/store/slices/events/checkInPaidSlice';

const LOAD_ALL = 10000; // load all active tickets in one call, then group into invoices (D8, no paging)
const HEADER_OFFSET = 68;

// Not checked in first (the door's short worklist) -> Checked in -> All. Keys unchanged.
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

export default function CheckinPaidEventPage() {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const { managedEvents, attendees, stats, attendeesLoading } = useSelector((state) => state.checkInPaid);

  const [activeTab, setActiveTab] = useState('pending'); // default to the "Not checked in" worklist
  const [search, setSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [backHref, setBackHref] = useState('/users/profile/checkin-paid'); // default: the check-in list

  // Smart Back: if we arrived from a page that recorded a return URL (e.g. the profile
  // dashboard), send Back there; otherwise keep the default list page.
  useEffect(() => {
    const stored = localStorage.getItem('checkinReturnUrl');
    if (stored) {
      setBackHref(stored);
      localStorage.removeItem('checkinReturnUrl');
    }
  }, []);

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

  // Load the event summary + all active tickets once.
  useEffect(() => {
    dispatch(fetchManagedPaidEvents());
    dispatch(fetchPaidEventAttendees({ eventId, page: 1, limit: LOAD_ALL, search: '' }));
    return () => { dispatch(clearCheckInData()); };
  }, [dispatch, eventId]);

  // Set the selected event so the reused QR scanner (which reads it from the slice) knows the event.
  useEffect(() => {
    if (event) dispatch(setSelectedEvent(event));
  }, [dispatch, event]);

  // Group tickets into invoice rows (D8): one row per invoiceNumber, tickets sorted within.
  const invoices = useMemo(() => {
    const map = new Map();
    for (const t of attendees) {
      if (!map.has(t.invoiceNumber)) map.set(t.invoiceNumber, { invoiceNumber: t.invoiceNumber, buyer: t.buyer, tickets: [] });
      map.get(t.invoiceNumber).tickets.push(t);
    }
    const list = [...map.values()];
    list.forEach((inv) => inv.tickets.sort((a, b) => (a.ticketNumber || '').localeCompare(b.ticketNumber || '')));
    return list;
  }, [attendees]);

  // Client-side search + tab filter over the grouped invoices.
  const filtered = useMemo(() => {
    let list = invoices;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((inv) => {
        const b = inv.buyer || {};
        const buyerName = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
        if ((inv.invoiceNumber || '').toLowerCase().includes(q)) return true;
        if (buyerName.includes(q)) return true;
        if ((b.email || '').toLowerCase().includes(q)) return true;
        return inv.tickets.some((t) => (t.ticketNumber || '').toLowerCase().includes(q));
      });
    }
    if (activeTab !== 'all') {
      list = list.filter((inv) => {
        const active = inv.tickets.filter((t) => t.checkInStatus !== 'cancelled');
        const allIn = active.length > 0 && active.every((t) => t.attendees?.[0]?.checkedIn);
        return activeTab === 'done' ? allIn : !allIn;
      });
    }
    return list;
  }, [invoices, search, activeTab]);

  // Stats (D6): Total Tickets (all sold, incl. cancelled - from the managed-events aggregate),
  // Checked In (event-wide, from the loaded active tickets), Cancelled (sold minus active).
  const activeTicketCount = attendees.length;
  const totalSold = event?.ticketCount ?? activeTicketCount;
  const cancelled = Math.max(0, totalSold - activeTicketCount);
  const checkedIn = stats.checkedInAttendees;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative flex items-center mb-4">
        <BackButton href={backHref} />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-slate-900">Check-in</h1>
      </div>

      {/* Event summary card */}
      <div data-testid="checkinpaid-summary" className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-3">
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
            <span className="flex items-center gap-1.5"><FaRegCalendarAlt className="w-3.5 h-3.5 text-slate-400" />{formatDateTime(event.dateTime, event.timeZone)}</span>
          )}
          {event?.venue && (
            <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="w-3.5 h-3.5 text-slate-400" />{event.venue}</span>
          )}
          {event?.capacity > 0 && (
            <span className="flex items-center gap-1.5"><FaUsers className="w-3.5 h-3.5 text-slate-400" />Capacity: {event.capacity}</span>
          )}
        </div>
      </div>

      {/* Stats strip - Total Tickets / Checked In / Cancelled (no revenue, no export) */}
      <div data-testid="checkinpaid-stats" className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 mb-3">
        <div className="flex items-center justify-around sm:justify-start sm:gap-8">
          <Stat label="Total Tickets" value={totalSold} testid="checkinpaid-stat-total" />
          <Stat label="Checked In" value={checkedIn} testid="checkinpaid-stat-checkedin" />
          <Stat label="Cancelled" value={cancelled} muted testid="checkinpaid-stat-cancelled" />
        </div>
      </div>

      {/* Placed Scan QR button (D14) - fit-to-content primary; not a floating FAB */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          data-testid="checkinpaid-scan"
          className="inline-flex items-center gap-2 bg-teal-700 text-white hover:bg-teal-800 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <FaQrcode className="w-4 h-4" /> Scan QR
        </button>
      </div>

      {/* Sticky strip: search + tabs */}
      <div ref={stripRef} data-testid="checkinpaid-sticky" className="sticky top-[68px] z-20 bg-white pt-1 pb-2">
        <div data-testid="checkinpaid-search" className="relative mb-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FaSearch className="w-4 h-4" /></span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ticket No, Invoice No, Name, Email"
            className="block w-full pl-10 pr-9 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-300 focus:border-teal-400 outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
              <MdClose className="w-4 h-4" />
            </button>
          )}
        </div>

        <div data-testid="checkinpaid-tabs" className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              aria-pressed={activeTab === t.key}
              className={`py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === t.key ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {attendeesLoading && attendees.length === 0 ? (
        <div className="border border-slate-200 rounded-lg bg-white py-10 text-center text-sm text-slate-500">Loading bookings...</div>
      ) : (
        <CheckinPaidTable invoices={filtered} eventId={eventId} stickyTop={tableHeaderTop} />
      )}

      {showScanner && <CheckInPaid_QRScanner onClose={() => setShowScanner(false)} />}
    </div>
  );
}

function Stat({ label, value, muted, testid }) {
  return (
    <div className="text-center sm:text-left">
      <span data-testid={testid} className={`block text-lg font-bold leading-none ${muted ? 'text-slate-500' : 'text-teal-700'}`}>{value ?? 0}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { FaCalendarAlt, FaBoxOpen, FaTags, FaComments, FaChevronRight } from 'react-icons/fa';
import { formatInTimeZone } from 'date-fns-tz';
import axios from '@/utils/axiosConfig';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import ErrorState from '@/components/layout/ErrorState';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Format an event's date + time in its own timezone for the card's right column.
const formatWhen = (dateTime, timeZone = 'Australia/Sydney') => {
  try {
    return {
      date: formatInTimeZone(dateTime, timeZone, 'EEE d MMM'),
      time: formatInTimeZone(dateTime, timeZone, 'h:mm a'),
    };
  } catch {
    const d = new Date(dateTime);
    return { date: d.toLocaleDateString(), time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  }
};

// Build the action buttons for one event from the user's roles + the event type.
// host → Manage (primary) + Check-in · attendee → View RSVP / View Ticket.
const actionsFor = (roles, type) => {
  const isHost = roles.includes('host');
  const isAttendee = roles.includes('attendee');
  const actions = [];
  if (isHost) {
    actions.push({ label: 'Manage', href: '/users/profile/manageevents', primary: true });
    actions.push({
      label: 'Check-in',
      href: type === 'free' ? '/users/profile/checkInFree' : '/users/profile/checkInPaid',
    });
  }
  if (isAttendee) {
    actions.push({
      label: type === 'free' ? 'View RSVP' : 'View Ticket',
      href: type === 'free' ? '/users/profile/myregistrations' : '/users/profile/mytickets',
      primary: !isHost,
    });
  }
  return actions;
};

const roleLabel = (roles) => {
  const isHost = roles.includes('host');
  const isAttendee = roles.includes('attendee');
  if (isHost && isAttendee) return 'Hosting & attending';
  if (isHost) return "You're hosting";
  return "You're attending";
};

const EventCard = ({ event }) => {
  const { date, time } = formatWhen(event.dateTime, event.timeZone);
  const typeLabel = event.type === 'paid' ? 'Paid' : 'RSVP';
  const actions = actionsFor(event.roles || [], event.type);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="text-base font-bold text-teal-700 truncate">{event.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {roleLabel(event.roles || [])} · {typeLabel}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                a.primary
                  ? 'bg-teal-700 text-white hover:bg-teal-800'
                  : 'text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-semibold text-slate-700">{date}</div>
        <div className="text-xs text-slate-500">{time}</div>
      </div>
    </div>
  );
};

// Whole-card link encouraging activity in one vertical (browse or create).
const StarterTile = ({ icon: Icon, title, desc, href }) => (
  <Link
    href={href}
    className="group bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:border-teal-300 hover:shadow transition-all flex items-center gap-3"
  >
    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
      <Icon className="text-base" />
    </div>
    <div className="min-w-0 flex-1">
      <h3 className="text-sm font-bold text-teal-700">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </div>
    <FaChevronRight className="text-slate-300 group-hover:text-teal-600 text-xs shrink-0 transition-colors" />
  </Link>
);

// New-user / nothing-upcoming state: encourage activity across every vertical, not just events.
const GetStarted = () => (
  <div className="py-2">
    <p className="text-center text-sm text-slate-500 mb-5">Here's what you can do on Desify</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <StarterTile icon={FaCalendarAlt} title="Events" desc="Host an event or find one to attend." href="/events" />
      <StarterTile icon={FaBoxOpen} title="Listings" desc="Post a listing or find local listings." href="/listings" />
      <StarterTile icon={FaTags} title="Deals" desc="Post a deal or find local deals." href="/dailydeals" />
      <StarterTile icon={FaComments} title="Forum" desc="Browse topics or create one." href="/threads" />
    </div>
  </div>
);

const ProfilePage = () => {
  const { user } = useSelector((state) => state.user);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const showSkeleton = useDelayedLoading(loading);

  const fetchSummary = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/events/user/summary`, { withCredentials: true });
      setEvents(data.events || []);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
      setHasAttemptedLoad(true);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="space-y-3">
      <ProfilePageHeading title={`Welcome${user?.name ? `, ${user.name}` : ''}`} />

      {loading || showSkeleton ? (
        showSkeleton && <PageSkeleton variant="list" rows={3} />
      ) : error ? (
        <ErrorState onRetry={fetchSummary} />
      ) : hasAttemptedLoad && events.length === 0 ? (
        <GetStarted />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.eventId} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

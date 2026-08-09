'use client';

// Public "events by one organiser" page body - see featureplans/events-by-organiser.md.
// Fetches GET /events/by/{slug}, shows the "Events by {name}" heading and the organiser's events in
// the shared events grid (no filters), with plain empty and not-found states. No login required.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from '@/utils/axiosConfig';
import EventsGrid from '@/components/events/eventcomponents/EventsGrid';
import EmptyState from '@/components/layout/EmptyState';

export default function OrganiserEventsClient({ slug }) {
  const [state, setState] = useState('loading'); // loading | ready | error | notfound
  const [events, setEvents] = useState([]);
  const [organiserName, setOrganiserName] = useState('');

  const load = () => {
    setState('loading');
    axios
      .get(`/events/by/${slug}`)
      .then((res) => {
        setOrganiserName(res.data?.organiserName || 'Organiser');
        setEvents(res.data?.events || []);
        setState('ready');
      })
      .catch((err) => setState(err?.response?.status === 404 ? 'notfound' : 'error'));
  };

  useEffect(() => { load(); }, [slug]);

  if (state === 'notfound') {
    return (
      <EmptyState
        title="Organiser not found"
        description="We couldn't find an organiser at this link. Check the link and try again."
        actionLabel="Browse all events"
        actionHref="/events"
      />
    );
  }

  return (
    <div className="flex flex-col relative min-h-[calc(100vh-180px)]">
      <section className="flex flex-col gap-2 sm:gap-3">
        <div className="border-y border-teal-100 py-3 sm:py-4 md:w-fit md:mx-auto md:px-8">
          <h1 className="text-center text-sm sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
            {state === 'ready' ? `Events by ${organiserName}` : 'Events'}
          </h1>
        </div>
      </section>

      <div className="mt-4">
        {state === 'ready' && events.length === 0 ? (
          <EmptyState
            title="No upcoming events"
            description="This organiser has no upcoming events right now."
            actionLabel="Browse all events"
            actionHref="/events"
          />
        ) : (
          <EventsGrid
            events={events}
            eventStatus={state === 'loading' ? 'loading' : state === 'error' ? 'failed' : 'success'}
            onRetry={load}
          />
        )}
      </div>

      {/* End-of-list CTA: after seeing this organiser's events, keep exploring the whole platform.
          Primary button per design-system.md section 4 (a standalone CTA is a primary alone). */}
      {state === 'ready' && events.length > 0 && (
        <div className="mt-8 mb-4 flex justify-center">
          <Link
            href="/events"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors"
          >
            Browse all events
          </Link>
        </div>
      )}
    </div>
  );
}

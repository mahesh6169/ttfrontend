'use client';

// Past events section at the bottom of /events (events-past-events.md). Social proof that events happen
// here while the upcoming list is thin. Date-based (the backend selects events whose end date is past,
// admin-featured only, newest 12). Same grid and full-size cards as the upcoming events, with an "Ended"
// tag, under a centred heading with fading lines. Renders nothing when there are no past events.
import React, { useEffect, useState } from 'react';
import axios from '@/utils/axiosConfig';
import EventCard from '@/components/events/eventcomponents/EventCard';

const PastEvents = () => {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    axios
      .get('/events/past')
      .then((res) => { if (active) setEvents(res.data?.events || []); })
      .catch(() => { if (active) setEvents([]); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  // No past events yet -> no section (keeps the page clean until there is something to show).
  if (loaded && events.length === 0) return null;
  if (!loaded) return null;

  return (
    <section data-testid="past-events" className="mx-auto w-full max-w-7xl px-3 sm:px-4 mt-8 mb-8">
      {/* Centred heading between two fading teal lines, each ending in a small diamond. */}
      <div className="flex items-center justify-center gap-3 sm:gap-4">
        <span aria-hidden="true" className="h-px flex-1 max-w-[16rem] bg-gradient-to-r from-transparent to-teal-300" />
        <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-teal-700 shrink-0" />
        <h2 className="text-base sm:text-xl font-bold text-teal-900 whitespace-nowrap">Past events</h2>
        <span aria-hidden="true" className="w-1.5 h-1.5 rotate-45 bg-teal-700 shrink-0" />
        <span aria-hidden="true" className="h-px flex-1 max-w-[16rem] bg-gradient-to-l from-transparent to-teal-300" />
      </div>
      <p className="mt-1 mb-4 text-center text-xs sm:text-sm text-slate-500">Events recently held on Desify</p>
      {/* Same grid as the upcoming events (EventsGrid). */}
      <div
        data-testid="past-events-grid"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-4"
      >
        {events.map((event) => (
          <EventCard key={event._id} event={event} ended isInWishlist={false} onWishlistToggle={() => {}} />
        ))}
      </div>
    </section>
  );
};

export default PastEvents;

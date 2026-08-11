'use client';

// Past events section at the bottom of /events (events-past-events.md). Social proof that events happen
// here while the upcoming list is thin. Date-based (the backend selects events whose end date is past),
// existing event cards with an "Ended" tag, in a horizontally scrolling strip so it never dominates the
// page. Renders nothing when there are no past events.
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
      <h2 className="mb-3 text-base sm:text-lg font-bold text-slate-900">Past events</h2>
      {/* Horizontally scrolling strip of Ended cards. */}
      <div
        data-testid="past-events-scroll"
        className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]"
      >
        {events.map((event) => (
          <div key={event._id} className="w-40 sm:w-48 shrink-0">
            <EventCard event={event} ended isInWishlist={false} onWishlistToggle={() => {}} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PastEvents;

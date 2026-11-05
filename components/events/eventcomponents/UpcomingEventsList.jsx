import Link from 'next/link';
import { format } from 'date-fns';
import { buildSlugUrl } from '@/utils/slugUtils';

// "Upcoming events" list shown on a finished or cancelled event's page (feature 1013, owner
// choice after UAT: right column on desktop, after the event details on phones). Renders
// nothing when there are no upcoming events. events: up to 3 { _id, title, date, image } from
// the homepage feed (/home/events).
export default function UpcomingEventsList({ events = [], testId = 'upcoming-events' }) {
  if (!events.length) return null;

  return (
    <section data-testid={testId} aria-labelledby={`${testId}-heading`} className="flex flex-col gap-3">
      <h2 id={`${testId}-heading`} className="text-base font-semibold text-slate-800">
        Upcoming events
      </h2>
      <ul className="flex flex-col gap-3">
        {events.map((e) => (
          <li key={e._id}>
            <Link href={buildSlugUrl('event', e.title, e._id)} className="flex items-center gap-3 group">
              <span className="flex-none w-[72px] h-12 rounded-lg overflow-hidden bg-slate-200">
                {e.image ? (
                  <img src={e.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : null}
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-sm text-teal-700 group-hover:text-teal-900 group-hover:underline leading-snug">
                  {e.title}
                </span>
                {e.date ? (
                  <span className="text-xs text-slate-600">{format(new Date(e.date), 'EEE, dd MMM yyyy')}</span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/events" className="text-sm text-teal-700 underline hover:text-teal-900">
        See all upcoming events
      </Link>
    </section>
  );
}

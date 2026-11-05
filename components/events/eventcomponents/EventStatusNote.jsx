import Link from 'next/link';
import { format } from 'date-fns';
import { buildSlugUrl } from '@/utils/slugUtils';

// Banner at the top of an event page that has finished or was cancelled (feature 1013).
// Server-rendered (in the page HTML), so visitors arriving from Google see it straight away.
// state: 'ended' | 'cancelled'. upcoming: up to 3 { _id, title, date } from /home/events.
export default function EventStatusNote({ state, upcoming = [] }) {
  const isCancelled = state === 'cancelled';
  const heading = isCancelled ? 'This event was cancelled' : 'This event has ended';

  return (
    <section
      data-testid="event-status-note"
      aria-label={heading}
      className={`rounded-2xl border px-4 py-3 ${
        isCancelled ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <p className={`font-semibold ${isCancelled ? 'text-red-800' : 'text-amber-900'}`}>{heading}</p>
      {upcoming.length > 0 ? (
        <div className="mt-2">
          <p className="text-sm text-slate-700">Upcoming events you might like:</p>
          <ul className="mt-1 flex flex-col gap-1">
            {upcoming.map((e) => (
              <li key={e._id} className="text-sm">
                <Link href={buildSlugUrl('event', e.title, e._id)} className="text-teal-700 underline hover:text-teal-900">
                  {e.title}
                </Link>
                {e.date ? (
                  <span className="text-slate-600"> - {format(new Date(e.date), 'dd MMM yyyy')}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Link href="/events" className="mt-2 inline-block text-sm text-teal-700 underline hover:text-teal-900">
        See all upcoming events
      </Link>
    </section>
  );
}

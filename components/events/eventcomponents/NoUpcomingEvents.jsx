// /events with no upcoming events at all (default view): a short panel under the create-event
// banner, so Past events follow straight after instead of a full-screen "No events found".
// Filtered searches with no results still use the shared EmptyState.
import Link from 'next/link';
import { BsCalendar3 } from 'react-icons/bs';

export default function NoUpcomingEvents() {
  return (
    <div
      data-testid="no-upcoming-events"
      className="flex items-center justify-center gap-3 sm:gap-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-4 sm:px-5 sm:py-5"
    >
      <BsCalendar3 className="w-7 h-7 sm:w-9 sm:h-9 text-teal-700 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-teal-800">No upcoming events right now</h2>
        <p className="text-sm text-slate-600">
          Want to host an event?{' '}
          <Link
            href="/support/contact?enquiry=event"
            className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-800"
          >
            Contact us
          </Link>{' '}
          and we&apos;ll talk you through it.
        </p>
      </div>
    </div>
  );
}

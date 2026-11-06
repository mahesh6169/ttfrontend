// Which status note an event page shows (feature 1013): 'cancelled', 'ended' or null.
// Used by app/events/(with-ads)/[slug]/page.jsx with components/events/eventcomponents/EventStatusNote.jsx.
// Which note an event needs, if any. Cancelled (the organiser's delete is a soft cancel) wins over
// ended. Ended = the event's end (expiryDate, else its start) is in the past - the same date-based
// rule as the backend's Past events list.
export function eventStatusFor(event, now = Date.now()) {
  if (!event) return null;
  if (event.deletedByOrganiser) return 'cancelled';
  // A single date of a repeating event ends with its own day, not the whole series.
  const end = event.isRecurringInstance ? event.dateTime : (event.expiryDate || event.dateTime);
  const t = end ? new Date(end).getTime() : NaN;
  if (Number.isFinite(t) && t < now) return 'ended';
  return null;
}

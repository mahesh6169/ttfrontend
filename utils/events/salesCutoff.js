// Mirrors the backend isSalesOpen helper (fix-events-sales-cutoff.md D4).
// Computes 11:59:59 PM on the event's local calendar day (event.dateTime in event.timeZone)
// and returns true if that moment has passed.
// Both sides must use the same rule so the CTA state and the backend gate can never drift.
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// Returns true when ticket sales are closed for `event` (past 11:59:59pm on the event day).
export const isSalesClosed = (event, now = new Date()) => {
  if (!event?.dateTime || !event?.timeZone) return false;
  const tz = event.timeZone;
  const localStart = utcToZonedTime(new Date(event.dateTime), tz);
  const y = localStart.getFullYear();
  const m = String(localStart.getMonth() + 1).padStart(2, '0');
  const d = String(localStart.getDate()).padStart(2, '0');
  const cutoffLocal = `${y}-${m}-${d}T23:59:59`;
  const cutoffUtc = zonedTimeToUtc(cutoffLocal, tz);
  return now > cutoffUtc;
};

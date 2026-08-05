// utils/events/ticketStatusHelper.js

import { formatInTimeZone } from 'date-fns-tz';
import { FaRegClock, FaHourglassHalf, FaRegCalendarAlt, FaLock, FaBan } from 'react-icons/fa';

// Sale-status badges (design-system.md badges): 12px, tint bg-50 / border-200 / text-800; short
// labels are pills (rounded-full), date-bearing labels are soft-rects (rounded-md); the icon rides
// the accent (inherits the badge text colour). className is the whole badge so both the detail card
// and the tickets page render it identically.
const BADGE_BASE = 'inline-flex items-center gap-1 px-2 py-0.5 text-xs whitespace-nowrap border';
const BADGE_AMBER = `${BADGE_BASE} rounded-full bg-amber-50 border-amber-200 text-amber-800`;
const BADGE_RED = `${BADGE_BASE} rounded-full bg-red-50 border-red-200 text-red-700`;
const BADGE_SLATE = `${BADGE_BASE} rounded-md bg-slate-100 border-slate-200 text-slate-600`;

/**
 * Get ticket sale status with appropriate icon and message
 * @param {Object} ticket - Ticket object with startDate and expiryDate
 * @param {String} eventTimeZone - Event timezone
 * @param {Object} capacity - Event capacity object with status
 * @returns {Object} { icon, message, className, priority }
 */
export const getTicketSaleStatus = (ticket, eventTimeZone, capacity = null) => {
  const now = new Date();
  const fmt = (d) => formatInTimeZone(new Date(d), eventTimeZone, 'd MMM yyyy');

  // Sold out — needs capacity, so only surfaces on the purchase flow (not the detail list).
  if (capacity && capacity.total > 0 && capacity.confirmedAllocations >= capacity.total) {
    return { message: 'Sold out', className: BADGE_RED, icon: FaBan, priority: 1, unavailable: true };
  }

  // Sales haven't started yet — upcoming, informational (slate + clock).
  if (ticket.startDate && now < new Date(ticket.startDate)) {
    return { message: `Sales open ${fmt(ticket.startDate)}`, className: BADGE_SLATE, icon: FaRegClock, priority: 2 };
  }

  // On sale — check for expiry
  if (ticket.expiryDate) {
    const expiryDate = new Date(ticket.expiryDate);

    if (now > expiryDate) {
      return { message: 'Sales closed', className: BADGE_RED, icon: FaLock, priority: 1, unavailable: true };
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilExpiry = Math.ceil((expiryDate - now) / msPerDay);

    // Closing-soon nudge — amber + hourglass so the time pressure actually reads.
    if (daysUntilExpiry <= 5 && daysUntilExpiry > 0) {
      return {
        message: `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`,
        className: BADGE_AMBER,
        icon: FaHourglassHalf,
        priority: 3,
      };
    }

    // On sale with an end date — calm neutral (slate + calendar).
    return { message: `Sales end ${fmt(expiryDate)}`, className: BADGE_SLATE, icon: FaRegCalendarAlt, priority: 4 };
  }

  // On sale, no end date — nothing to show (keeps the row clean)
  return null;
};

/**
 * Get the most relevant ticket status for an event
 * @param {Array} ticketTypes - Array of ticket types
 * @param {String} eventTimeZone - Event timezone
 * @param {Object} capacity - Event capacity object
 * @returns {Object} Most relevant status based on priority
 */
export const getEventTicketStatus = (ticketTypes, eventTimeZone, capacity = null) => {
  if (!ticketTypes || ticketTypes.length === 0) {
    return null;
  }
  
  // Get status for all tickets (some may be null — on-sale with no end date)
  const statuses = ticketTypes
    .map(ticket => getTicketSaleStatus(ticket, eventTimeZone, capacity))
    .filter(Boolean);

  if (statuses.length === 0) return null;

  // Return the status with highest priority (lowest number)
  return statuses.reduce((prev, current) =>
    prev.priority < current.priority ? prev : current
  );
};
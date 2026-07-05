// utils/events/ticketStatusHelper.js

import { formatInTimeZone } from 'date-fns-tz';

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
    return { message: 'Sold out', className: 'text-red-600 font-medium', priority: 1, unavailable: true };
  }

  // Sales haven't started yet
  if (ticket.startDate && now < new Date(ticket.startDate)) {
    return { message: `Sales open ${fmt(ticket.startDate)}`, className: 'text-slate-500', priority: 2 };
  }

  // On sale — check for expiry
  if (ticket.expiryDate) {
    const expiryDate = new Date(ticket.expiryDate);

    if (now > expiryDate) {
      return { message: 'Sales closed', className: 'text-slate-400', priority: 1, unavailable: true };
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilExpiry = Math.ceil((expiryDate - now) / msPerDay);

    // Subtle closing-soon nudge (no alarm colour — the shorter window is the signal)
    if (daysUntilExpiry <= 5 && daysUntilExpiry > 0) {
      return {
        message: `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`,
        className: 'text-slate-600 font-medium',
        priority: 3,
      };
    }

    // On sale with an end date
    return { message: `Sales end ${fmt(expiryDate)}`, className: 'text-slate-500', priority: 4 };
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
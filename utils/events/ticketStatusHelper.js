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
  
  // Check if sold out first - using confirmedAllocations for accurate sold out status
  if (capacity && capacity.total > 0 && capacity.confirmedAllocations >= capacity.total) {
    return {
      icon: '❌',
      message: 'Sold out',
      className: 'text-red-600',
      priority: 1
    };
  }
  
  // Check if ticket sales haven't started yet
  if (ticket.startDate) {
    const startDate = new Date(ticket.startDate);
    if (now < startDate) {
      return {
        icon: '🔔',
        message: `Available from ${formatInTimeZone(startDate, eventTimeZone, 'MMM d, yyyy')}`,
        className: 'text-orange-600',
        priority: 2
      };
    }
  }
  
  // Ticket is on sale - check for expiry
  if (ticket.expiryDate) {
    const expiryDate = new Date(ticket.expiryDate);
    
    if (now > expiryDate) {
      return {
        icon: '⏰',
        message: 'Sales ended',
        className: 'text-gray-600',
        priority: 1
      };
    }
    
    // Calculate days until expiry
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilExpiry = Math.ceil((expiryDate - now) / msPerDay);
    
    // Hurry message for less than 5 days
    if (daysUntilExpiry <= 5 && daysUntilExpiry > 0) {
      return {
        icon: '⚡',
        message: `Hurry! Only ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} left`,
        className: 'text-orange-600',
        priority: 3
      };
    }
    
    // On sale with end date
    return {
      icon: '✅',
      message: `On sale now • Until ${formatInTimeZone(expiryDate, eventTimeZone, 'MMM d, yyyy')}`,
      className: 'text-green-600',
      priority: 4
    };
  }
  
  // On sale with no end date
  return {
    icon: '✅',
    message: 'On sale now',
    className: 'text-green-600',
    priority: 5
  };
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
  
  // Get status for all tickets
  const statuses = ticketTypes.map(ticket => 
    getTicketSaleStatus(ticket, eventTimeZone, capacity)
  );
  
  // Return the status with highest priority (lowest number)
  return statuses.reduce((prev, current) => 
    prev.priority < current.priority ? prev : current
  );
};
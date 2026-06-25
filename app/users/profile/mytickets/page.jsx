"use client";
import React, { useState, useEffect, Fragment } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { generateTicketsPDF } from '../../../../utils/paidEventTicketGenerator';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import axios from '@/utils/axiosConfig';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { FaQrcode, FaDownload, FaRegCalendarAlt, FaMapMarkerAlt, FaBriefcase, FaRegEnvelope, FaPhoneAlt, FaTicketAlt } from 'react-icons/fa';
import PageSkeleton from '@/components/skeleton/PageSkeleton';
import useDelayedLoading from '@/hooks/useDelayedLoading';
import ProfilePageHeading from '@/components/layout/ProfilePageHeading';
import EmptyState from '@/components/layout/EmptyState';
import ErrorState from '@/components/layout/ErrorState';

const DATE_FILTER_OPTIONS = [
  { value: '3months', label: 'Last 3 months' },
  { value: '6months', label: 'Last 6 months' },
  { value: '1year', label: 'Last year' },
  { value: 'all', label: 'Show all' },
];

const EnhancedMyTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventTickets, setSelectedEventTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicketGroup, setSelectedTicketGroup] = useState(null);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('3months'); // Default to 3 months
  const [expandedPurchases, setExpandedPurchases] = useState(new Set());
  const [activeTab, setActiveTab] = useState({}); // { invoiceNumber: 'tickets' | 'details' }
  // Anti-flash skeleton gate — see designGuides/02-Frontend-GUI/ProfileUnification.md (T3)
  const showSkeleton = useDelayedLoading(loading);

  // Fetch all user tickets
  useEffect(() => {
    const fetchAllMyTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/paid/my-paid-tickets`,
          {
            withCredentials: true,
          }
        );

        const data = response.data;

        if (data.success) {
          setTickets(data.tickets);
          
          // Extract unique events from tickets using eventSnapshot from the LATEST ticket per event
          const eventMap = data.tickets.reduce((acc, ticket) => {
            const eventKey = ticket.event || ticket.eventSnapshot?.eventCode;
            if (eventKey) {
              // If we haven't seen this event yet, or this ticket is newer, update the event info
              if (!acc[eventKey] || new Date(ticket.createdAt) > new Date(acc[eventKey].createdAt)) {
                acc[eventKey] = {
                  id: eventKey,
                  title: ticket.eventSnapshot?.title,
                  dateTime: ticket.eventSnapshot?.dateTime,
                  venue: ticket.eventSnapshot?.venue,
                  eventCode: ticket.eventSnapshot?.eventCode,
                  organizer: ticket.eventSnapshot?.organizer,
                  timeZone: ticket.eventSnapshot?.timeZone,
                  createdAt: ticket.createdAt // Keep track of ticket creation time
                };
              }
            }
            return acc;
          }, {});
          
          // Convert to array and remove createdAt field
          const uniqueEvents = Object.values(eventMap).map(({ createdAt, ...event }) => event);

          // Sort events by date (most recent first)
          uniqueEvents.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
          setEvents(uniqueEvents);

          console.log(`✅ Found ${data.count} tickets across ${uniqueEvents.length} events`);
        } else {
          throw new Error(data.message || 'API returned success: false');
        }

      } catch (err) {
        console.error('❌ Error fetching tickets:', err);
        setError(`${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllMyTickets();
  }, []);

  // Apply date filtering to events
  useEffect(() => {
    if (events.length === 0) {
      setFilteredEvents([]);
      return;
    }

    const now = new Date();
    let filtered = [...events];

    switch (dateFilter) {
      case '3months':
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filtered = events.filter(event => new Date(event.dateTime) >= threeMonthsAgo);
        break;
      case '6months':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        filtered = events.filter(event => new Date(event.dateTime) >= sixMonthsAgo);
        break;
      case '1year':
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        filtered = events.filter(event => new Date(event.dateTime) >= oneYearAgo);
        break;
      case 'all':
      default:
        // Show all events
        break;
    }

    setFilteredEvents(filtered);
  }, [events, dateFilter]);

  // Filter tickets when event is selected
  useEffect(() => {
    if (selectedEventId && tickets.length > 0) {
      const eventTickets = tickets.filter(ticket => {
        const ticketEventId = ticket.event || ticket.eventSnapshot?.eventCode; 
        return ticketEventId === selectedEventId;
      });
      
      // Group tickets by invoice number for purchase groups
      const groupedTickets = groupTicketsByInvoice(eventTickets);
      setSelectedEventTickets(groupedTickets);
    } else {
      setSelectedEventTickets([]);
    }
  }, [selectedEventId, tickets]);

  // Format event date with timezone support
  const formatEventDateTime = (dateTime, timeZone) => {
    try {
      const date = formatInTimeZone(dateTime, timeZone, 'dd/MM/yyyy');
      const time = formatInTimeZone(dateTime, timeZone, 'h:mm a');
      return { date, time, combined: `${date} at ${time}` };
    } catch (error) {
      console.error('Error formatting date:', error);
      // Fallback to regular date formatting
      const fallbackDate = new Date(dateTime);
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        combined: fallbackDate.toLocaleString()
      };
    }
  };

  // Group tickets by invoice number (same purchase)
  const groupTicketsByInvoice = (tickets) => {
    const grouped = tickets.reduce((acc, ticket) => {
      const invoiceNumber = ticket.invoiceNumber;
      if (!acc[invoiceNumber]) {
        acc[invoiceNumber] = [];
      }
      acc[invoiceNumber].push(ticket);
      return acc;
    }, {});

    // Convert to array and sort by purchase date
    return Object.values(grouped).sort((a, b) => 
      new Date(b[0].createdAt) - new Date(a[0].createdAt)
    );
  };

  // Calculate total for a ticket group
  const calculateGroupTotal = (ticketGroup) => {
    return ticketGroup.reduce((sum, ticket) => sum + (ticket.priceDetails?.totalPrice || ticket.ticketType?.price || 0), 0);
  };

  // Format seat information for display
  const formatSeats = (ticketGroup) => {
    const allSeats = ticketGroup.flatMap(ticket => ticket.seats || []);
    
    if (allSeats.length === 0) {
      return 'General Admission';
    }

    if (allSeats.length === 1) {
      return `${allSeats[0].row}-${allSeats[0].seatNumber}`;
    }

    // Group by row
    const seatsByRow = allSeats.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(parseInt(seat.seatNumber));
      return acc;
    }, {});

    const formattedRows = Object.entries(seatsByRow).map(([row, numbers]) => {
      numbers.sort((a, b) => a - b);
      
      if (numbers.length === 1) {
        return `${row}-${numbers[0]}`;
      } else if (areConsecutive(numbers)) {
        return `${row}-${numbers[0]} to ${row}-${numbers[numbers.length - 1]}`;
      } else {
        return `${row}: ${numbers.join(', ')}`;
      }
    });

    return formattedRows.join(', ');
  };

 // Check if numbers are consecutive
  const areConsecutive = (numbers) => {
    for (let i = 1; i < numbers.length; i++) {
      if (numbers[i] !== numbers[i-1] + 1) return false;
    }
    return true;
  };

  // 🆕 NEW: Group tickets by type within a ticket group
  const groupTicketsByType = (ticketGroup) => {
    const typeGroups = {};
    
    ticketGroup.forEach(ticket => {
      const typeName = ticket.ticketType.name;
      if (!typeGroups[typeName]) {
        typeGroups[typeName] = {
          name: typeName,
          count: 0,
          tickets: []
        };
      }
      typeGroups[typeName].count++;
      typeGroups[typeName].tickets.push(ticket);
    });
    
    return Object.values(typeGroups);
  };


  // Get refund status
  // A ticket is "refunded" if it's cancelled or has any refund (partial or full)
  // Money amount doesn't matter - once refunded, ticket is released
  const getRefundStatus = (ticketGroup) => {
    const refundedTickets = ticketGroup.filter(t =>
      t.checkInStatus === 'cancelled' || t.refundStatus === 'partial' || t.refundStatus === 'full'
    );

    if (refundedTickets.length === 0) return null;

    if (refundedTickets.length === ticketGroup.length) {
      // All tickets refunded - show red
      return { type: 'full', text: 'Refunded' };
    } else {
      // Some tickets refunded - show orange
      return { type: 'partial', text: `${refundedTickets.length}/${ticketGroup.length} Refunded` };
    }
  };

  // Handle tab click for purchases
  const handleTabClick = (invoiceNumber, tab) => {
    const isCurrentlyExpanded = expandedPurchases.has(invoiceNumber);
    const currentTab = activeTab[invoiceNumber] || 'tickets';
    
    if (!isCurrentlyExpanded) {
      const newExpanded = new Set(expandedPurchases);
      newExpanded.add(invoiceNumber);
      setExpandedPurchases(newExpanded);
      setActiveTab({ ...activeTab, [invoiceNumber]: tab });
    } else if (currentTab === tab) {
      const newExpanded = new Set(expandedPurchases);
      newExpanded.delete(invoiceNumber);
      setExpandedPurchases(newExpanded);
    } else {
      setActiveTab({ ...activeTab, [invoiceNumber]: tab });
    }
  };


  if (loading || showSkeleton) {
    return (
      <div className="space-y-6">
        <ProfilePageHeading title="My Tickets" />
        {showSkeleton && <PageSkeleton variant="list" rows={6} />}
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <ProfilePageHeading title="My Tickets" />
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div>
        <ProfilePageHeading title="My Tickets" />
        <EmptyState
          title="No tickets yet"
          description="You haven't purchased any tickets yet."
          actionLabel="Browse Events"
          actionHref="/events"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProfilePageHeading title="My Tickets" />

      {/* Event Selector with Date Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="space-y-3">
          {/* Combined Date Filter and Event Selector */}
          <div className="flex flex-col sm:flex-row sm:gap-4">
            {/* Date Filter - Compact */}
            <div className="sm:w-1/3">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
                Date Range
              </label>
              <Listbox value={dateFilter} onChange={setDateFilter}>
                <div className="relative">
                  <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
                    <span className="block truncate text-slate-900">
                      {DATE_FILTER_OPTIONS.find((o) => o.value === dateFilter)?.label}
                    </span>
                    <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </ListboxButton>
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <ListboxOptions
                      anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                      className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                    >
                      {DATE_FILTER_OPTIONS.map((option) => (
                        <ListboxOption
                          key={option.value}
                          value={option.value}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                {option.label}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              </Listbox>
            </div>

            {/* Event Selector - Compact */}
            <div className="flex-1 mt-3 sm:mt-0">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
                Select Event
              </label>
              {(() => {
                const selectedEvent = events.find((e) => e.id === selectedEventId);
                return (
                  <Listbox value={selectedEventId} onChange={setSelectedEventId}>
                    <div className="relative">
                      <ListboxButton className="relative w-full pl-3 pr-9 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 cursor-pointer text-left">
                        <span className={`block truncate ${selectedEvent ? 'text-slate-900' : 'text-slate-500'}`}>
                          {selectedEvent
                            ? `${selectedEvent.eventCode} - ${selectedEvent.title}`
                            : 'Choose an event'}
                        </span>
                        <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </ListboxButton>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <ListboxOptions
                          anchor={{ to: 'bottom start', gap: 4, padding: 16 }}
                          className="z-50 w-[var(--button-width)] max-h-60 overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200 focus:outline-none"
                        >
                          <ListboxOption
                            value=""
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                  Choose an event
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </>
                            )}
                          </ListboxOption>
                          {filteredEvents.length === 0 ? (
                            <div className="px-4 py-2.5 text-sm text-slate-400">
                              No events found
                            </div>
                          ) : (
                            filteredEvents.map((event) => {
                              const eventDateTime = formatEventDateTime(event.dateTime, event.timeZone);
                              return (
                                <ListboxOption
                                  key={event.id}
                                  value={event.id}
                                  className={({ active }) =>
                                    `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${active ? 'bg-teal-50 text-teal-900' : 'text-slate-900'}`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                        {event.eventCode} - {event.title} - {eventDateTime.date} - {eventDateTime.time}
                                      </span>
                                      {selected && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-teal-600">
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </span>
                                      )}
                                    </>
                                  )}
                                </ListboxOption>
                              );
                            })
                          )}
                        </ListboxOptions>
                      </Transition>
                    </div>
                  </Listbox>
                );
              })()}

              {filteredEvents.length === 0 && events.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  No events in selected range. Try a different date filter.
                </p>
              )}
            </div>
          </div>

          {/* Data Retention Warning - More compact */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Please save your tickets. Events older than 2 years will be deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Selected Event Tickets */}
      {selectedEventId && selectedEventTickets.length > 0 && (
        <div className="space-y-4">
          {/* Event Info Header */}
          {(() => {
            const selectedEvent = events.find(e => e.id === selectedEventId);
            // Get the latest ticket across ALL tickets for this event (not just first group)
            const allEventTickets = tickets.filter(ticket => {
              const ticketEventId = ticket.event || ticket.eventSnapshot?.eventCode;
              return ticketEventId === selectedEventId;
            });
            // Sort by createdAt to get the absolute latest ticket
            const latestTicket = allEventTickets.sort((a, b) => 
              new Date(b.createdAt) - new Date(a.createdAt)
            )[0];
            const eventInfo = latestTicket?.eventSnapshot || selectedEvent;
            const timeZone = eventInfo.timeZone;
            const eventDateTime = formatEventDateTime(eventInfo.dateTime, timeZone);
            
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Event details */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono font-semibold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">
                      {eventInfo.eventCode}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-teal-700">
                      {eventInfo.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3">
                    <div className="flex items-start gap-2">
                      <FaRegCalendarAlt className="text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{eventDateTime.date}</p>
                        <p className="text-xs text-slate-500">Starts at {eventDateTime.time} ({timeZone})</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className="text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{eventInfo.venue}</p>
                        {eventInfo.address && (
                          <p className="text-xs text-slate-500">{eventInfo.address}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organizer contact */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 flex flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                    Organizer Contact
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <FaBriefcase />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{eventInfo.organizer?.name || 'Event Organizer'}</p>
                      <p className="text-xs text-slate-500">Host Organization</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {eventInfo.organizer?.email && (
                      <a
                        href={`mailto:${eventInfo.organizer.email}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors break-all"
                      >
                        <FaRegEnvelope className="text-teal-600 shrink-0" />
                        <span className="truncate">{eventInfo.organizer.email}</span>
                      </a>
                    )}
                    {(eventInfo.organizer?.contact || eventInfo.organizer?.phone) && (
                      <a
                        href={`tel:${eventInfo.organizer.contact || eventInfo.organizer.phone}`}
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-700 transition-colors"
                      >
                        <FaPhoneAlt className="text-teal-600 shrink-0" />
                        <span>{eventInfo.organizer.contact || eventInfo.organizer.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Ticket Purchase Groups */}
          <div className="space-y-3 sm:space-y-4">
            
            {selectedEventTickets.map((ticketGroup, index) => {
              const representative = ticketGroup[0];
              const invoiceNumber = representative.invoiceNumber;
              const isExpanded = expandedPurchases.has(invoiceNumber);
              const totalAmount = calculateGroupTotal(ticketGroup);
              const seatInfo = formatSeats(ticketGroup);
              const refundStatus = getRefundStatus(ticketGroup);
              const typeGroups = groupTicketsByType(ticketGroup);
              
              return (
                <div key={`${invoiceNumber}-${index}`} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Slim row: actions (left) + booked date (right) */}
                  <div className="p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleTabClick(invoiceNumber, 'tickets')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-teal-700 text-white hover:bg-teal-800 transition-colors"
                      >
                        <FaTicketAlt />
                        <span>Tickets</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTicketGroup(ticketGroup);
                          setShowTicketsModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        <FaQrcode />
                        <span>QR Code</span>
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-1 text-xs sm:text-sm text-slate-600 text-right leading-tight shrink-0">
                      <span>Booked on</span>
                      <span>{new Date(representative.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Tab Content */}
                  {isExpanded && (
                    <div className="border-t border-slate-200">
                      {/* Ticket Details Tab */}
                      <div className="p-3 sm:p-4 bg-white">
                        <div className="space-y-2">
                          {ticketGroup.map((ticket, idx) => {
                            const isRefunded = ticket.refundStatus === 'full' || ticket.checkInStatus === 'cancelled';
                            return (
                              <div key={ticket._id} className={`border-b last:border-0 pb-2 last:pb-0 ${isRefunded ? 'opacity-60' : ''}`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg">{isRefunded ? '✗' : '✓'}</span>
                                    <div>
                                      <div className="text-sm sm:text-base font-mono font-medium text-slate-900">
                                        {ticket.ticketNumber}
                                        {isRefunded && <span className="ml-2 text-xs font-bold text-red-600">[REFUNDED]</span>}
                                      </div>
                                      <div className="text-xs sm:text-sm text-slate-600">
                                        {ticket.ticketType.name}
                                      </div>
                                    </div>
                                  </div>
                                  {ticket.seats?.[0] && (
                                    <div className="text-xs sm:text-sm text-slate-600">
                                      Seat: {ticket.seats[0].row}-{ticket.seats[0].seatNumber}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tickets Modal */}
      {showTicketsModal && selectedTicketGroup && (
        <TicketsModal
          ticketGroup={selectedTicketGroup}
          onClose={() => {
            setShowTicketsModal(false);
            setSelectedTicketGroup(null);
          }}
        />
      )}
    </div>
  );
};


// Tickets Modal Component - Simple ticket style
const TicketsModal = ({ ticketGroup, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Get event information from the first ticket
  const firstTicket = ticketGroup[0];
  const eventInfo = firstTicket.eventSnapshot;
  
  // Format event date with timezone support
  const formatEventDateTime = () => {
    try {
      const date = formatInTimeZone(eventInfo.dateTime, eventInfo.timeZone, 'dd/MM/yyyy');
      const time = formatInTimeZone(eventInfo.dateTime, eventInfo.timeZone, 'h:mm a');
      return { date, time };
    } catch (error) {
      const fallbackDate = new Date(eventInfo.dateTime);
      return {
        date: fallbackDate.toLocaleDateString(),
        time: fallbackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }
  };

  const { date, time } = formatEventDateTime();

  // PDF Download function for tickets
  const downloadTicketsPDF = async () => {
    setIsDownloading(true);
    
    try {
      // Small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Generate and download PDF
      generateTicketsPDF(ticketGroup, eventInfo);
      
      // Keep loading state for a bit longer so user sees it
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('PDF download started');
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Close button - Fixed at top */}
        <div className="flex-shrink-0 flex justify-end p-3 sm:p-4 border-b border-slate-200">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Ticket Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
          {/* Event Details - Centered */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{eventInfo.title}</h2>
            <p className="text-sm text-slate-600 font-mono">Event ID: {eventInfo.eventCode}</p>
          </div>

          {/* Date, Time and Location - Left aligned with spacing */}
          <div className="mb-6 text-sm text-slate-700">
            <div className="flex items-center mb-1">
              <span className="mr-2">📅</span>
              <span>{date} at {time}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">📍</span>
              <span>{eventInfo.venue}</span>
            </div>
          </div>

          {/* Dotted Line Separator */}
          <div className="border-b-2 border-dotted border-slate-400 mb-6"></div>

          {/* Ticket List - With QR codes */}
          <div className="space-y-4">
            {ticketGroup.map((ticket) => {
              const isRefunded = ticket.refundStatus === 'full' || ticket.checkInStatus === 'cancelled';
              return (
                <div key={ticket._id} className={`flex flex-col items-center py-3 border-b last:border-0 ${isRefunded ? 'bg-red-50' : ''}`}>
                  {isRefunded && (
                    <div className="bg-red-600 text-white px-3 py-1 rounded mb-2 text-sm font-bold">
                      ⚠️ REFUNDED - NOT VALID FOR ENTRY
                    </div>
                  )}
                  <div className="font-mono text-sm font-medium mb-1">{ticket.ticketNumber}</div>
                  <div className="text-sm text-slate-600 mb-2">
                    {ticket.ticketType.name}
                    {ticket.seats?.[0] && (
                      <span className="ml-2">
                        (Seat: {ticket.seats[0].row}-{ticket.seats[0].seatNumber})
                      </span>
                    )}
                  </div>
                  <div className={`bg-white p-2 rounded border relative ${isRefunded ? 'border-red-300 opacity-40' : 'border-slate-200'}`}>
                    <QRCodeSVG 
                      value={ticket.ticketNumber}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                    {isRefunded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 text-white font-bold text-4xl rounded-full w-16 h-16 flex items-center justify-center transform rotate-12 shadow-lg">
                          ✗
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`text-xs mt-2 ${isRefunded ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                    {isRefunded ? 'Not valid for entry' : 'Scan at entrance'}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Download Button - Fixed at bottom */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-slate-200">
          <button
            onClick={downloadTicketsPDF}
            disabled={isDownloading}
            className={`w-full px-4 py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 ${
              isDownloading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-teal-700 hover:bg-teal-800'
            } text-white`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FaDownload />
                <span>Download QR Codes as PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


export default EnhancedMyTicketsPage;
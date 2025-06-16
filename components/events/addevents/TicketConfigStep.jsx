// components/events/addevents/TicketConfigStep.jsx

import React from 'react';
import { useDispatch } from 'react-redux';
import {
  updateField,
  addTicketType,
  updateTicketType,
  removeTicketType,
  addSeatingRow,
  updateRowLabel,
  updateSeatCount,
  removeSeatingRow,
  addRegistrationField,
  updateRegistrationField,
  updateFieldOptions,
  removeRegistrationField,
} from '@/store/slices/events/eventSlice';

// Free Event Configuration Component
const FreeEventConfig = ({ formData = {}, errors = {}, dispatch }) => {
  const isRecurringEvent = formData.recurrence?.isRecurring || false;

  return (
    <div className="space-y-6">
      {/* Header with recurring event info */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Free Event Configuration
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure registration settings for your free event
            {isRecurringEvent && (
              <span className="block text-blue-600 font-medium mt-1">
                These settings will apply to all instances of your recurring
                event
              </span>
            )}
          </p>
        </div>
        {isRecurringEvent && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Recurring Event
          </span>
        )}
      </div>

      {/* Capacity Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              Capacity Management
            </h4>
            <p className="text-sm text-gray-500">
              Control how many people can attend your event
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Capacity
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={formData.capacity === '' ? '' : formData.capacity}
                onChange={(e) => {
                  const val = e.target.value;
                  dispatch(
                    updateField({
                      field: 'capacity',
                      value: val === '' ? '' : Math.max(0, Number(val) || 0),
                    })
                  );
                }}
                onBlur={(e) => {
                  if (e.target.value === '') {
                    dispatch(updateField({ field: 'capacity', value: 0 }));
                  }
                }}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors?.capacity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0 for unlimited"
              />

              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">
                  {formData.capacity === '' || formData.capacity === 0
                    ? 'Unlimited'
                    : 'People'}
                </span>
              </div>
            </div>
            {errors?.capacity && (
              <p className="mt-1 text-red-500 text-sm">{errors.capacity}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Set to 0 for unlimited capacity. This helps manage venue
              constraints and creates urgency.
            </p>
          </div>

          {/* Max Attendees Per Registration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Attendees Per Registration
            </label>
            <input
              type="number"
              min="1"
              max="20"
              inputMode="numeric"
              value={
                formData.maxAttendeesPerRegistration === ''
                  ? ''
                  : formData.maxAttendeesPerRegistration
              }
              onChange={(e) => {
                const val = e.target.value;
                dispatch(
                  updateField({
                    field: 'maxAttendeesPerRegistration',
                    value:
                      val === ''
                        ? ''
                        : Math.max(1, Math.min(20, Number(val) || 10)),
                  })
                );
              }}
              onBlur={(e) => {
                if (e.target.value === '' || Number(e.target.value) < 1) {
                  dispatch(
                    updateField({
                      field: 'maxAttendeesPerRegistration',
                      value: 10,
                    })
                  );
                }
              }}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors?.maxAttendeesPerRegistration
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
            />

            {errors?.maxAttendeesPerRegistration && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.maxAttendeesPerRegistration}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              How many people can be registered in a single booking (useful for
              families/groups).
            </p>
          </div>
        </div>

        {/* Capacity Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Registration Summary:</p>
            <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
              <span>
                Total Capacity:{' '}
                <strong>
                  {(formData.capacity || 0) === 0
                    ? 'Unlimited'
                    : formData.capacity}
                </strong>
              </span>
              <span>
                Max per booking:{' '}
                <strong>
                  {formData.maxAttendeesPerRegistration || 5} people
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <CustomRegistrationFields
        formData={formData}
        errors={errors}
        dispatch={dispatch}
        isRecurring={isRecurringEvent}
      />
    </div>
  );
};

// Paid Event Configuration Component
const PaidEventConfig = ({ formData = {}, errors = {}, dispatch }) => {
  const isRecurringEvent = formData.recurrence?.isRecurring || false;

  // Calculate allocated tickets and remaining pool
  const calculateTicketAllocation = () => {
    const totalCapacity = formData.capacity || 0;
    if (totalCapacity === 0) return { allocated: 0, remaining: 'Unlimited' };

    const allocatedTickets = (formData.ticketTypes || []).reduce(
      (total, ticket) => {
        return total + (ticket.quantity || 0);
      },
      0
    );

    const remainingTickets = Math.max(0, totalCapacity - allocatedTickets);

    return {
      allocated: allocatedTickets,
      remaining: remainingTickets,
    };
  };

  const ticketAllocation = calculateTicketAllocation();

  return (
    <div className="space-y-6">
      {/* Header with recurring event info */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Paid Event Configuration
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Set up ticket types, pricing, and payment settings
            {isRecurringEvent && (
              <span className="block text-blue-600 font-medium mt-1">
                These pricing settings will apply to all instances of your
                recurring event
              </span>
            )}
          </p>
        </div>
        {isRecurringEvent && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Recurring Event
          </span>
        )}
      </div>

      {/* Capacity Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              Capacity Management
            </h4>
            <p className="text-sm text-gray-500">
              Control how many people can attend your event
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Capacity
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={
                  formData.capacity === undefined || formData.capacity === null
                    ? ''
                    : String(formData.capacity)
                }
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow numbers, blank will not be allowed on submit
                  dispatch(
                    updateField({
                      field: 'capacity',
                      value: val, // Save as string for validation step
                    })
                  );
                }}
                placeholder="Enter 0 for unlimited"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                  errors?.capacity ? 'border-red-500' : 'border-gray-300'
                }`}
              />

              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">People</span>
              </div>
            </div>
            {errors?.capacity && (
              <p className="mt-1 text-red-500 text-sm">{errors.capacity}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Set the maximum number of people who can attend this event.
            </p>
          </div>

          {/* Max Attendees Per Registration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Attendees Per Registration
            </label>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={
                formData.maxAttendeesPerRegistration === undefined ||
                formData.maxAttendeesPerRegistration === null ||
                formData.maxAttendeesPerRegistration === ''
                  ? 10
                  : formData.maxAttendeesPerRegistration
              }
              onChange={(e) => {
                const val = e.target.value;
                // Don't allow empty or less than 1
                dispatch(
                  updateField({
                    field: 'maxAttendeesPerRegistration',
                    value: val === '' || Number(val) < 1 ? 10 : Number(val),
                  })
                );
              }}
              onBlur={(e) => {
                if (e.target.value === '' || Number(e.target.value) < 1) {
                  dispatch(
                    updateField({
                      field: 'maxAttendeesPerRegistration',
                      value: 10,
                    })
                  );
                }
              }}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors?.maxAttendeesPerRegistration
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="10"
            />

            {errors?.maxAttendeesPerRegistration && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.maxAttendeesPerRegistration}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              How many people can be registered in a single booking (useful for
              families/groups).
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Types */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              {/* SVG ICON */}
            </div>
            <div>
              <h4 className="text-lg font-medium text-gray-900">
                Ticket Types
              </h4>
              <p className="text-sm text-gray-500">
                Create different ticket categories with various pricing
              </p>
            </div>
          </div>

          {/* Ticket Allocation Summary */}
          <div className="text-right">
            <p className="text-sm text-gray-500">Tickets Remaining</p>
            <p
              className={`text-lg font-semibold ${
                typeof ticketAllocation.remaining === 'number' &&
                ticketAllocation.remaining <= 10
                  ? 'text-red-600'
                  : 'text-blue-600'
              }`}
            >
              {ticketAllocation.remaining === 'Unlimited'
                ? 'Unlimited'
                : `${ticketAllocation.remaining} / ${formData.capacity || 0}`}
            </p>
            {typeof ticketAllocation.remaining === 'number' &&
              ticketAllocation.remaining <= 10 && (
                <p className="text-xs text-red-500 mt-1">
                  Running low on tickets!
                </p>
              )}
          </div>
        </div>

        <div className="space-y-4">
          {(formData.ticketTypes || []).map((ticket, index) => (
            <div
              key={index}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-teal-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {ticket?.name || `Ticket Type ${index + 1}`}
                    </h5>
                    <p className="text-sm text-gray-500">
                      {ticket?.quantity && Number(ticket.quantity) > 0
                        ? `${ticket.quantity} allocated tickets`
                        : 'Shares remaining pool'}
                    </p>
                  </div>
                </div>

                {(formData.ticketTypes || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch(removeTicketType(index))}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Remove ticket type"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ticket Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ticket?.name || ''}
                    onChange={(e) =>
                      dispatch(
                        updateTicketType({
                          index,
                          field: 'name',
                          value: e.target.value,
                        })
                      )
                    }
                    placeholder="e.g., Early Bird, Standard, Group"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    maxLength="100"
                    required
                  />
                </div>

                {/* Ticket Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (AUD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        ticket.price === undefined || ticket.price === null
                          ? ''
                          : ticket.price
                      }
                      onChange={(e) => {
                        // Allow user to backspace (set to empty string)
                        const val = e.target.value;
                        dispatch(
                          updateTicketType({
                            index,
                            field: 'price',
                            value: val, // Pass as string; final validation step will coerce/check
                          })
                        );
                      }}
                      className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ticket price must be{' '}
                    <span className="font-medium text-teal-700">
                      greater than 0
                    </span>{' '}
                    (no free tickets).
                  </p>
                </div>

                {/* Ticket Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={
                      ticket.quantity === undefined || ticket.quantity === null
                        ? ''
                        : ticket.quantity
                    }
                    onChange={(e) =>
                      dispatch(
                        updateTicketType({
                          index,
                          field: 'quantity',
                          value:
                            e.target.value === ''
                              ? ''
                              : Math.max(0, Number(e.target.value)),
                        })
                      )
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter quantity or 0 to share remaining capacity"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter number of tickets for this type.
                    <br />
                    Leave as{' '}
                    <span className="font-semibold text-teal-700">0</span> to
                    share the remaining pool with other ticket types.
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                    <span className="text-xs text-gray-400 ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={
                      ticket.startDate ? ticket.startDate.slice(0, 10) : ''
                    }
                    onChange={(e) =>
                      dispatch(
                        updateTicketType({
                          index,
                          field: 'startDate',
                          value: e.target.value
                            ? new Date(
                                e.target.value + 'T00:00:00'
                              ).toISOString()
                            : null,
                        })
                      )
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When this ticket type becomes available (in{' '}
                    {formData.timeZone || 'event timezone'})
                  </p>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                    <span className="text-xs text-gray-400 ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="date"
                    value={
                      ticket.expiryDate ? ticket.expiryDate.slice(0, 10) : ''
                    }
                    onChange={(e) =>
                      dispatch(
                        updateTicketType({
                          index,
                          field: 'expiryDate',
                          value: e.target.value
                            ? new Date(
                                e.target.value + 'T23:59:59'
                              ).toISOString()
                            : null,
                        })
                      )
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When this ticket expires (end of day in{' '}
                    {formData.timeZone || 'event timezone'})
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {errors?.ticketTypes && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700 text-sm">
              {Array.isArray(errors.ticketTypes) ? (
                errors.ticketTypes.map((err, i) => <p key={i}>• {err}</p>)
              ) : (
                <p>• {errors.ticketTypes}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => dispatch(addTicketType())}
            className="inline-flex items-center px-4 py-2 border border-dashed border-teal-300 rounded-lg text-teal-600 hover:text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 font-medium"
          >
            {/* SVG ICON */}
            Add Another Ticket Type
          </button>
        </div>
      </div>
      {/* --- ADD BELOW --- */}
      <SeatingLayoutSection
        formData={formData}
        errors={errors}
        dispatch={dispatch}
      />
    </div>
  );
};

// Updated SeatingLayoutSection Component with Fixed UI Issues
const SeatingLayoutSection = ({ formData, errors, dispatch }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
          <svg
            className="w-5 h-5 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-medium text-gray-900">Seating Layout</h4>
          <p className="text-sm text-gray-500">
            Optional seating arrangement for your venue
          </p>
        </div>
      </div>

      {(formData.seatingLayout || []).length > 0 ? (
        <>
          <div className="mb-4">
            {/* Fixed container with proper overflow handling */}
            <div className="border border-gray-200 rounded-lg bg-gray-50">
              <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
                {(formData.seatingLayout || []).map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="bg-white rounded-lg border border-gray-200 shadow-sm"
                  >
                    {/* Full-width container for each row */}
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Row Label - Fixed Width */}
                        <div className="flex-shrink-0 w-20">
                          <label className="block text-xs font-medium text-gray-500 mb-2">
                            Row
                          </label>
                          <input
                            type="text"
                            value={row?.rowLabel || ''}
                            onChange={(e) =>
                              dispatch(
                                updateRowLabel({
                                  index: rowIndex,
                                  value: e.target.value,
                                })
                              )
                            }
                            className="w-full p-2 border border-gray-300 rounded text-center font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            maxLength="3"
                            placeholder="A"
                          />
                        </div>

                        {/* Seats Container - Flexible Width */}
                        <div className="flex-1 min-w-0">
                          <label className="block text-xs font-medium text-gray-500 mb-2">
                            Seats ({(row?.seats || []).length} total)
                          </label>
                          
                          {/* Horizontal scrollable seats container */}
                          <div className="overflow-x-auto border border-gray-200 rounded-md bg-gray-50 p-2">
                            <div className="flex gap-1 pb-1" style={{ minWidth: 'max-content' }}>
                              {(row?.seats || []).map((seat, seatIndex) => {
                                // Add visual separator every 10 seats
                                const showSeparator = seatIndex > 0 && (seatIndex) % 10 === 0;
                                
                                return (
                                  <div key={seatIndex} className="flex items-center">
                                    {showSeparator && (
                                      <div className="w-px h-6 bg-gray-300 mx-2 flex-shrink-0"></div>
                                    )}
                                    <div
                                      className="w-6 h-6 bg-teal-100 border border-teal-300 flex items-center justify-center rounded text-xs font-medium text-teal-700 flex-shrink-0 hover:bg-teal-200 transition-colors"
                                      title={`Row ${row.rowLabel || 'A'}, Seat ${
                                        seat?.seatNumber || seatIndex + 1
                                      }`}
                                    >
                                      {seat?.seatNumber || seatIndex + 1}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Seat count indicators */}
                          {(row?.seats || []).length > 20 && (
                            <div className="mt-1 text-xs text-gray-500 flex gap-4">
                              <span>1-10</span>
                              {(row?.seats || []).length > 10 && <span>11-20</span>}
                              {(row?.seats || []).length > 20 && (
                                <span>21-{(row?.seats || []).length}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Controls - Fixed Width */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-3">
                          {/* Seat Count Input */}
                          <div className="text-right">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Count
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={(row?.seats || []).length}
                              onChange={(e) =>
                                dispatch(
                                  updateSeatCount({
                                    rowIndex,
                                    count: Math.max(
                                      1,
                                      Math.min(100, parseInt(e.target.value) || 1)
                                    ),
                                  })
                                )
                              }
                              className="w-20 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => dispatch(removeSeatingRow(rowIndex))}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
                            title="Remove row"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between mt-4 px-2">
              <button
                type="button"
                onClick={() => dispatch(addSeatingRow())}
                className="inline-flex items-center px-4 py-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Row
              </button>

              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Total Seats:{' '}
                <span className="font-semibold text-gray-900">
                  {(formData.seatingLayout || []).reduce(
                    (total, row) => total + (row.seats?.length || 0),
                    0
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Organizer Reserved Seats */}
          {(formData.seatingLayout || []).length > 0 && (
            <div className="border-t border-gray-200 pt-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reserve Seats for Organizer
                <span className="text-xs text-gray-400 ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.organizerReservedSeats || ''}
                onChange={(e) =>
                  dispatch(
                    updateField({
                      field: 'organizerReservedSeats',
                      value: e.target.value,
                    })
                  )
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="e.g., A-2,A-4:A-6,B-1,C-3:C-5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify seats to reserve for the organizer. Use format: A-2,A-4:A-6,B-1 
                (individual seats or ranges with dashes and colons for sequences)
              </p>
            </div>
          )}

          {/* Seating Layout Image Upload */}
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seating Layout Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  dispatch(
                    updateField({
                      field: 'seatingLayoutImage',
                      value: e.target.files[0],
                    })
                  );
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a visual reference of your seating layout for attendees
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
            />
          </svg>
          <p className="text-gray-500 mb-4">No seating layout configured</p>
          <button
            type="button"
            onClick={() => dispatch(addSeatingRow())}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Seating Layout
          </button>
        </div>
      )}
    </div>
  );
};

// Custom Registration Fields Component
const CustomRegistrationFields = ({
  formData = {},
  errors = {},
  dispatch,
  isRecurring = false,
}) => {
  // Handle field options (for select/dropdown fields)
  const handleFieldOptionChange = (index, optionsStr) => {
    const options = optionsStr
      .split(',')
      .map((opt) => opt.trim())
      .filter(Boolean);
    dispatch(updateFieldOptions({ index, options }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
          <svg
            className="w-5 h-5 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-medium text-gray-900">
            Custom Registration Fields
          </h4>
          <p className="text-sm text-gray-500">
            Collect additional information from attendees during registration
            {isRecurring && (
              <span className="block text-blue-600 font-medium mt-1">
                These fields will be used for all instances of your recurring
                event
              </span>
            )}
          </p>
        </div>
      </div>

      {(formData.registrationFields || []).length > 0 ? (
        <div className="space-y-4 mb-6">
          {(formData.registrationFields || []).map((field, index) => (
            <div
              key={index}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-indigo-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {field?.fieldName || `Custom Field ${index + 1}`}
                    </h5>
                    <p className="text-sm text-gray-500 capitalize">
                      {field?.fieldType || 'text'} field
                      {field?.isRequired && (
                        <span className="text-red-500"> (Required)</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(removeRegistrationField(index))}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="Remove field"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    ></path>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Field Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field?.fieldName || ''}
                    onChange={(e) =>
                      dispatch(
                        updateRegistrationField({
                          index,
                          field: 'fieldName',
                          value: e.target.value,
                        })
                      )
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Dietary Requirements"
                    maxLength="100"
                  />
                </div>

                {/* Field Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Type
                  </label>
                  <select
                    value={field?.fieldType || 'text'}
                    onChange={(e) =>
                      dispatch(
                        updateRegistrationField({
                          index,
                          field: 'fieldType',
                          value: e.target.value,
                        })
                      )
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Number Input</option>
                    <option value="select">Dropdown Select</option>
                    <option value="date">Date Picker</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </div>

                {/* Field Options (only for select/dropdown type) */}
                {(field?.fieldType || 'text') === 'select' && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dropdown Options <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={(field?.fieldOptions || []).join(', ')}
                      onChange={(e) =>
                        handleFieldOptionChange(index, e.target.value)
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Option 1, Option 2, Option 3"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate options with commas (e.g., "Vegetarian, Vegan,
                      Gluten-free, No restrictions")
                    </p>
                  </div>
                )}

                {/* Required Field Toggle */}
                <div className="lg:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field?.isRequired || false}
                      onChange={(e) =>
                        dispatch(
                          updateRegistrationField({
                            index,
                            field: 'isRequired',
                            value: e.target.checked,
                          })
                        )
                      }
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label
                      htmlFor={`required-${index}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      Make this field required for registration
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mb-6">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 mb-4">
            No custom registration fields yet
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Create custom fields to collect specific information from your
            attendees
          </p>
        </div>
      )}

      {errors?.registrationFields && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-sm">
            {Array.isArray(errors.registrationFields) ? (
              errors.registrationFields.map((err, i) => <p key={i}>• {err}</p>)
            ) : (
              <p>• {errors.registrationFields}</p>
            )}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => dispatch(addRegistrationField())}
          className="inline-flex items-center px-4 py-2 border border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 font-medium"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            ></path>
          </svg>
          Add Custom Registration Field
        </button>
      </div>
    </div>
  );
};

// Main TicketConfigStep Component
const TicketConfigStep = ({ formData = {}, errors = {} }) => {
  const dispatch = useDispatch();
  const isRecurringEvent = formData.recurrence?.isRecurring || false;

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {formData.isPaid
            ? 'Paid Event Configuration'
            : 'Free Event Configuration'}
        </h2>
        <p className="text-gray-600">
          {formData.isPaid
            ? 'Set up ticket pricing, seating, and payment processing for your event'
            : 'Configure registration settings and collect attendee information'}
        </p>

        {/* Event Type & Recurring Badges */}
        <div className="flex items-center justify-center space-x-2 mt-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              formData.isPaid
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {formData.isPaid ? 'Paid Event' : 'Free Event'}
          </span>
          {isRecurringEvent && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Recurring Event
            </span>
          )}
        </div>
      </div>

      {/* Conditional Content Based on Event Type */}
      {formData.isPaid ? (
        <PaidEventConfig
          formData={formData}
          errors={errors}
          dispatch={dispatch}
        />
      ) : (
        <FreeEventConfig
          formData={formData}
          errors={errors}
          dispatch={dispatch}
        />
      )}

      {/* Configuration Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          Configuration Summary
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {formData.isPaid ? (
            <>
              <div>
                <span className="text-gray-500">Ticket Types:</span>
                <span className="ml-2 font-medium">
                  {(formData.ticketTypes || []).length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Seating Layout:</span>
                <span className="ml-2 font-medium">
                  {(formData.seatingLayout || []).length > 0
                    ? 'Configured'
                    : 'Not set'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-gray-500">Capacity:</span>
                <span className="ml-2 font-medium">
                  {(formData.capacity || 0) === 0
                    ? 'Unlimited'
                    : formData.capacity}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Max Per Registration:</span>
                <span className="ml-2 font-medium">
                  {formData.maxAttendeesPerRegistration || 5}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Event Type:</span>
                <span className="ml-2 font-medium">Free Registration</span>
              </div>
            </>
          )}
          <div>
            <span className="text-gray-500">Custom Fields:</span>
            <span className="ml-2 font-medium">
              {(formData.registrationFields || []).length}
            </span>
          </div>
          {isRecurringEvent && (
            <div className="md:col-span-2 lg:col-span-3">
              <span className="text-gray-500">Recurring Schedule:</span>
              <span className="ml-2 font-medium text-purple-600">
                {(formData.recurrence?.repeatSchedule || []).length} scheduled
                occurrences
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketConfigStep;

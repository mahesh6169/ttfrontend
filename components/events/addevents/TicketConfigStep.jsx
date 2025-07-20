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
  updateGstIncluded,
} from '@/store/slices/events/eventSlice';
import SeatingLayoutSection from './SeatingLayoutSection';

// Free Event Configuration Component
const FreeEventConfig = ({ formData = {}, errors = {}, dispatch }) => {
  const isRecurringEvent = formData.recurrence?.isRecurring || false;

  return (
    <div className="space-y-6">
      {/* Header with recurring event info */}
      <div className="flex items-start justify-between">
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

          {/* Maximum Attendees per Booking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Attendees per Booking
            </label>
            <input
              type="number"
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
                    value: val, // Allow empty while typing
                  })
                );
              }}
              onBlur={(e) => {
                if (e.target.value === '' || Number(e.target.value) < 1) {
                  dispatch(
                    updateField({
                      field: 'maxAttendeesPerRegistration',
                      value: 10, // Default to 10
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
              Limit how many people can register together in one booking
            </p>
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

  return (
    <div className="space-y-6">
      {/* Header with recurring event info */}
      <div className="flex items-start justify-between">
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
            </div>
            {errors?.capacity && (
              <p className="mt-1 text-red-500 text-sm">{errors.capacity}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Set the maximum number of people who can attend this event.<br/>
              Set to 0 for unlimited capacity.
            </p>
          </div>

          {/* Maximum Attendees per Booking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Attendees per Booking
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={
                formData.maxAttendeesPerRegistration === undefined ||
                formData.maxAttendeesPerRegistration === null ||
                formData.maxAttendeesPerRegistration === ''
                  ? ''
                  : formData.maxAttendeesPerRegistration
              }
              onChange={(e) => {
                const val = e.target.value;
                dispatch(
                  updateField({
                    field: 'maxAttendeesPerRegistration',
                    value: val, // Allow empty while typing
                  })
                );
              }}
              onBlur={(e) => {
                if (e.target.value === '' || Number(e.target.value) < 1) {
                  dispatch(
                    updateField({
                      field: 'maxAttendeesPerRegistration',
                      value: 10, // Default to 10
                    })
                  );
                }
              }}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors?.maxAttendeesPerRegistration
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Enter minimum 1"
            />

            {errors?.maxAttendeesPerRegistration && (
              <p className="mt-1 text-red-500 text-sm">
                {errors.maxAttendeesPerRegistration}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Limit how many people can register together in one booking.
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Types */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                />
              </svg>
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
        </div>

        {/* Ticket Types List */}

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
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors?.[`ticketName_${index}`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    maxLength="100"
                    required
                  />
                  {errors?.[`ticketName_${index}`] && (
                    <p className="mt-1 text-red-500 text-sm">
                      {errors[`ticketName_${index}`][0]}
                    </p>
                  )}
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
                      className={`w-full pl-8 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors?.[`ticketPrice_${index}`]
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  {errors?.[`ticketPrice_${index}`] && (
                    <p className="mt-1 text-red-500 text-sm">
                      {errors[`ticketPrice_${index}`][0]}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Ticket price must be{' '}
                    <span className="font-medium text-teal-700">
                      greater than 0
                    </span>{' '}
                    (no free tickets).
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
                      ticket.startDate
                        ? typeof ticket.startDate === 'string' &&
                          ticket.startDate.includes('T')
                          ? ticket.startDate.slice(0, 10)
                          : ticket.startDate
                        : ''
                    }
                    onChange={(e) =>
                      dispatch(
                        updateTicketType({
                          index,
                          field: 'startDate',
                          value: e.target.value || null,
                        })
                      )
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors?.[`ticketStartDate_${index}`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors?.[`ticketStartDate_${index}`] && (
                    <p className="mt-1 text-red-500 text-sm">
                      {errors[`ticketStartDate_${index}`][0]}
                    </p>
                  )}
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
                      ticket.expiryDate
                        ? typeof ticket.expiryDate === 'string' &&
                          ticket.expiryDate.includes('T')
                          ? ticket.expiryDate.slice(0, 10)
                          : ticket.expiryDate
                        : ''
                    }
                    onChange={(e) =>
                      dispatch(
                        updateTicketType({
                          index,
                          field: 'expiryDate',
                          value: e.target.value || null,
                        })
                      )
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors?.[`ticketExpiryDate_${index}`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors?.[`ticketExpiryDate_${index}`] && (
                    <p className="mt-1 text-red-500 text-sm">
                      {errors[`ticketExpiryDate_${index}`][0]}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    When this ticket expires (end of day in{' '}
                    {formData.timeZone || 'event timezone'})
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => dispatch(addTicketType())}
            className="inline-flex items-center px-4 py-2 border border-dashed border-teal-300 rounded-lg text-teal-600 hover:text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 font-medium"
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
            Add Another Ticket Type
          </button>
        </div>
      </div>

      {/* GST Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              GST Configuration
            </h4>

          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="gstIncluded"
              checked={formData.gstIncluded || false}
              onChange={(e) => dispatch(updateGstIncluded(e.target.checked))}
              className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <div className="flex-1">
              <label
                htmlFor="gstIncluded"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                Ticket prices include GST
              </label>
              <p className="text-sm text-gray-900 mt-1">
                Specify whether your ticket prices include GST for display purposes
              </p>

              {/* GST Display Preview */}
              <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Price Display Preview:
                </p>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-900">
                    {formData.gstIncluded ? (
                      <span className="font-medium">
                        $100 <span className="text-gray-600">(incl GST)</span>
                      </span>
                    ) : (
                      <span className="font-medium">$100</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
            Attendee Additional Information
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

                {/* Required Field Toggle + Delete Button */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
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
    </div>
  );
};

export default TicketConfigStep;

// components/events/addevents/TicketConfigStep.jsx

import React, { useState } from 'react';
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

      {/* Capacity Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
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
          <div className="flex-1 min-w-0">
            <h4 className="text-base sm:text-lg font-medium text-gray-900">
              Capacity Management
            </h4>
            <p className="text-xs sm:text-sm text-gray-500">
              Control attendance limits
            </p>
          </div>
        </div>

        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          {/* Event Capacity */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Event Capacity
            </label>
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
              className={`w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors?.capacity ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0 for unlimited"
            />
            {errors?.capacity && (
              <p className="mt-1 text-red-500 text-xs sm:text-sm">{errors.capacity}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              0 = unlimited capacity
            </p>
          </div>

          {/* Maximum Attendees per Booking */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Max per Booking
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
                    value: val,
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
              className={`w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors?.maxAttendeesPerRegistration
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Min 1"
            />
            {errors?.maxAttendeesPerRegistration && (
              <p className="mt-1 text-red-500 text-xs sm:text-sm">
                {errors.maxAttendeesPerRegistration}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Per booking limit
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
  const [priceErrors, setPriceErrors] = useState({});

  // Decimal validation function
  const validatePriceDecimals = (value) => {
    if (!value || value === '') return true;
    const strValue = value.toString();
    const decimalIndex = strValue.indexOf('.');
    if (decimalIndex === -1) return true;
    const decimals = strValue.length - decimalIndex - 1;
    return decimals <= 2;
  };

  return (
    <div className="space-y-6">

      {/* Capacity Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
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
          <div className="flex-1 min-w-0">
            <h4 className="text-base sm:text-lg font-medium text-gray-900">
              Capacity Management
            </h4>
            <p className="text-xs sm:text-sm text-gray-500">
              Control attendance limits
            </p>
          </div>
        </div>

        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          {/* Total Capacity */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Total Capacity
            </label>
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
                dispatch(
                  updateField({
                    field: 'capacity',
                    value: val,
                  })
                );
              }}
              onWheel={(e) => e.target.blur()}
              placeholder="0 for unlimited"
              className={`w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors?.capacity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors?.capacity && (
              <p className="mt-1 text-red-500 text-xs sm:text-sm">{errors.capacity}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              0 = unlimited capacity
            </p>
          </div>

          {/* Maximum Attendees per Booking */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              Max per Booking
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
                    value: val,
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
              className={`w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                errors?.maxAttendeesPerRegistration
                  ? 'border-red-500'
                  : 'border-gray-300'
              }`}
              placeholder="Min 1"
            />
            {errors?.maxAttendeesPerRegistration && (
              <p className="mt-1 text-red-500 text-xs sm:text-sm">
                {errors.maxAttendeesPerRegistration}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Per booking limit
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Types */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
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
            <div className="flex-1 min-w-0">
              <h4 className="text-base sm:text-lg font-medium text-gray-900">
                Ticket Types
              </h4>
              <p className="text-xs sm:text-sm text-gray-500">
                Set pricing tiers
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Types List */}

        <div className="space-y-3">
          {(formData.ticketTypes || []).map((ticket, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors bg-gray-50"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-teal-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-medium text-teal-600">
                      {index + 1}
                    </span>
                  </div>
                  <h5 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                    {ticket?.name || `Ticket ${index + 1}`}
                  </h5>
                </div>

                {(formData.ticketTypes || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch(removeTicketType(index))}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                    title="Remove"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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

              <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
                {/* Ticket Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
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
                    placeholder="Early Bird"
                    className={`w-full p-2 sm:p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors?.[`ticketName_${index}`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    maxLength="100"
                    required
                  />
                  {errors?.[`ticketName_${index}`] && (
                    <p className="mt-0.5 text-red-500 text-xs">
                      {errors[`ticketName_${index}`][0]}
                    </p>
                  )}
                </div>

                {/* Ticket Price */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      ticket.price === undefined || ticket.price === null
                        ? ''
                        : ticket.price
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      
                      // Validate decimal places
                      if (!validatePriceDecimals(val)) {
                        setPriceErrors({
                          ...priceErrors,
                          [index]: 'Maximum 2 decimal places allowed'
                        });
                      } else {
                        // Clear error for this index
                        const newErrors = { ...priceErrors };
                        delete newErrors[index];
                        setPriceErrors(newErrors);
                      }
                      
                      dispatch(
                        updateTicketType({
                          index,
                          field: 'price',
                          value: val,
                        })
                      );
                    }}
                    onWheel={(e) => e.target.blur()}
                    className={`w-full p-2 sm:p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors?.[`ticketPrice_${index}`] || priceErrors[index]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    required
                  />
                  {errors?.[`ticketPrice_${index}`] && (
                    <p className="mt-0.5 text-red-500 text-xs">
                      {errors[`ticketPrice_${index}`][0]}
                    </p>
                  )}
                  {priceErrors[index] && (
                    <p className="mt-0.5 text-red-500 text-xs">
                      {priceErrors[index]}
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Start Date
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
                    onWheel={(e) => e.target.blur()}
                    className={`w-full p-2 sm:p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors?.[`ticketStartDate_${index}`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors?.[`ticketStartDate_${index}`] && (
                    <p className="mt-0.5 text-red-500 text-xs">
                      {errors[`ticketStartDate_${index}`][0]}
                    </p>
                  )}
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
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
                    onWheel={(e) => e.target.blur()}
                    className={`w-full p-2 sm:p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors?.[`ticketExpiryDate_${index}`]
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {errors?.[`ticketExpiryDate_${index}`] && (
                    <p className="mt-0.5 text-red-500 text-xs">
                      {errors[`ticketExpiryDate_${index}`][0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => dispatch(addTicketType())}
          className="w-full sm:w-auto mt-3 inline-flex items-center justify-center px-3 py-2 text-sm border border-dashed border-teal-300 rounded-lg text-teal-600 hover:text-teal-700 hover:border-teal-400 hover:bg-teal-50 transition-all duration-200 font-medium"
        >
          <svg
            className="w-4 h-4 mr-1.5"
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
          Add Ticket Type
        </button>
      </div>

      {/* Attendee Additional Information */}
      <CustomRegistrationFields
        formData={formData}
        errors={errors}
        dispatch={dispatch}
        isRecurring={isRecurringEvent}
      />

      {/* GST Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="flex items-center mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600"
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
          <div className="flex-1 min-w-0">
            <h4 className="text-base sm:text-lg font-medium text-gray-900">
              GST Configuration
            </h4>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="gstIncluded"
              checked={formData.gstIncluded || false}
              onChange={(e) => dispatch(updateGstIncluded(e.target.checked))}
              className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <div className="flex-1">
              <label
                htmlFor="gstIncluded"
                className="block text-sm font-medium text-gray-900 cursor-pointer"
              >
                Prices include GST
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Check if your ticket prices already include GST
              </p>
            </div>
          </div>

          {/* GST Display Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Price display:
            </p>
            <div className="text-sm font-medium">
              {formData.gstIncluded ? (
                <>$100 <span className="text-gray-500 font-normal">(incl GST)</span></>
              ) : (
                '$100'
              )}
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

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600"
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
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-medium text-gray-900">
            Additional Questions
          </h4>
          <p className="text-xs sm:text-sm text-gray-500">
            Collect extra info from attendees
            {isRecurring && (
              <span className="block text-blue-600 text-xs font-medium mt-0.5">
                Applied to all recurring instances
              </span>
            )}
          </p>
        </div>
      </div>

      {(formData.registrationFields || []).length > 0 ? (
        <div className="space-y-3 mb-4">
          {(formData.registrationFields || []).map((field, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors bg-gray-50"
            >
              <div className="space-y-3">
                {/* Field Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Question <span className="text-red-500">*</span>
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
                    className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Dietary Requirements"
                    maxLength="100"
                  />
                </div>

                {/* Required Field Toggle + Delete Button */}
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
                      className="ml-2 text-xs sm:text-sm text-gray-700"
                    >
                      Required field
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch(removeRegistrationField(index))}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                    title="Remove"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {errors?.registrationFields && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-xs sm:text-sm">
            {Array.isArray(errors.registrationFields) ? (
              errors.registrationFields.map((err, i) => <p key={i}>• {err}</p>)
            ) : (
              <p>• {errors.registrationFields}</p>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => dispatch(addRegistrationField())}
        className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 text-sm border border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 font-medium"
      >
        <svg
          className="w-4 h-4 mr-1.5"
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
        Add Question
      </button>
    </div>
  );
};

// Main TicketConfigStep Component
const TicketConfigStep = ({ formData = {}, errors = {} }) => {
  const dispatch = useDispatch();
  const isRecurringEvent = formData.recurrence?.isRecurring || false;

  return (
    <div className="space-y-6">

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

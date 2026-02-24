// components/events/addevents/RegistrationStep.jsx
// Step 3: Registration - Intent selection + registration/ticket configuration

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  updateField,
  setExternalTicketUrl,
  addTicketType,
  updateTicketType,
  removeTicketType,
  addSeatingRow,
  updateRowLabel,
  updateSeatCount,
  removeSeatingRow,
  addRegistrationField,
  updateRegistrationField,
  removeRegistrationField,
  updateGstIncluded,
  setFormErrors,
} from '@/store/slices/events/eventSlice';
import SeatingLayoutSection from './SeatingLayoutSection';

// Promotional Event Configuration
const PromotionalConfig = ({ formData, disabled, dispatch, errors }) => {
  // For promotional events, isPaid indicates if promoting a paid event
  // null/undefined = not selected, false = free, true = paid
  const isPaidSelected = formData.isPaid === true;
  const isFreeSelected = formData.isPaid === false;
  const hasSelection = formData.isPaid !== null && formData.isPaid !== undefined;

  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Event Type</h3>
        <p className="text-sm text-gray-500 mt-1">Is this a free or paid event?</p>
      </div>

      {/* Free/Paid Selection */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => !disabled && dispatch(updateField({ field: 'isPaid', value: false }))}
          disabled={disabled}
          className={`flex-1 p-4 border-2 rounded-xl text-center transition-all duration-200 ${
            isFreeSelected
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-green-300'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="w-10 h-10 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className={`font-medium ${isFreeSelected ? 'text-green-700' : 'text-gray-700'}`}>
            Free Event
          </span>
        </button>

        <button
          type="button"
          onClick={() => !disabled && dispatch(updateField({ field: 'isPaid', value: true }))}
          disabled={disabled}
          className={`flex-1 p-4 border-2 rounded-xl text-center transition-all duration-200 ${
            isPaidSelected
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-blue-300'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <span className={`font-medium ${isPaidSelected ? 'text-blue-700' : 'text-gray-700'}`}>
            Paid Event
          </span>
        </button>
      </div>

      {errors?.isPaid && (
        <p className="text-red-500 text-sm">
          {Array.isArray(errors.isPaid) ? errors.isPaid[0] : errors.isPaid}
        </p>
      )}

      {/* External Ticket URL */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          External Registration/Ticket Link
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="url"
          value={formData.externalTicketUrl || ''}
          onChange={(e) => dispatch(setExternalTicketUrl(e.target.value))}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="https://eventbrite.com/your-event or https://yourwebsite.com/register"
        />
        <p className="text-xs text-gray-500">
          Provide a link where attendees can register or purchase tickets for your event
        </p>
        {errors?.externalTicketUrl && (
          <p className="text-red-500 text-sm">
            {Array.isArray(errors.externalTicketUrl) ? errors.externalTicketUrl[0] : errors.externalTicketUrl}
          </p>
        )}
      </div>

      {/* Promotional Summary */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-purple-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-purple-800 font-medium">Promotional Event</p>
            <p className="text-xs text-purple-700 mt-1">
              Your event will be listed for visibility. Attendees will see your event details
              {formData.externalTicketUrl ? ' and can click through to your external registration link' : ''}.
              Registration and check-in features are not available for promotional events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Capacity Management Section (shared between free and paid)
const CapacityManagement = ({ formData, errors, dispatch, isPaid }) => {
  const [bookingLimitError, setBookingLimitError] = useState('');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-medium text-gray-900">Capacity Management</h4>
          <p className="text-xs sm:text-sm text-gray-500">Set capacity and booking limits</p>
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
              dispatch(updateField({
                field: 'capacity',
                value: val === '' ? '' : Math.max(0, Number(val) || 0),
              }));
              if (errors?.capacity) {
                const newErrors = { ...errors };
                delete newErrors.capacity;
                dispatch(setFormErrors(newErrors));
              }
            }}
            onWheel={(e) => e.target.blur()}
            className={`w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
              errors?.capacity ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter a number (0 or above)"
          />
          {errors?.capacity && (
            <p className="mt-1 text-red-500 text-xs sm:text-sm">{errors.capacity}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">0 = unlimited capacity</p>
        </div>

        {/* Booking Limit */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Booking Limit
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={formData.maxAttendeesPerRegistration === '' ? '' : formData.maxAttendeesPerRegistration}
            onChange={(e) => {
              const val = e.target.value;
              const numVal = Number(val);
              if (val !== '' && numVal === 0) {
                setBookingLimitError('Booking limit must be 1 or above');
              } else if (val !== '' && numVal < 0) {
                setBookingLimitError('Booking limit cannot be negative');
              } else {
                setBookingLimitError('');
              }
              dispatch(updateField({ field: 'maxAttendeesPerRegistration', value: val }));
              if (errors?.maxAttendeesPerRegistration) {
                const newErrors = { ...errors };
                delete newErrors.maxAttendeesPerRegistration;
                dispatch(setFormErrors(newErrors));
              }
            }}
            onWheel={(e) => e.target.blur()}
            className={`w-full p-2.5 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
              errors?.maxAttendeesPerRegistration || bookingLimitError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter a number (1 or above)"
          />
          {errors?.maxAttendeesPerRegistration && (
            <p className="mt-1 text-red-500 text-xs sm:text-sm">{errors.maxAttendeesPerRegistration}</p>
          )}
          {!errors?.maxAttendeesPerRegistration && bookingLimitError && (
            <p className="mt-1 text-red-500 text-xs sm:text-sm">{bookingLimitError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Maximum seats per order</p>
        </div>
      </div>
    </div>
  );
};

// Custom Registration Fields
const CustomRegistrationFields = ({ formData, errors, dispatch, isRecurring = false }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-medium text-gray-900">Attendee Information</h4>
          <p className="text-xs sm:text-sm text-gray-500">
            Collect additional information from attendees when they book (e.g. diet).
            <span className="block text-xs mt-0.5" style={{ color: '#800000' }}>
              <strong>Name</strong> and <strong>Mobile</strong> are collected by default
            </span>
            {isRecurring && (
              <span className="block text-blue-600 text-xs font-medium mt-0.5">
                Applied to all recurring instances
              </span>
            )}
          </p>
        </div>
      </div>

      {(formData.registrationFields || []).length > 0 && (
        <div className="space-y-3 mb-4">
          {(formData.registrationFields || []).map((field, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors bg-gray-50">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={field?.fieldName || ''}
                    onChange={(e) => dispatch(updateRegistrationField({ index, field: 'fieldName', value: e.target.value }))}
                    className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Dietary Requirements"
                    maxLength="100"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field?.isRequired || false}
                      onChange={(e) => dispatch(updateRegistrationField({ index, field: 'isRequired', value: e.target.checked }))}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor={`required-${index}`} className="ml-2 text-xs sm:text-sm text-gray-700">
                      Required field
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => dispatch(removeRegistrationField(index))}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Add Question
      </button>
    </div>
  );
};

// Ticket Types Section (for paid events)
const TicketTypesSection = ({ formData, errors, dispatch }) => {
  const [priceErrors, setPriceErrors] = useState({});

  const validatePriceDecimals = (value) => {
    if (!value || value === '') return true;
    const strValue = value.toString();
    const decimalIndex = strValue.indexOf('.');
    if (decimalIndex === -1) return true;
    return strValue.length - decimalIndex - 1 <= 2;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base sm:text-lg font-medium text-gray-900">Ticket Types</h4>
            <p className="text-xs sm:text-sm text-gray-500">Set pricing tiers</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {(formData.ticketTypes || []).map((ticket, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-teal-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-teal-600">{index + 1}</span>
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
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                  onChange={(e) => {
                    dispatch(updateTicketType({ index, field: 'name', value: e.target.value }));
                    if (errors?.[`ticketName_${index}`]) {
                      const newErrors = { ...errors };
                      delete newErrors[`ticketName_${index}`];
                      dispatch(setFormErrors(newErrors));
                    }
                  }}
                  placeholder="Early Bird"
                  className={`w-full p-2 sm:p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors?.[`ticketName_${index}`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  maxLength="100"
                />
                {errors?.[`ticketName_${index}`] && (
                  <p className="mt-0.5 text-red-500 text-xs">{errors[`ticketName_${index}`][0]}</p>
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
                  value={ticket.price === undefined || ticket.price === null ? '' : ticket.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!validatePriceDecimals(val)) {
                      setPriceErrors({ ...priceErrors, [index]: 'Maximum 2 decimal places allowed' });
                    } else {
                      const newErrors = { ...priceErrors };
                      delete newErrors[index];
                      setPriceErrors(newErrors);
                    }
                    dispatch(updateTicketType({ index, field: 'price', value: val }));
                    if (errors?.[`ticketPrice_${index}`]) {
                      const newErrors = { ...errors };
                      delete newErrors[`ticketPrice_${index}`];
                      dispatch(setFormErrors(newErrors));
                    }
                  }}
                  onWheel={(e) => e.target.blur()}
                  className={`w-full p-2 sm:p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors?.[`ticketPrice_${index}`] || priceErrors[index] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors?.[`ticketPrice_${index}`] && (
                  <p className="mt-0.5 text-red-500 text-xs">{errors[`ticketPrice_${index}`][0]}</p>
                )}
                {priceErrors[index] && (
                  <p className="mt-0.5 text-red-500 text-xs">{priceErrors[index]}</p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={ticket.startDate ? (ticket.startDate.includes('T') ? ticket.startDate.slice(0, 10) : ticket.startDate) : ''}
                  onChange={(e) => dispatch(updateTicketType({ index, field: 'startDate', value: e.target.value || null }))}
                  onWheel={(e) => e.target.blur()}
                  className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={ticket.expiryDate ? (ticket.expiryDate.includes('T') ? ticket.expiryDate.slice(0, 10) : ticket.expiryDate) : ''}
                  onChange={(e) => dispatch(updateTicketType({ index, field: 'expiryDate', value: e.target.value || null }))}
                  onWheel={(e) => e.target.blur()}
                  className="w-full p-2 sm:p-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
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
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Ticket Type
      </button>
    </div>
  );
};

// GST Configuration
const GSTConfiguration = ({ formData, dispatch }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
      <div className="flex items-center mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h4 className="text-base sm:text-lg font-medium text-gray-900">GST Display</h4>
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
            <label htmlFor="gstIncluded" className="block text-sm font-medium text-gray-900 cursor-pointer">
              Show prices as GST-inclusive
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Check this if your ticket prices already include GST. The displayed price will show 'incl. GST'.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Price display:</p>
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
  );
};

// Main RegistrationStep Component
const RegistrationStep = ({
  formData = {},
  errors = {},
  mode = 'add',
  readOnly = false,
  onSeatingImagesChange
}) => {
  const dispatch = useDispatch();
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const disabled = readOnly || isViewMode;

  const isRecurringEvent = formData.recurrence?.isRecurring || false;
  const isPromotionalEvent = formData.eventIntent === 'promote';
  const isHostEvent = formData.eventIntent === 'host';
  const isPaidEvent = formData.isPaid || false;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Registration & Tickets</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isPromotionalEvent
            ? 'Configure your promotional event listing'
            : 'Configure how attendees will register for your event'
          }
        </p>
      </div>

      {/* Promotional Event Configuration */}
      {isPromotionalEvent && (
        <PromotionalConfig
          formData={formData}
          disabled={disabled}
          dispatch={dispatch}
          errors={errors}
        />
      )}

      {/* Host Event Configuration */}
      {isHostEvent && (
        <>
          {/* Configuration based on Free/Paid */}
          <div className="space-y-6">
            {/* Capacity Management */}
            <CapacityManagement
              formData={formData}
              errors={errors}
              dispatch={dispatch}
              isPaid={isPaidEvent}
            />

            {/* Ticket Types (Paid Only) */}
            {isPaidEvent && (
              <TicketTypesSection
                formData={formData}
                errors={errors}
                dispatch={dispatch}
              />
            )}

            {/* Custom Registration Fields */}
            <CustomRegistrationFields
              formData={formData}
              errors={errors}
              dispatch={dispatch}
              isRecurring={isRecurringEvent}
            />

            {/* GST Configuration (Paid Only) */}
            {isPaidEvent && (
              <GSTConfiguration
                formData={formData}
                dispatch={dispatch}
              />
            )}

            {/* Seating Layout (Paid Only) */}
            {isPaidEvent && (
              <SeatingLayoutSection
                formData={formData}
                errors={errors}
                dispatch={dispatch}
                isEditMode={isEditMode}
                onSeatingImagesChange={onSeatingImagesChange}
              />
            )}
          </div>
        </>
      )}

      {/* No Intent Selected - Should not happen since intent is in Step 1 */}
      {!formData.eventIntent && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-amber-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-amber-700 font-medium">Event type not selected</p>
          <p className="text-amber-600 text-sm mt-1">Please go back to Step 1 and select whether you want to promote or host this event.</p>
        </div>
      )}
    </div>
  );
};

export default RegistrationStep;

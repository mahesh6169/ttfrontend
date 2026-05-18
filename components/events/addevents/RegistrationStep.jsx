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
  const isPaidSelected = formData.isPaid === true;
  const isFreeSelected = formData.isPaid === false;

  return (
    <div className="space-y-4">
      {/* Free/Paid Selection */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
          Event Type <span className="text-red-500">*</span>
        </label>
        <div className={`inline-grid grid-cols-2 gap-2 ${disabled ? 'opacity-60' : ''}`}>
          <button
            type="button"
            onClick={() => !disabled && dispatch(updateField({ field: 'isPaid', value: false }))}
            disabled={disabled}
            className={`py-2 px-6 text-sm sm:text-base rounded-lg border transition-colors ${
              isFreeSelected
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-300'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            RSVP
          </button>
          <button
            type="button"
            onClick={() => !disabled && dispatch(updateField({ field: 'isPaid', value: true }))}
            disabled={disabled}
            className={`py-2 px-6 text-sm sm:text-base rounded-lg border transition-colors ${
              isPaidSelected
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-300'
            } ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            Paid
          </button>
        </div>
        {errors?.isPaid && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">
            {Array.isArray(errors.isPaid) ? errors.isPaid[0] : errors.isPaid}
          </p>
        )}
      </div>

      {/* External Ticket URL */}
      <div>
        <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
          External Registration Link
          <span className="text-slate-400 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="url"
          value={formData.externalTicketUrl || ''}
          onChange={(e) => dispatch(setExternalTicketUrl(e.target.value))}
          disabled={disabled}
          className="w-full p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:bg-slate-100 disabled:cursor-not-allowed"
          placeholder="https://eventbrite.com/your-event"
        />
        <p className="text-xs text-slate-500 mt-1">
          Link where attendees can register or purchase tickets
        </p>
        {errors?.externalTicketUrl && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">
            {Array.isArray(errors.externalTicketUrl) ? errors.externalTicketUrl[0] : errors.externalTicketUrl}
          </p>
        )}
      </div>

      {/* Promotional Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-sm text-slate-700">
          <span className="font-medium">Promotional Event:</span> Listed for visibility only. Registration and check-in features are not available.
        </p>
      </div>
    </div>
  );
};

// Capacity Management Section (shared between free and paid)
const CapacityManagement = ({ formData, errors, dispatch, isPaid }) => {
  const [bookingLimitError, setBookingLimitError] = useState('');

  const getInputClasses = (hasError) => {
    const base = 'w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2';
    return `${base} ${hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'}`;
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Event Capacity */}
        <div>
          <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
            Capacity
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
            className={getInputClasses(!!errors?.capacity)}
            placeholder="0 = unlimited"
          />
          {errors?.capacity && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.capacity}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">0 = unlimited capacity</p>
        </div>

        {/* Booking Limit */}
        <div>
          <label className="block font-semibold sm:font-bold mb-2 text-slate-700 text-sm sm:text-base">
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
                setBookingLimitError('Must be 1 or above');
              } else if (val !== '' && numVal < 0) {
                setBookingLimitError('Cannot be negative');
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
            className={getInputClasses(!!errors?.maxAttendeesPerRegistration || !!bookingLimitError)}
            placeholder="Max per order"
          />
          {errors?.maxAttendeesPerRegistration && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.maxAttendeesPerRegistration}</p>
          )}
          {!errors?.maxAttendeesPerRegistration && bookingLimitError && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{bookingLimitError}</p>
          )}
          <p className="text-xs text-slate-500 mt-1">Maximum seats per order</p>
        </div>
      </div>
    </div>
  );
};

// Custom Registration Fields
const CustomRegistrationFields = ({ formData, errors, dispatch, isRecurring = false }) => {
  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-1 text-slate-700">
        Attendee Information
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Collect additional info (Name & Mobile are collected by default)
      </p>

      {(formData.registrationFields || []).length > 0 && (
        <div className="space-y-3 mb-4">
          {(formData.registrationFields || []).map((field, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-3">
              <div className="flex gap-3 items-start">
                <input
                  type="text"
                  value={field?.fieldName || ''}
                  onChange={(e) => dispatch(updateRegistrationField({ index, field: 'fieldName', value: e.target.value }))}
                  className="flex-1 p-3 sm:p-2 text-base sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
                  placeholder="e.g., Dietary Requirements"
                  maxLength="100"
                />
                <button
                  type="button"
                  onClick={() => dispatch(removeRegistrationField(index))}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  checked={field?.isRequired || false}
                  onChange={(e) => dispatch(updateRegistrationField({ index, field: 'isRequired', value: e.target.checked }))}
                  className="w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-300"
                />
                <label htmlFor={`required-${index}`} className="ml-2 text-sm text-slate-600">
                  Required
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors?.registrationFields && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-xs sm:text-sm">
            {Array.isArray(errors.registrationFields) ? errors.registrationFields[0] : errors.registrationFields}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => dispatch(addRegistrationField())}
        className="inline-flex items-center px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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

  const getInputClasses = (hasError) => {
    const base = 'w-full p-3 sm:p-2 text-base sm:text-sm text-slate-700 border rounded-lg focus:outline-none focus:ring-2';
    return `${base} ${hasError ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300'}`;
  };

  return (
    <div className="border-t border-slate-200 pt-6 mt-6">
      <h3 className="font-semibold sm:font-bold text-base sm:text-lg mb-1 text-slate-700">
        Ticket Types
      </h3>
      <p className="text-xs text-slate-500 mb-4">Define pricing tiers for your event</p>

      {(formData.ticketTypes || []).length > 0 && (
        <div className="space-y-3 mb-4">
          {(formData.ticketTypes || []).map((ticket, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-slate-700">
                  Ticket {index + 1}{ticket?.name ? `: ${ticket.name}` : ''}
                </span>
                {(formData.ticketTypes || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch(removeTicketType(index))}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ticket Name */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
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
                    className={getInputClasses(!!errors?.[`ticketName_${index}`])}
                    maxLength="100"
                  />
                  {errors?.[`ticketName_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`ticketName_${index}`][0]}</p>
                  )}
                </div>

                {/* Ticket Price */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
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
                    className={getInputClasses(!!errors?.[`ticketPrice_${index}`] || !!priceErrors[index])}
                    placeholder="0.00"
                  />
                  {errors?.[`ticketPrice_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`ticketPrice_${index}`][0]}</p>
                  )}
                  {priceErrors[index] && (
                    <p className="text-red-500 text-xs mt-1">{priceErrors[index]}</p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={ticket.startDate ? (ticket.startDate.includes('T') ? ticket.startDate.slice(0, 10) : ticket.startDate) : ''}
                    onChange={(e) => dispatch(updateTicketType({ index, field: 'startDate', value: e.target.value || null }))}
                    onWheel={(e) => e.target.blur()}
                    className={getInputClasses(false)}
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={ticket.expiryDate ? (ticket.expiryDate.includes('T') ? ticket.expiryDate.slice(0, 10) : ticket.expiryDate) : ''}
                    onChange={(e) => dispatch(updateTicketType({ index, field: 'expiryDate', value: e.target.value || null }))}
                    onWheel={(e) => e.target.blur()}
                    className={getInputClasses(false)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => dispatch(addTicketType())}
        className="inline-flex items-center px-4 py-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="border-t border-slate-200 pt-6 mt-6">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="gstIncluded"
          checked={formData.gstIncluded || false}
          onChange={(e) => dispatch(updateGstIncluded(e.target.checked))}
          className="mt-0.5 w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-300"
        />
        <div className="flex-1">
          <label htmlFor="gstIncluded" className="block text-sm font-medium text-slate-700 cursor-pointer">
            Prices include GST
          </label>
          {formData.gstIncluded && (
            <p className="text-xs text-slate-500 mt-1">
              Prices will display as "$100 (incl GST)"
            </p>
          )}
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
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800">Registration & Tickets</h2>
        <p className="text-sm text-slate-500 mt-1">
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

            {/* Attendee Information */}
            <CustomRegistrationFields
              formData={formData}
              errors={errors}
              dispatch={dispatch}
              isRecurring={isRecurringEvent}
            />
          </div>
        </>
      )}

      {/* No Intent Selected - Should not happen since intent is in Step 1 */}
      {!formData.eventIntent && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <svg className="w-10 h-10 mx-auto text-amber-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

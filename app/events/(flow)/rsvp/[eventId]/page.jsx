'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { formatInTimeZone } from 'date-fns-tz';
import { FaUser, FaPhone, FaPlus, FaTrash } from 'react-icons/fa';

import { fetchEventById } from '@/store/slices/events/eventSlice';
import {
  registerForFreeEvent,
  checkRegistrationStatus,
  clearRegistrationError,
  clearSuccessMessage,
} from '@/store/slices/events/freeEventSlice';

import LoadingSpinner from '@/components/LoadingSpinner';
import SimpleDropdown from '@/components/shared/SimpleDropdown';
import BackButton from '@/components/BackButton';

const formatEventDate = (dateTime, timeZone) => {
  if (!dateTime) return '';
  try {
    const tz = timeZone || 'Australia/Sydney';
    return formatInTimeZone(dateTime, tz, "EEEE, MMMM d, yyyy 'at' h:mm a");
  } catch {
    return '';
  }
};

const RsvpPage = () => {
  const { eventId } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();

  // Selectors
  const { selectedEvent, status: eventStatus } = useSelector((state) => state.events);
  const { user, tokenValidated } = useSelector((state) => state.user);
  const {
    registrationStatus,
    registrationError,
    successMessage,
    currentRegistration,
  } = useSelector((state) => state.freeEvents);

  const isAuthenticated = tokenValidated && !!user?._id;
  const isRegistered =
    !!currentRegistration && currentRegistration.status === 'registered';

  // Form state — mirrors the original modal
  const [mobile, setMobile] = useState('');
  const [attendees, setAttendees] = useState([{ name: '' }]);
  const [formResponses, setFormResponses] = useState({});
  const [errors, setErrors] = useState({});
  // Local flag: true between submit click and success/failure landing.
  // Cleanly separates "just registered now" (should redirect) from "already registered from before" (show banner).
  const [submitting, setSubmitting] = useState(false);

  // ───────── Auth gate: redirect to login if not signed in ─────────
  useEffect(() => {
    if (tokenValidated && !user?._id) {
      // Preserve the rsvp URL so the user comes back here after login
      if (typeof window !== 'undefined') {
        localStorage.setItem('redirectAfterLogin', `/events/rsvp/${eventId}`);
      }
      router.push('/login?preserveRedirect=true');
    }
  }, [tokenValidated, user?._id, eventId, router]);

  // ───────── Fetch event + check registration status on mount ─────────
  useEffect(() => {
    if (!eventId) return;
    dispatch(fetchEventById(eventId));
  }, [dispatch, eventId]);

  useEffect(() => {
    if (!eventId || !isAuthenticated) return;
    dispatch(checkRegistrationStatus(eventId));
  }, [dispatch, eventId, isAuthenticated]);

  // ───────── Redirect away if event is paid (RSVP route is free-only) ─────────
  useEffect(() => {
    if (selectedEvent && selectedEvent._id === eventId && selectedEvent.isPaid) {
      router.replace(`/events/views/${eventId}`);
    }
  }, [selectedEvent, eventId, router]);

  // ───────── Handle outcome of THIS session's submit (not pre-existing registration) ─────────
  // Track whether THIS session's submit just succeeded — drives the inline success card render.
  const [justRegistered, setJustRegistered] = useState(false);

  const attendeesScrollRef = useRef(null);
  const [attendeesScroll, setAttendeesScroll] = useState({ canScroll: false, thumbTopPct: 0, thumbHeightPct: 100 });

  useEffect(() => {
    const el = attendeesScrollRef.current;
    if (!el) return;
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (clientHeight === 0) return;
      const canScroll = scrollHeight > clientHeight + 1;
      if (!canScroll) {
        setAttendeesScroll({ canScroll: false, thumbTopPct: 0, thumbHeightPct: 100 });
        return;
      }
      const thumbHeightPct = (clientHeight / scrollHeight) * 100;
      const thumbTopPct = (scrollTop / scrollHeight) * 100;
      setAttendeesScroll({ canScroll: true, thumbTopPct, thumbHeightPct });
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [attendees.length]);

  useEffect(() => {
    if (!submitting) return;

    if (registrationStatus === 'succeeded') {
      dispatch(clearRegistrationError());
      dispatch(clearSuccessMessage());
      setSubmitting(false);
      setJustRegistered(true);
    } else if (registrationStatus === 'failed') {
      // Error is already surfaced in the red banner via registrationError; just release the flag.
      setSubmitting(false);
    }
  }, [submitting, registrationStatus, dispatch]);

  // Scroll to top when the success/already-registered card is shown so the user
  // sees the back button + full card (not the bottom of the previous form scroll).
  useEffect(() => {
    if ((justRegistered || isRegistered) && !submitting) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [justRegistered, isRegistered, submitting]);

  // ───────── Form handlers ─────────
  const handleAddAttendee = () => {
    if (attendees.length < (selectedEvent?.maxAttendeesPerRegistration || 1)) {
      setAttendees([...attendees, { name: '' }]);
    }
  };

  const handleRemoveAttendee = (index) => {
    if (attendees.length > 1) {
      setAttendees(attendees.filter((_, i) => i !== index));
      const next = { ...errors };
      delete next[`attendee_${index}_name`];
      setErrors(next);
    }
  };

  const handleAttendeeChange = (index, field, value) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
    if (errors[`attendee_${index}_${field}`]) {
      const next = { ...errors };
      delete next[`attendee_${index}_${field}`];
      setErrors(next);
    }
  };

  const handleFormResponseChange = (fieldName, value) => {
    setFormResponses((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      const next = { ...errors };
      delete next[fieldName];
      setErrors(next);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }

    attendees.forEach((a, i) => {
      if (!a.name.trim()) {
        newErrors[`attendee_${i}_name`] = 'Name is required';
      }
    });

    selectedEvent?.registrationFields?.forEach((field) => {
      const value = formResponses[field.fieldName];
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
      if (field.isRequired && isEmpty) {
        newErrors[field.fieldName] = `${field.fieldName} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    const registrationData = {
      mobile: mobile.trim(),
      attendees: attendees
        .filter((a) => a.name.trim())
        .map((a) => ({
          name: a.name.trim(),
          age: a.age ? parseInt(a.age, 10) : null,
        })),
      formResponses: Object.entries(formResponses).map(([fieldName, response]) => ({
        fieldName,
        response,
      })),
    };

    dispatch(registerForFreeEvent({ eventId, registrationData }));
  };

  const handleCancel = () => {
    router.back();
  };

  // ───────── Field renderer (text + dropdown for now; full type set ready) ─────────
  const renderFormField = (field) => {
    const value = formResponses[field.fieldName] ?? '';
    const error = errors[field.fieldName];
    const baseInput = `w-full p-2 sm:p-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 ${
      error ? 'border-red-300' : 'border-slate-300'
    }`;

    const label = (
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {field.fieldName}
        {field.isRequired && <span className="text-red-500 ml-0.5">*</span>}
      </label>
    );

    switch (field.fieldType) {
      case 'select':
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            {label}
            <SimpleDropdown
              value={value}
              onChange={(v) => handleFormResponseChange(field.fieldName, v)}
              options={field.fieldOptions || []}
              placeholder="Select"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        );

      case 'text':
      default:
        return (
          <div key={field.fieldName} className="mb-3 sm:mb-4">
            {label}
            <textarea
              value={value}
              onChange={(e) => handleFormResponseChange(field.fieldName, e.target.value)}
              rows={3}
              className={`${baseInput} resize-vertical`}
              placeholder="Please provide your response"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        );
    }
  };

  // ───────── Render: loading / not-found / main ─────────
  const isLoadingEvent = (eventStatus === 'idle' || eventStatus === 'loading') && !selectedEvent;

  if (isLoadingEvent) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!selectedEvent || selectedEvent._id !== eventId) {
    return (
      <div>
        <div className="max-w-md mx-auto text-center">
          <p className="text-slate-700 mb-4">Event not found.</p>
          <Link
            href="/events"
            className="inline-flex items-center gap-1 bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-3 py-1 md:px-4 md:py-2 rounded-full shadow font-semibold text-xs md:text-sm transition-colors"
          >
            <span>&lt;</span>
            <span>Browse events</span>
          </Link>
        </div>
      </div>
    );
  }

  // Past event guard
  const eventDate = selectedEvent.dateTime ? new Date(selectedEvent.dateTime) : null;
  const isPastEvent = eventDate && eventDate < new Date();

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <div className="mb-3 sm:mb-4">
          <BackButton href={`/events/views/${eventId}`} />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 sm:p-6">
          {/* Title + event summary — hidden when registration is complete or on a revisit
              (the registered card stands alone with its own actions). */}
          {!justRegistered && !isRegistered && (
            <>
              <h1 className="text-lg sm:text-2xl font-bold text-forest-900 text-center mb-1">
                {selectedEvent.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 text-center mb-4 sm:mb-6">
                {formatEventDate(selectedEvent.dateTime, selectedEvent.timeZone)}
              </p>
            </>
          )}

          {/* Registered card — same layout for fresh success AND already-registered revisits;
              just the message differs. Both flows end with the same two actions. */}
          {(justRegistered || isRegistered) && !submitting && (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                {justRegistered ? 'Registration successful' : 'You are already registered for this event'}
              </h3>
              {justRegistered && (
                <p className="text-sm text-slate-500 mb-6">
                  You will receive a confirmation email shortly.
                </p>
              )}
              {!justRegistered && <div className="mb-6" />}

              <div className="flex items-center justify-center gap-4 text-sm">
                <Link
                  href="/users/profile/myregistrations"
                  className="text-teal-700 hover:text-teal-800 underline"
                >
                  View my RSVPs
                </Link>
                <span className="text-slate-300">·</span>
                <Link
                  href="/events"
                  className="text-teal-700 hover:text-teal-800 underline"
                >
                  Browse events
                </Link>
              </div>
            </div>
          )}

          {/* Past-event banner */}
          {isPastEvent && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
              This event has already taken place. Registration is closed.
            </div>
          )}

          {/* Form — hidden when already registered, just-registered, or event is past. */}
          {!isRegistered && !isPastEvent && !justRegistered && (
            <form onSubmit={handleSubmit}>
              {/* Contact Information */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mobile Number<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (errors.mobile) {
                      const next = { ...errors };
                      delete next.mobile;
                      setErrors(next);
                    }
                  }}
                  className={`w-full p-2 sm:p-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                    errors.mobile ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Enter your mobile number"
                />
                {errors.mobile && (
                  <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>
                )}
              </div>

              {/* Attendees */}
              <div className="mb-8 sm:mb-10">
                <div className="flex gap-2 items-stretch">
                  <div
                    ref={attendeesScrollRef}
                    className={`flex-1 min-w-0 ${
                      attendees.length > 3
                        ? 'max-h-72 md:max-h-[36rem] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'
                        : ''
                    }`}
                  >
                    {attendees.map((a, i) => (
                      <div
                        key={i}
                        className="border border-slate-200 rounded-lg p-3 mb-2 bg-slate-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-slate-700">
                            Attendee {i + 1}<span className="text-red-500 ml-0.5">*</span>
                          </h4>
                          {attendees.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAttendee(i)}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              aria-label="Remove attendee"
                            >
                              <FaTrash size={12} />
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={a.name}
                          onChange={(e) => handleAttendeeChange(i, 'name', e.target.value)}
                          className={`w-full p-2 sm:p-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 ${
                            errors[`attendee_${i}_name`]
                              ? 'border-red-300'
                              : 'border-slate-300'
                          }`}
                          placeholder="Enter full name"
                        />
                        {errors[`attendee_${i}_name`] && (
                          <p className="text-xs text-red-600 mt-1">
                            {errors[`attendee_${i}_name`]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {attendeesScroll.canScroll && (
                    <div className="relative w-1.5 bg-slate-100 rounded-full shrink-0">
                      <div
                        className="absolute left-0 right-0 bg-teal-700 rounded-full transition-all"
                        style={{
                          top: `${attendeesScroll.thumbTopPct}%`,
                          height: `${attendeesScroll.thumbHeightPct}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {(selectedEvent.maxAttendeesPerRegistration || 1) > 1 && (() => {
                  const max = selectedEvent.maxAttendeesPerRegistration;
                  const atMax = attendees.length >= max;
                  return (
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs ${atMax ? 'text-red-600' : 'invisible'}`}>
                        Max {max} attendees reached
                      </span>
                      <button
                        type="button"
                        onClick={handleAddAttendee}
                        disabled={atMax}
                        className={`flex items-center gap-1 px-3 py-1 text-xs sm:text-sm rounded-full font-semibold transition-colors ${
                          atMax
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-teal-700 hover:bg-teal-50 hover:text-teal-800'
                        }`}
                      >
                        <FaPlus size={10} />
                        Add Attendee
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Additional info — host-configured questions */}
              {selectedEvent.registrationFields?.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  {selectedEvent.registrationFields.map(renderFormField)}
                </div>
              )}

              {/* Server-side error (returned by the registerForFreeEvent thunk) */}
              {registrationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{registrationError}</p>
                </div>
              )}

              {/* Action footer */}
              <div className="flex sm:justify-center gap-2 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-3 text-sm md:text-base border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg shadow font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registrationStatus === 'loading'}
                  className="flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-3 text-sm md:text-base bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registrationStatus === 'loading' ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          )}

          {/* Past-event back-to-event link. (Registered/just-registered states have their own
              action buttons inside the unified registered card above.) */}
          {isPastEvent && !justRegistered && !isRegistered && (
            <div className="flex justify-center pt-4 border-t border-slate-200 mt-4">
              <Link
                href={`/events/views/${eventId}`}
                className="px-4 py-2 text-sm sm:text-base border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Back to event
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RsvpPage;

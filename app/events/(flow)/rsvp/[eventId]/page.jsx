'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { DEFAULT_BLOCK_MESSAGE } from '@/utils/events/registrationMessages';
import { formatInTimeZone } from 'date-fns-tz';
import { FaPlus, FaTrash, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';

import { fetchEventById } from '@/store/slices/events/eventSlice';
import {
  registerForFreeEvent,
  checkRegistrationStatus,
  clearRegistrationError,
  clearSuccessMessage,
} from '@/store/slices/events/freeEventSlice';

import LoadingSpinner from '@/components/LoadingSpinner';
import AttendeeInfoSection from '@/components/events/tickets/AttendeeInfoSection';
import BackButton from '@/components/BackButton';
import EmptyState from '@/components/layout/EmptyState';

// AU mobile: 10 digits starting with 04 (spaces allowed in the field, ignored here).
const normalizeMobile = (m) => String(m || '').replace(/\s+/g, '');
const isValidAuMobile = (m) => /^04\d{8}$/.test(normalizeMobile(m));

// Is a required question answered? Pick-many needs at least one tick; yes/no must be ticked (Yes -
// the agreement use); everything else needs a non-empty value.
const isAnswered = (field, v) => {
  if (field.fieldType === 'yesno') return v === 'Yes';
  if (Array.isArray(v)) return v.length > 0;
  return v != null && String(v).trim() !== '';
};

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
  // Guests get everything by email and cannot view RSVPs online (the member page
  // redirects a guest out), so hide member-only links for them. See featureplans/events-guest-attendee.md.
  const isGuest = user?.role === 'guest';
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
    } else if (!isValidAuMobile(mobile)) {
      newErrors.mobile = 'Enter a 10-digit mobile starting with 04';
    }

    attendees.forEach((a, i) => {
      if (!a.name.trim()) {
        newErrors[`attendee_${i}_name`] = 'Name is required';
      }
    });

    selectedEvent?.registrationFields?.forEach((field) => {
      if (field.isRequired && !isAnswered(field, formResponses[field.fieldName])) {
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
      mobile: normalizeMobile(mobile),
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

  // Blocking answers (events-rsvp-blocking-questions.md): a dropdown answer marked blocking stops the
  // RSVP. Evaluated PER QUESTION against its own blockingOptions; returns the message (custom or default)
  // when the current answer blocks, else null. While any block is active, Register stays disabled.
  const getFieldBlock = (field) => {
    const answer = formResponses[field.fieldName];
    const blocks = (field.blockingOptions || []).map(String);
    // Blocking is single-pick only (dropdown / multiple choice); a list answer never blocks.
    if (Array.isArray(answer) || blocks.length === 0) return null;
    if (answer != null && String(answer).trim() !== '' && blocks.includes(String(answer))) {
      return (field.blockingMessage && field.blockingMessage.trim()) || DEFAULT_BLOCK_MESSAGE;
    }
    return null;
  };
  const activeBlockMessage =
    (selectedEvent?.registrationFields || []).map((f) => getFieldBlock(f)).find(Boolean) || null;
  const anyBlockActive = !!activeBlockMessage;

  // Register enables only when the required info is complete (D2): a mobile number, every attendee
  // name, and every required custom question. Same rule the validateForm() gate enforces on submit -
  // this just mirrors it live so the sticky-bar button greys out until it is met.
  const requiredComplete =
    isValidAuMobile(mobile) &&
    attendees.every((a) => a.name.trim() !== '') &&
    (selectedEvent?.registrationFields || []).every((f) => {
      if (!f.isRequired) return true;
      return isAnswered(f, formResponses[f.fieldName]);
    });

  // Live-invalid: something is typed but it isn't a valid AU mobile yet. Drives the inline red
  // hint so the disabled Register button always has a visible reason.
  const mobileInvalid = mobile.trim() !== '' && !isValidAuMobile(mobile);

  const isSubmitting = submitting || registrationStatus === 'loading';

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
      <EmptyState
        title="Event not found"
        description="This event may have been removed, or the link is incorrect."
        actionLabel="Browse events"
        actionHref="/events"
      />
    );
  }

  // Past event guard
  const eventDate = selectedEvent.dateTime ? new Date(selectedEvent.dateTime) : null;
  const isPastEvent = eventDate && eventDate < new Date();

  // The form is only shown (and the sticky bar only pinned) when there is something to fill in.
  const showForm = !isRegistered && !isPastEvent && !justRegistered;

  return (
    <div>
      <div className={`w-full max-w-2xl mx-auto ${anyBlockActive ? 'pb-48' : 'pb-24'}`}>
        {/* Page toolbar (design-system.md section 8): Back pinned left, title centred in the SAME
            row. Back is the shared secondary button; title is the flat H1 (18px bold). */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute left-0">
            <BackButton href={`/events/views/${eventId}`} />
          </div>
          <h1 className="px-12 text-lg font-bold text-slate-900 text-center truncate">
            {selectedEvent.title}
          </h1>
        </div>

        {/* Event date meta (12px muted) - only while the form is shown. */}
        {showForm && (
          <p className="text-xs text-slate-500 text-center mb-6">
            {formatEventDate(selectedEvent.dateTime, selectedEvent.timeZone)}
          </p>
        )}

        {/* Registered card — same layout for fresh success AND already-registered revisits;
            just the message differs. Both flows end with the same two actions. */}
        {(justRegistered || isRegistered) && !submitting && (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {justRegistered ? 'Registration successful' : 'You are already registered for this event'}
            </h3>
            {justRegistered && (
              <p className="text-sm text-slate-500 mb-6">
                You will receive a confirmation email shortly.
              </p>
            )}
            {!justRegistered && <div className="mb-6" />}

            {/* Guest came back to manage: registering with the same email upgrades the
                guest record, attaching this RSVP so they can manage it. Organiser contact
                is already in their email and on the event page. Not shown on fresh success. */}
            {isGuest && !justRegistered && (
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">
                To change or cancel, contact the event organiser. Alternatively,{' '}
                <Link href="/register" className="text-teal-700 hover:text-teal-800 underline">
                  register with {user?.email}
                </Link>{' '}
                to manage your RSVPs online.
              </p>
            )}

            <div className="flex items-center justify-center gap-4 text-sm">
              {!isGuest && (
                <>
                  <Link
                    href="/users/profile/myregistrations"
                    className="text-teal-700 hover:text-teal-800 underline"
                  >
                    View my RSVPs
                  </Link>
                  <span className="text-slate-300">·</span>
                </>
              )}
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

        {/* Form — hidden when already registered, just-registered, or event is past. One bordered
            card wraps every field so the page reads as a single form; the custom-questions block
            rides inside it as a divided section (AttendeeInfoSection `bare`). */}
        {showForm && (
          <form id="rsvp-form" onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
            {/* Mobile number — contact for the whole registration, so it owns its own full-width row. */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Mobile Number<span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (errors.mobile) {
                    const next = { ...errors };
                    delete next.mobile;
                    setErrors(next);
                  }
                }}
                className={`w-full max-w-[200px] px-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 ${
                  errors.mobile || mobileInvalid ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-slate-300'
                }`}
                placeholder="0412345678"
              />
              {/* Live feedback: a red message the moment what's typed isn't a valid AU mobile
                  (the Register button is disabled until it is, so without this the greyed button
                  has no visible reason); a muted format hint only while the field is empty; and
                  nothing once a valid number is entered. */}
              {errors.mobile || mobileInvalid ? (
                <p className="text-xs text-red-600 mt-1">
                  {errors.mobile || 'Enter a 10-digit mobile starting with 04'}
                </p>
              ) : mobile.trim() === '' ? (
                <p className="text-xs text-slate-500 mt-1">
                  Australian mobile, 10 digits starting with 04
                </p>
              ) : null}
            </div>

            {/* Attendee names: 2-column on desktop, stacked on mobile (D4). */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Attendee name cards — flow normally (no DIY scrollbar, D6). */}
              {attendees.map((a, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">
                      Attendee {i + 1}<span className="text-red-500 ml-0.5">*</span>
                    </label>
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
                    className={`w-full px-3 py-2.5 text-sm bg-white border rounded-lg text-slate-700 placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 ${
                      errors[`attendee_${i}_name`] ? 'border-red-500 bg-red-50 focus:ring-red-300' : 'border-slate-300'
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

            {/* Add-attendee control (only when the event allows more than one). Sits right after the
                attendee fields, left-aligned; the max-reached note tucks in beside it. */}
            {(selectedEvent.maxAttendeesPerRegistration || 1) > 1 && (() => {
              const max = selectedEvent.maxAttendeesPerRegistration;
              const atMax = attendees.length >= max;
              return (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={handleAddAttendee}
                    disabled={atMax}
                    className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full font-semibold transition-colors ${
                      atMax
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-teal-700 hover:bg-teal-50 hover:text-teal-800'
                    }`}
                  >
                    <FaPlus size={10} />
                    Add Attendee
                  </button>
                  {atMax && (
                    <span className="text-xs text-red-600">Max {max} attendees reached</span>
                  )}
                </div>
              );
            })()}

            {/* Host-configured custom questions — the shared card in `bare` mode so it sits as a
                divided section inside this one form card (D3). Errors render under each field; the
                blocking message is lifted OUT of the form (below) per owner's direction. */}
            <AttendeeInfoSection
              event={selectedEvent}
              formResponses={formResponses}
              onFormResponseUpdate={handleFormResponseChange}
              errors={errors}
              isFieldBlocking={(field) => !!getFieldBlock(field)}
              singleColumn
              bare
            />

            {/* Server-side error (returned by the registerForFreeEvent thunk) */}
            {registrationError && (
              <p className="text-sm text-red-600 mt-6">{registrationError}</p>
            )}
          </form>
        )}

        {/* Past-event back-to-event link. (Registered/just-registered states have their own
            action buttons inside the unified registered card above.) */}
        {isPastEvent && !justRegistered && !isRegistered && (
          <div className="flex justify-center pt-4 border-t border-slate-200 mt-4">
            <Link
              href={`/events/views/${eventId}`}
              className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Back to event
            </Link>
          </div>
        )}
      </div>

      {/* Sticky action bar (design-system.md buttons): "N attendees" on the left, the Register
          primary on the right, pinned to the bottom edge. The mobile bottom nav is hidden on this
          page (see BottomNavigation), so this owns the bottom edge; the wrapper carries pb-24 so
          nothing hides behind it. When a blocking answer is chosen, registration is impossible, so
          the primary becomes the way out (Browse Events). */}
      {showForm && (
        <div
          data-testid="rsvp-cta-bar"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white safe-area-inset-pb"
        >
          <div className="w-full max-w-2xl mx-auto px-2 md:px-4 py-3">
            {/* Blocked: the organiser's reason rides the always-visible bar (a top strip) so the
                attendee sees WHY the instant they pick a disqualifying answer, without scrolling to
                the bottom of the form. It wraps to two lines for a long message. */}
            {anyBlockActive && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <FaExclamationCircle className="mt-0.5 flex-shrink-0" />
                <span>{activeBlockMessage}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {attendees.length} attendee{attendees.length === 1 ? '' : 's'}
              </p>
            </div>
            {anyBlockActive ? (
              <Link
                href="/events"
                data-testid="rsvp-browse"
                className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-teal-700 hover:bg-teal-800 text-white transition-colors"
              >
                Browse Events
              </Link>
            ) : (
              <button
                type="submit"
                form="rsvp-form"
                data-testid="rsvp-register"
                disabled={!requiredComplete || isSubmitting}
                className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  requiredComplete
                    ? 'bg-teal-700 hover:bg-teal-800 text-white'
                    : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Registering...</span>
                  </>
                ) : requiredComplete ? (
                  <span>Register</span>
                ) : (
                  <>
                    <FaExclamationTriangle className="text-sm" />
                    <span>Fill Required Info</span>
                  </>
                )}
              </button>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RsvpPage;

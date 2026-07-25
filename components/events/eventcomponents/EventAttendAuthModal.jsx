'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import { continueAsGuest } from '@/store/slices/users/userSlice';
import { isHoneypotTriggered, isFormSubmittedTooQuickly } from '@/utils/forms/antiBot';
import { sanitizeInput } from '@/utils/forms/validation';

// The fork shown when a logged-out visitor taps Register (free) or Purchase Tickets
// (paid) on an event. Offers Log in / Register / Continue as guest. Guest collects
// only an email (same bot defences as login), starts a guest session, and drops the
// visitor straight into the flow they wanted. See featureplans/events-guest-attendee.md.
const EventAttendAuthModal = ({ isOpen, onClose, event }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const isPaid = !!event?.isPaid;
  const eventId = event?._id;
  const flowTarget = isPaid ? `/events/tickets/${eventId}` : `/events/rsvp/${eventId}`;

  const [showGuest, setShowGuest] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formLoadTime, setFormLoadTime] = useState(0);
  const honeypotRef = useRef(null);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (isOpen) {
      setShowGuest(false);
      setEmail('');
      setEmailError(null);
      setSubmitting(false);
      setCaptchaToken(null);
      setFormLoadTime(Date.now());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Preserve the return-to-flow redirect exactly as the CTAs did before.
  const rememberRedirect = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('redirectAfterLogin', flowTarget);
    if (!isPaid) localStorage.setItem('eventRegistrationPending', eventId);
    if (!localStorage.getItem('eventViewReturnUrl')) {
      localStorage.setItem('eventViewReturnUrl', '/events');
    }
  };

  const goLogin = () => {
    rememberRedirect();
    router.push('/login?preserveRedirect=true');
  };

  const goRegister = () => {
    rememberRedirect();
    router.push('/register?preserveRedirect=true');
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    setEmailError(null);

    const honeypotValue = honeypotRef.current?.value || '';
    if (isHoneypotTriggered(honeypotValue)) {
      toast.success('Processing your request...');
      return;
    }
    if (isFormSubmittedTooQuickly(formLoadTime, 1500)) {
      toast.error('An error occurred. Please try again later.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email.');
      return;
    }
    if (!captchaToken) {
      toast.error('Please complete the CAPTCHA');
      return;
    }

    setSubmitting(true);
    try {
      await dispatch(continueAsGuest({
        email,
        captchaToken,
        formLoadTime,
        timeElapsed: Date.now() - formLoadTime,
      })).unwrap();
      onClose();
      router.push(flowTarget);
    } catch (err) {
      if (err?.code === 'ACCOUNT_EXISTS') {
        setEmailError('This email has an account. Please log in.');
      } else {
        toast.error(err?.message || 'Could not continue as guest. Please try again.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            {isPaid ? 'Get your tickets' : 'Register for this event'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-slate-400 hover:text-slate-600 text-xl font-bold leading-none"
          >
            x
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Members first: Log in primary, Register secondary. */}
          <button
            onClick={goLogin}
            className="w-full bg-teal-700 text-white hover:bg-teal-800 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Log in
          </button>
          <button
            onClick={goRegister}
            className="w-full border border-teal-700 text-teal-700 hover:bg-teal-50 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
          >
            Register
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {!showGuest ? (
            <button
              onClick={() => setShowGuest(true)}
              className="w-full text-teal-700 hover:text-teal-800 px-4 py-2 text-sm font-medium underline"
            >
              Continue as guest
            </button>
          ) : (
            <form onSubmit={handleGuestSubmit} className="space-y-3">
              <p className="text-xs text-slate-500">
                No account needed - we will email your {isPaid ? 'tickets' : 'registration'} to this address.
              </p>
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(sanitizeInput(e.target.value)); if (emailError) setEmailError(null); }}
                  placeholder="you@email.com"
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-teal-600 ${emailError ? 'border-red-400' : 'border-slate-300'}`}
                  autoFocus
                />
                {emailError && (
                  <p className="mt-1 text-xs text-red-600">
                    {emailError}{' '}
                    {emailError.includes('account') && (
                      <button type="button" onClick={goLogin} className="underline font-medium">
                        Log in
                      </button>
                    )}
                  </p>
                )}
              </div>

              {/* Honeypot - hidden from real users, but bots fill it. */}
              <input
                type="text"
                name="website"
                ref={honeypotRef}
                tabIndex="-1"
                aria-hidden="true"
                style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }}
              />

              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                  onExpired={() => setCaptchaToken(null)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-700 text-white hover:bg-teal-800 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
              >
                {submitting ? 'Please wait...' : `Continue to ${isPaid ? 'tickets' : 'RSVP'}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventAttendAuthModal;

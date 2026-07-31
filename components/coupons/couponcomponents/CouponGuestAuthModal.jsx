'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from '@/utils/axiosConfig';
import { isHoneypotTriggered, isFormSubmittedTooQuickly } from '@/utils/forms/antiBot';
import { sanitizeInput } from '@/utils/forms/validation';

// The fork shown when a logged-out visitor taps GET CODE on a coupon (card / slug / views page).
// Offers Log in or Get it by email. The guest path collects only an email (same bot defences as the
// events guest fork), claims the code server-side, and confirms "sent to your email" IN this modal -
// the code + QR are emailed, never rendered. See featureplans/coupons-guest-code.md.
const CouponGuestAuthModal = ({ isOpen, onClose, campaign }) => {
  const router = useRouter();
  const campaignId = campaign?._id;

  // view: 'fork' (choose) -> 'email' (form) -> 'sent' | 'already' (confirmation)
  const [view, setView] = useState('fork');
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formLoadTime, setFormLoadTime] = useState(0);
  const [mounted, setMounted] = useState(false);
  const honeypotRef = useRef(null);

  // Portal target only exists in the browser; wait for mount before rendering into document.body.
  useEffect(() => setMounted(true), []);

  // Reset the dialog each time it opens.
  useEffect(() => {
    if (isOpen) {
      setView('fork');
      setEmail('');
      setSentTo('');
      setEmailError(null);
      setSubmitting(false);
      setCaptchaToken(null);
      setFormLoadTime(Date.now());
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const rememberRedirect = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('redirectAfterLogin', '/coupons');
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
      const { data } = await axios.post('/coupons/claim', {
        campaignId,
        email,
        captchaToken,
        formLoadTime,
        timeElapsed: Date.now() - formLoadTime,
      });
      setSentTo(email);
      setView(data?.alreadyClaimed ? 'already' : 'sent');
    } catch (err) {
      const code = err?.response?.data?.code;
      const message = err?.response?.data?.message;
      if (code === 'ACCOUNT_EXISTS') {
        setEmailError('This email has an account. Please log in.');
      } else {
        toast.error(message || 'Could not send your code. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const isConfirmation = view === 'sent' || view === 'already';

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            {isConfirmation ? 'Check your email' : 'Get your coupon'}
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
          {isConfirmation ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-slate-700">
                {view === 'already'
                  ? "You've already claimed this coupon - we've sent it to your email again."
                  : 'Your coupon code is on its way.'}
              </p>
              <p className="text-sm text-slate-500">
                We sent it to <span className="font-semibold text-slate-700">{sentTo}</span>.
                Open the email to view your code and QR.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-teal-700 text-white hover:bg-teal-800 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
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

              {view === 'fork' ? (
                <button
                  onClick={() => setView('email')}
                  className="w-full text-teal-700 hover:text-teal-800 px-4 py-2 text-sm font-medium underline"
                >
                  Continue as guest
                </button>
              ) : (
                <form onSubmit={handleGuestSubmit} className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Enter your email and we'll send your coupon code and QR straight to your inbox.
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
                    {submitting ? 'Please wait...' : 'Email me the code'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CouponGuestAuthModal;

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import ReCAPTCHA from 'react-google-recaptcha';
import axios from '@/utils/axiosConfig';
import { isHoneypotTriggered, isFormSubmittedTooQuickly } from '@/utils/forms/antiBot';
import { sanitizeInput } from '@/utils/forms/validation';

// Logged-out waitlist join: collect an email (with the same bot defences as the guest fork) and
// POST to the public join endpoint. The waitlist is a low-stakes notification list, so ANY email
// may join without logging in - even one that belongs to an account. See featureplans/events-waitlist.md.
const WaitlistJoinModal = ({ isOpen, onClose, event, onJoined }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [formLoadTime, setFormLoadTime] = useState(0);
  const honeypotRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setName('');
      setMobile('');
      setEmailError(null);
      setSubmitting(false);
      setCaptchaToken(null);
      setFormLoadTime(Date.now());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
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
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/events/${event._id}/waitlist/join`,
        { email, captchaToken, name, mobile },
        { withCredentials: true }
      );
      onClose();
      onJoined();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not join the waitlist. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Join the waitlist</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 text-slate-400 hover:text-slate-600 text-xl font-bold leading-none"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <p className="text-xs text-slate-500">
            Enter your email and we will let you know if tickets open up. No account needed.
          </p>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(sanitizeInput(e.target.value)); if (emailError) setEmailError(null); }}
              placeholder="Email (required)"
              className={`w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-teal-600 ${emailError ? 'border-red-400' : 'border-slate-300'}`}
              autoFocus
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            )}
          </div>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(sanitizeInput(e.target.value))}
              placeholder="Name (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>
          <div>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(sanitizeInput(e.target.value))}
              placeholder="Mobile (optional)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-teal-600"
            />
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
            disabled={submitting || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !captchaToken}
            className="w-full bg-teal-700 text-white hover:bg-teal-800 px-4 py-2.5 rounded-full shadow-sm font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Joining...' : 'Join the waitlist'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WaitlistJoinModal;

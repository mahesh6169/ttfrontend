'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { submitReport } from '@/store/slices/supportSlice';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import { isFormSubmittedTooQuickly, isHoneypotTriggered } from '@/utils/forms/antiBot';
import { sanitizeInput, validateReportForm } from '@/utils/forms/validation';
import SimpleDropdown from '@/components/shared/SimpleDropdown';

// Map type param to display label
const TYPE_LABELS = {
  listing: 'Listing',
  event: 'Event',
  thread: 'Thread',
  deal: 'Deal',
  discount: 'Discount Code',
  advert: 'Listing', // backward compatibility
};

// Map type param to view URL path
const VIEW_URL_PATHS = {
  listing: '/listings/views',
  event: '/events/views',
  thread: '/threads/views',
  deal: '/dailydeals/views',
  discount: '/discountcode/views',
  advert: '/listings/views', // backward compatibility
};

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'misleading', label: 'Misleading' },
  { value: 'outdated', label: 'Outdated' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'other', label: 'Other' },
];

const ReportForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [captchaToken, setCaptchaToken] = useState(null);

  const title = searchParams.get('title') || '';
  const id = searchParams.get('id') || '';
  const type = searchParams.get('type') || 'listing';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(Date.now());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Generate item URL for admin reference
  const itemUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${VIEW_URL_PATHS[type] || VIEW_URL_PATHS.listing}/${id}`
    : '';

  // Get display label for type
  const typeLabel = TYPE_LABELS[type] || TYPE_LABELS.listing;

  useEffect(() => {
    toast.dismiss();
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Shared input classes: base + error/normal state (forms.md §4).
  const getFieldClasses = (fieldName) => {
    const base = 'w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2';
    const state = errors?.[fieldName]
      ? 'border-red-500 focus:ring-red-300'
      : 'border-slate-300 focus:ring-teal-300';
    return `${base} ${state}`;
  };

  // Clear a field's error the moment the user edits it (forms.md §5).
  const clearError = (fieldName) => {
    if (errors?.[fieldName]) {
      const next = { ...errors };
      delete next[fieldName];
      setErrors(next);
    }
  };

  const handleCancel = () => {
    const returnUrl = localStorage.getItem('reportReturnUrl');
    if (returnUrl) {
      localStorage.removeItem('reportReturnUrl');
      router.push(returnUrl);
    } else {
      router.back();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isHoneypotTriggered(honeypot)) {
      toast.error('Bot submission blocked.');
      return;
    }

    if (isFormSubmittedTooQuickly(formLoadTime)) {
      toast.error('Form submitted too quickly. Please try again.');
      return;
    }

    const validationErrors = validateReportForm({
      senderName: name,
      senderEmail: email,
      reason,
      message,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Form Errors — please fix the highlighted fields.');
      return;
    }

    setErrors({});
    setSubmitting(true);

    dispatch(
      submitReport({
        title: sanitizeInput(title),
        id,
        type,
        itemUrl,
        reason,
        senderName: sanitizeInput(name),
        senderEmail: sanitizeInput(email),
        message: sanitizeInput(message),
        captchaToken,
      })
    )
      .unwrap()
      .then(() => {
        setReason('');
        setMessage('');
        setCaptchaToken(null);

        toast.success('Report submitted successfully.');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      })
      .catch((err) => {
        setSubmitting(false);
        toast.error(err || 'Failed to submit report. Please try again.');
      });
  };

  return (
    <>
      {/* Cancel toolbar — above the title (forms.md §9) */}
      <div className="mb-4 flex items-center">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1 bg-teal-700 text-white hover:bg-teal-800 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          ✕ Cancel
        </button>
      </div>

      {/* Title + description (forms.md §2) */}
      <div className="text-center mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">
          Report this {typeLabel}
        </h1>
        <p className="mt-1 text-sm text-slate-700">
          {title}
        </p>
      </div>

      <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Honeypot field (hidden) */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex="-1"
            autoComplete="off"
          />

          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={getFieldClasses('senderName')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('senderName');
              }}
              placeholder="Your Name"
            />
            {errors.senderName && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.senderName}</p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
              Your Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className={getFieldClasses('senderEmail')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError('senderEmail');
              }}
              placeholder="Your Email"
            />
            {errors.senderEmail && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.senderEmail}</p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
              Reason <span className="text-red-500">*</span>
            </label>
            <SimpleDropdown
              value={reason}
              onChange={(val) => {
                setReason(val);
                clearError('reason');
              }}
              options={REPORT_REASONS}
              placeholder="Select a reason"
            />
            {errors.reason && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
              Additional details
            </label>
            <textarea
              className={`${getFieldClasses('message')} min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y`}
              maxLength={1000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                clearError('message');
              }}
              placeholder="Provide additional details (optional)"
            />
            {errors.message ? (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.message}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">{message.length}/1000</p>
            )}
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
            />
          </div>

          <div className="mt-8 flex justify-end items-center">
            <button
              type="submit"
              disabled={submitting || !captchaToken}
              className={`px-6 py-2 text-sm sm:text-base rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                submitting
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Submitting…
                </span>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ReportForm;

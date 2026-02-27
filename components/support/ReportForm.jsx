'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { submitReport } from '@/store/slices/supportSlice';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import { isFormSubmittedTooQuickly, isHoneypotTriggered } from '@/utils/forms/antiBot';
import { sanitizeInput, validateReportForm } from '@/utils/forms/validation';

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
  { value: '', label: 'Select a reason' },
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

  // Generate item URL for admin reference
  const itemUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${VIEW_URL_PATHS[type] || VIEW_URL_PATHS.listing}/${id}`
    : '';

  // Get display label for type
  const typeLabel = TYPE_LABELS[type] || TYPE_LABELS.listing;

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

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

    const errors = validateReportForm({
      senderName: name,
      senderEmail: email,
      reason,
      message,
    });

    if (Object.keys(errors).length > 0) {
      toast.error(
        <div className="space-y-1">
          {Object.values(errors).map((msg, i) => (
            <p key={i} className="text-sm text-red-600">{msg}</p>
          ))}
        </div>
      );
      return;
    }

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
        toast.error(err || 'Failed to submit report. Please try again.');
      });
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-bold mb-2">Report this {typeLabel}</h2>
      <p className="text-slate-600 mb-4">
        <strong>{typeLabel}:</strong> {title}
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex="-1"
          autoComplete="off"
        />

        <input
          type="text"
          className="w-full border border-slate-200 p-2 rounded mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
        />

        <input
          type="email"
          className="w-full border border-slate-200 p-2 rounded mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your Email"
        />

        <select
          className="w-full border border-slate-200 p-2 rounded mb-2"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {REPORT_REASONS.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
              {opt.label}
            </option>
          ))}
        </select>

        <textarea
          className="w-full border border-slate-200 p-2 rounded mb-2"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Provide additional details (Optional)"
        />

        <ReCAPTCHA
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
          onChange={(token) => setCaptchaToken(token)}
          onExpired={() => setCaptchaToken(null)}
        />

        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="bg-teal-600 text-lime-100 hover:bg-teal-700 hover:text-lime-100 px-4 py-2 rounded"
          >
            Submit Report
          </button>
          <button
            type="button"
            onClick={() => {
              const returnUrl = localStorage.getItem('reportReturnUrl');
              if (returnUrl) {
                localStorage.removeItem('reportReturnUrl');
                router.push(returnUrl);
              } else {
                router.back();
              }
            }}
            className="bg-slate-600 text-white hover:bg-slate-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;

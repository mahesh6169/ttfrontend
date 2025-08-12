'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { submitReport } from '@/store/slices/supportSlice';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import { isFormSubmittedTooQuickly, isHoneypotTriggered } from '@/utils/forms/antiBot';
import { sanitizeInput, validateReportForm } from '@/utils/forms/validation';

const ReportForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [captchaToken, setCaptchaToken] = useState(null);

  const title = searchParams.get('title') || '';
  const id = searchParams.get('id') || '';
  const type = searchParams.get('type') || 'advert';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(Date.now());

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
        senderName: sanitizeInput(name),
        senderEmail: sanitizeInput(email),
        message: sanitizeInput(message),
        captchaToken,
      })
    )
      .unwrap()
      .then(() => {
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
      <h2 className="text-xl font-bold mb-2">Report {type}</h2>
      <p className="text-gray-600 mb-4">
        <strong>Title:</strong> {title}
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
          className="w-full border p-2 rounded mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
        />

        <input
          type="email"
          className="w-full border p-2 rounded mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your Email "
        />

        <textarea
          className="w-full border p-2 rounded mb-2"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Explain the issue clearly..."
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
            className="bg-gray-600 text-white hover:bg-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;

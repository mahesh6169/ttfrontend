'use client';

import { useState, useEffect } from 'react';
import {  useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { submitContact } from '@/store/slices/supportSlice';
import SimpleDropdown from '@/components/shared/SimpleDropdown';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import { isFormSubmittedTooQuickly, isHoneypotTriggered } from '@/utils/forms/antiBot';
import { validateContactForm, sanitizeInput } from '@/utils/forms/validation';

const ENQUIRY_OPTIONS = [
  'Advertisement Enquiry',
  'Hosting Event Enquiry',
  'Feature Request',
  'Report A Bug',
  'Technical Support',
  'Other',
];

const ContactForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const contactStatus = useSelector((state) => state.support.contactStatus);
  const isSubmitting = contactStatus === 'loading';

  const enquiryType = searchParams.get('enquiry');
  const initialOption = enquiryType === 'event' ? 'Hosting Event Enquiry' : enquiryType === 'ad' ? 'Advertisement Enquiry' : '';

  const [captchaToken, setCaptchaToken] = useState(null);
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [option, setOption] = useState(initialOption);
  const [otherOption, setOtherOption] = useState('');
  const [description, setDescription] = useState('');
  const [formLoadTime, setFormLoadTime] = useState(Date.now());
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState({});

  // Clear any stale toasts on mount (forms.md §7).
  useEffect(() => {
    toast.dismiss();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Clear a single field's error the moment the user edits it (re-checked on next Submit).
  const clearError = (key) => {
    if (errors?.[key]) {
      const next = { ...errors };
      delete next[key];
      setErrors(next);
    }
  };

  // Field styling helper — base + normal/error state (forms.md §4).
  const getFieldClasses = (fieldName) => {
    const base = 'w-full p-3 sm:p-2 text-base sm:text-sm border rounded-lg focus:outline-none focus:ring-2';
    const state = errors?.[fieldName] ? 'border-red-500 focus:ring-red-300' : 'border-slate-300 focus:ring-teal-300';
    return `${base} ${state}`;
  };

  // Get dynamic placeholders based on selected option
  const getPlaceholders = () => {
    switch(option) {
      case 'Advertisement Enquiry':
        return {
          title: 'e.g., Banner Ad Pricing for 3 Months',
          description: 'Please describe your advertising needs, target audience, and preferred ad placement...',
          showMobile: true
        };
      case 'Hosting Event Enquiry':
        return {
          title: 'e.g., Event Ticketing Support or Partnership',
          description: 'Please describe your event, expected attendees, ticketing needs, and any questions about our platform...',
          showMobile: true
        };
      case 'Technical Support':
        return {
          title: 'e.g., Unable to Upload Images in Listings',
          description: 'Please describe the technical issue you are facing. Include error messages, steps to reproduce, and device/browser info...',
          showMobile: true
        };
      case 'Feature Request':
        return {
          title: 'e.g., Add Category for Listings',
          description: 'Describe the feature you would like to see...',
          showMobile: false
        };
      case 'Report A Bug':
        return {
          title: 'e.g., Search Filter Not Working on Mobile',
          description: 'Please describe the bug, steps to reproduce it, and type your device/browser information...',
          showMobile: false
        };
      case 'Other':
        return {
          title: 'Enter the subject of your enquiry',
          description: 'Please provide detailed information about your enquiry...',
          showMobile: true
        };
      default:
        return {
          title: 'Enter the subject / title',
          description: 'Describe your request or issue...',
          showMobile: false
        };
    }
  };

  const placeholders = getPlaceholders();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isHoneypotTriggered(honeypot)) {
      toast.error('Bot submission blocked.');
      return;
    }

    if (isFormSubmittedTooQuickly(formLoadTime)) {
      toast.error('Form submitted too quickly. Please try again.');
      return;
    }

    const selectedOption = option === 'Other' ? otherOption : option;

    const validationErrors = validateContactForm({
      title,
      senderName: name,
      senderEmail: email,
      category: selectedOption,
      message: description,
      mobile: placeholders.showMobile ? mobile : undefined,
    });

    // Inline errors under each field carry the specifics; the toast is one generic
    // attention-grabber (forms.md §5 & §7).
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Form Errors — please fix the highlighted fields.');
      return;
    }

    setErrors({});

    dispatch(
      submitContact({
        title: sanitizeInput(title),
        category: sanitizeInput(selectedOption),
        senderName: sanitizeInput(name),
        senderEmail: sanitizeInput(email),
        message: sanitizeInput(description),
        mobile: placeholders.showMobile ? sanitizeInput(mobile) : undefined,
        captchaToken,
      })
    )
    .unwrap()
    .then(() => {
      setTitle('');
      if (!user) {
        setName('');
        setEmail('');
      }
      setMobile('');
      setOption('');
      setOtherOption('');
      setDescription('');
      setCaptchaToken(null);
      setHoneypot('');
      setFormLoadTime(Date.now());

      toast.success('Message submitted successfully.');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    })
      .catch((err) => {
        toast.error(err || 'Failed to submit. Please try again.');
      });
  };

  return (
    <>
      {/* Top toolbar — Cancel (left), above the title (forms.md §9) */}
      <div className="mb-4 flex items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 bg-teal-700 text-white hover:bg-teal-800 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors"
        >
          ✕ Cancel
        </button>
      </div>

      {/* Page title — centered, below the toolbar (forms.md §2) */}
      <div className="text-center mb-6">
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-teal-900 leading-tight">Contact Us</h1>
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

        {/* Enquiry Type */}
        <div>
          <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
            Enquiry Type <span className="text-red-500">*</span>
          </label>
          <SimpleDropdown
            value={option}
            onChange={(value) => {
              setOption(value);
              clearError('category');
            }}
            options={ENQUIRY_OPTIONS}
            placeholder="Select enquiry type"
          />
          {option !== 'Other' && errors?.category && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.category}</p>
          )}
        </div>

        {/* Specify enquiry type — only when "Other" is chosen */}
        {option === 'Other' && (
          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
              Specify Enquiry Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={getFieldClasses('category')}
              value={otherOption}
              onChange={(e) => {
                setOtherOption(e.target.value);
                clearError('category');
              }}
              placeholder="Specify your enquiry type"
            />
            {errors?.category && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.category}</p>
            )}
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={getFieldClasses('title')}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError('title');
            }}
            placeholder={placeholders.title}
          />
          {errors?.title && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
            Name <span className="text-red-500">*</span>
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
          {errors?.senderName && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.senderName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
            Email <span className="text-red-500">*</span>
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
          {errors?.senderEmail && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.senderEmail}</p>
          )}
        </div>

        {/* Mobile — shown only for enquiry types that need a callback */}
        {placeholders.showMobile && (
          <div>
            <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
              Mobile Number
            </label>
            <input
              type="tel"
              className={getFieldClasses('mobile')}
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                clearError('mobile');
              }}
              placeholder="Your Mobile Number"
            />
            {errors?.mobile && (
              <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.mobile}</p>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block font-medium mb-2 text-slate-600 text-sm sm:text-base">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            className={`${getFieldClasses('message')} min-h-[12rem] sm:min-h-[10rem] resize-none sm:resize-y`}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearError('message');
            }}
            placeholder={placeholders.description}
            maxLength={2000}
          />
          {errors?.message ? (
            <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.message}</p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">{description.length}/2000</p>
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
            disabled={isSubmitting || !captchaToken}
            className={`px-6 py-2 text-sm sm:text-base rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubmitting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-teal-700 hover:bg-teal-800'
            }`}
          >
            {isSubmitting ? (
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

export default ContactForm;

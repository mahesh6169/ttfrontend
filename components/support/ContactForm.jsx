'use client';

import { useState, useEffect } from 'react';
import {  useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { submitContact } from '@/store/slices/supportSlice';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import { isFormSubmittedTooQuickly, isHoneypotTriggered } from '@/utils/forms/antiBot';
import { validateContactForm, sanitizeInput } from '@/utils/forms/validation';

const ContactForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

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

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

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

    const errors = validateContactForm({
      title,
      senderName: name,
      senderEmail: email,
      category: selectedOption,
      message: description,
      mobile: placeholders.showMobile ? mobile : undefined,
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
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Contact Us</h2>
      <form onSubmit={handleSubmit}>
        {/* Honeypot field (hidden) */}
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholders.title}
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
          placeholder="Your Email"
        />

        {placeholders.showMobile && (
          <input
            type="tel"
            className="w-full border p-2 rounded mb-2"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Your Mobile Number"
          />
        )}

        <select
          className="w-full border p-2 rounded mb-2"
          value={option}
          onChange={(e) => setOption(e.target.value)}
        >
          <option value="" disabled>Select enquiry type</option>
          <option value="Advertisement Enquiry">Advertisement Enquiry</option>
          <option value="Hosting Event Enquiry">Hosting Event Enquiry</option>
          <option value="Feature Request">Feature Request</option>
          <option value="Report A Bug">Report A Bug</option>
          <option value="Technical Support">Technical Support</option>
          <option value="Other">Other</option>
        </select>

        {option === 'Other' && (
          <input
            type="text"
            className="w-full border p-2 rounded mb-2"
            value={otherOption}
            onChange={(e) => setOtherOption(e.target.value)}
            placeholder="Specify your enquiry type"
          />
        )}

        <textarea
          className="w-full border p-2 rounded mb-2"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={placeholders.description}
        />

        <div className="flex justify-center my-2">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
          />
        </div>

        <button
          type="submit"
          className="bg-teal-600 text-lime-100 hover:bg-teal-700 hover:text-lime-100 px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default ContactForm;

'use client';

import { useState, useEffect } from 'react';
import {  useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { submitContact } from '@/store/slices/supportSlice';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import { isFormSubmittedTooQuickly, isHoneypotTriggered } from '@/utils/forms/antiBot';
import { validateContactForm, sanitizeInput } from '@/utils/forms/validation';

const ContactForm = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const [captchaToken, setCaptchaToken] = useState(null);
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [option, setOption] = useState('Feature Request');
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
      setOption('Feature Request');
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
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-6">
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
          placeholder="Enter the subject / title"
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

        <select
          className="w-full border p-2 rounded mb-2"
          value={option}
          onChange={(e) => setOption(e.target.value)}
        >
          <option>Feature Request</option>
          <option>Advertisement</option>
          <option>Technical Support</option>
          <option>Bug Report</option>
          <option>Other</option>
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
          placeholder="Describe your request or issue..."
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

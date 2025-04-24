'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { submitContact, resetContactStatus } from '@/store/slices/supportSlice';
import ReCAPTCHA from 'react-google-recaptcha';

const ContactForm = () => {
  const dispatch = useDispatch();
  const { contactStatus, contactError } = useSelector((state) => state.support);
  const [captchaToken, setCaptchaToken] = useState(null);

  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [option, setOption] = useState('Feature Request');
  const [otherOption, setOtherOption] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    return () => {
      dispatch(resetContactStatus());
    };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedOption = option === 'Other' ? otherOption : option;

    dispatch(
      submitContact({
        title,
        category: selectedOption,
        senderName: name,
        senderEmail: email,
        message: description,
        captchaToken,
      })
    )
      .unwrap()
      .then(() => {
        setTitle('');
        setName('');
        setEmail('');
        setOption('Feature Request');
        setOtherOption('');
        setDescription('');
        setCaptchaToken(null); 
      });
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Contact Us</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="w-full border p-2 rounded mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter the subject / title"
          required
        />

        <input
          type="text"
          className="w-full border p-2 rounded mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name"
          required
        />

        <input
          type="email"
          className="w-full border p-2 rounded mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your Email"
          required
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
            required
          />
        )}

        <textarea
          required
          className="w-full border p-2 rounded mb-2"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your request or issue..."
        />

        {/* ✅ CAPTCHA integration here */}
        <div className="flex justify-center my-2">
          <ReCAPTCHA
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            onChange={(token) => setCaptchaToken(token)}
            onExpired={() => setCaptchaToken(null)}
          />
        </div>

        <button
          type="submit"
          disabled={contactStatus === 'loading'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {contactStatus === 'loading' ? 'Submitting...' : 'Submit'}
        </button>

        {contactStatus === 'success' && (
          <p className="text-green-600 mt-2">Message submitted successfully.</p>
        )}
        {contactStatus === 'failed' && (
          <p className="text-red-600 mt-2">
            Something went wrong. {contactError || 'Please try again.'}
          </p>
        )}
      </form>
    </div>
  );
};

export default ContactForm;

'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { submitReport, resetReportStatus } from '@/store/slices/supportSlice';
import ReCAPTCHA from 'react-google-recaptcha';


const ReportForm = () => {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { reportStatus, reportError } = useSelector((state) => state.support);
  const [captchaToken, setCaptchaToken] = useState(null);

  const title = searchParams.get('title') || '';
  const id = searchParams.get('id') || '';
  const type = searchParams.get('type') || 'advert';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      dispatch(resetReportStatus());
    };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!captchaToken) {
      alert('Please complete the CAPTCHA before submitting.');
      return;
    }
  
    dispatch(
      submitReport({
        title,
        id,
        type,
        message,
        senderName: name,
        senderEmail: email,
        captchaToken, // 👈 Include the token in your payload
      })
    )
      .unwrap()
      .then(() => {
        setMessage('');
        setCaptchaToken(null); // Optional: Reset CAPTCHA after successful submission
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
          className="w-full border p-2 rounded mb-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your Name (optional)"
        />

        <input
          type="email"
          className="w-full border p-2 rounded mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your Email (optional but helpful)"
        />

        <textarea
          required
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


        <button
          type="submit"
          disabled={reportStatus === 'loading'}
          className="bg-teal-600  text-lime-100 hover:bg-teal-700 hover:text-lime-100 px-4 py-2 rounded  disabled:opacity-50"
        >
          {reportStatus === 'loading' ? 'Submitting...' : 'Submit Report'}
        </button>

        {reportStatus === 'success' && (
          <p className="text-green-600 mt-2">Report submitted successfully.</p>
        )}
        {reportStatus === 'failed' && (
          <p className="text-red-600 mt-2">
            Something went wrong. {reportError || 'Please try again.'}
          </p>
        )}
      </form>
    </div>
  );
};

export default ReportForm;

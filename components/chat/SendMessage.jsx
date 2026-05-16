'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage } from '@/store/slices/shared/messageSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CgProfile } from 'react-icons/cg';
import { toast } from 'react-toastify';
import { zonedTimeToUtc } from 'date-fns-tz';

const SendMessage = ({
  resourceId,
  resourceType = 'advert',
  participantId,
  owner,
  preserveRedirectUrl,
  isCurated = false,
  listingTitle = '',
  onTextareaFocus,
  onTextareaBlur,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const user = useSelector((state) => state.user.user);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Message content cannot be empty.');
      return;
    }

    if (!resourceId || !participantId) {
      console.error('Missing required IDs:', {
        resourceType,
        resourceId,
        participantId,
      });
      toast.error(
        'Resource ID and participantID are required to send a message.'
      );
      return;
    }

    const localNow = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const utcNow = zonedTimeToUtc(localNow, timeZone); // ✅ Correctly convert to UTC

    setSending(true);
    const toastId = toast.loading('Sending message...');

    try {
      await dispatch(
        sendMessage({
          resourceId,
          resourceType,
          participantId,
          message,
          createdAt: utcNow.toISOString(),
        })
      ).unwrap();
      setMessage('');
      toast.update(toastId, {
        render: 'Message sent successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Extract error message from Redux rejection
      const errorMessage = err || 'Failed to send the message. Please try again.';
      
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000, // Longer duration for error messages
      });
    } finally {
      setSending(false);
    }
  };

  const handleLoginRedirect = () => {
    if (preserveRedirectUrl) {
      localStorage.setItem('redirectAfterLogin', preserveRedirectUrl);
    }
    router.push('/login?preserveRedirect=true');
  };

  // Show different content for curated listings/deals (posted on behalf of providers)
  if (isCurated) {
    // Dynamic text based on resource type
    const resourceLabel = resourceType === 'deal' ? 'deal' : 'listing';
    const removalType = resourceType === 'deal' ? 'deal' : 'listing';

    return (
      <div className="border border-slate-200 p-3 rounded shadow-md w-full">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Get in touch</h2>
        <p className="text-sm text-slate-700 mb-4">
          This {resourceLabel} was posted on behalf of the owner. Please use the contact details provided to reach them directly.
        </p>
        {/* Only show removal link for listings, not deals (deals require business approval) */}
        {resourceType !== 'deal' && (
          <p className="text-xs text-slate-500">
            Are you the business owner?{' '}
            <Link
              href={`/support/removal?type=${removalType}&id=${resourceId}&title=${encodeURIComponent(listingTitle)}`}
              onClick={() => {
                localStorage.setItem('removalReturnUrl', preserveRedirectUrl);
              }}
              className="text-slate-700 hover:text-slate-900 underline"
            >
              Request removal of this {resourceLabel}
            </Link>
          </p>
        )}
      </div>
    );
  }

  // Dynamic placeholder based on resource type
  const getPlaceholder = () => {
    if (!user) return 'Please login to send a message';
    switch (resourceType) {
      case 'advert': return 'Enquire about this listing...';
      case 'event': return 'Enquire about this event...';
      case 'deal': return 'Enquire about this deal...';
      default: return 'Type your message...';
    }
  };

  return (
    <div className="border border-slate-200 p-3 rounded shadow-md w-full">
      <p className="flex items-center mb-2 text-sm">
        <CgProfile className="mr-2 text-slate-600" size={20} />
        <span className="text-slate-700">{owner || 'User'}</span>
      </p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onFocus={onTextareaFocus}
        onBlur={onTextareaBlur}
        disabled={!user || sending}
        placeholder={getPlaceholder()}
        className={`w-full border border-slate-200 rounded p-2 mb-3 resize-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm ${
          !user ? 'bg-slate-100 cursor-not-allowed' : ''
        }`}
        rows={3}
      />

      {user ? (
        <button
          onClick={handleSendMessage}
          disabled={sending}
          className={`ml-auto bg-teal-700 text-white hover:bg-teal-800 px-6 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors ${
            sending ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      ) : (
        <button
          onClick={handleLoginRedirect}
          className="ml-auto py-2 px-6 bg-teal-700 text-white rounded hover:bg-teal-800"
        >
          Login
        </button>
      )}
    </div>
  );
};

export default SendMessage;

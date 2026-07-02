'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage } from '@/store/slices/shared/messageSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CgProfile } from 'react-icons/cg';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
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
      <div className="p-3 w-full border-t lg:border-t-0 lg:border-l border-slate-200">
        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-3">Get in touch</h2>
        <p className="text-sm text-slate-700 mb-4">
          This {resourceLabel} was posted on behalf of the owner. Please use the contact details provided to reach them directly.
        </p>
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
    <div className="p-3 w-full border-t lg:border-t-0 lg:border-l border-slate-200">
      <p className="flex items-center mb-2 text-sm sm:text-base font-semibold text-slate-900">
        <CgProfile className="mr-2" size={20} />
        <span>Chat with {owner || 'User'}</span>
      </p>

      <div className={`border border-slate-200 rounded-lg overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all ${!user ? 'bg-slate-50' : 'bg-white'}`}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={onTextareaFocus}
          onBlur={onTextareaBlur}
          disabled={!user || sending}
          placeholder={getPlaceholder()}
          className={`w-full border-0 px-3 pt-3 pb-1 resize-none focus:outline-none focus:ring-0 text-base bg-transparent ${
            !user ? 'cursor-not-allowed' : ''
          }`}
          rows={3}
        />
        <div className="flex justify-end items-center px-2 pb-2">
          {user ? (
            <button
              onClick={handleSendMessage}
              disabled={sending || !message.trim()}
              className="bg-teal-700 text-white hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed h-8 w-8 rounded-md transition-colors flex items-center justify-center"
              aria-label={sending ? 'Sending message' : 'Send message'}
              title="Send"
            >
              {sending ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <FaPaperPlane size={13} />
              )}
            </button>
          ) : (
            <button
              onClick={handleLoginRedirect}
              className="text-sm bg-teal-700 text-white hover:bg-teal-800 px-3 py-1.5 rounded-md transition-colors"
            >
              Login to send
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendMessage;

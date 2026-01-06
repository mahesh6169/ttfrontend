'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage } from '@/store/slices/shared/messageSlice';
import { useRouter } from 'next/navigation';
import { CgProfile } from 'react-icons/cg';
import { toast } from 'react-toastify';
import { zonedTimeToUtc } from 'date-fns-tz';

const SendMessage = ({
  resourceId,
  resourceType = 'advert',
  participantId,
  owner,
  preserveRedirectUrl,
  isPostedBySupport = false,
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

  // Show different content for listings/events posted by support on behalf of users
  if (isPostedBySupport) {
    return (
      <div className="border p-2 rounded shadow-md w-full">
        <h2 className="text-lg font-semibold mb-2">Get in touch</h2>
        <div className="w-full border rounded p-3 bg-gray-50 text-sm text-gray-600">
          This listing was posted on behalf of the owner. Please use the contact details provided in the listing to reach them directly.
        </div>
      </div>
    );
  }

  return (
    <div className="border p-2 rounded shadow-md w-full">
      <h2 className="text-lg font-semibold mb-2">Get in touch</h2>
      <p className="flex items-center mb-2">
        <CgProfile className="mr-2 text-gray-700" size={24} />
        {owner || 'User'}
      </p>
      <p className="mb-2 text-sm text-gray-600">Enquire about the listing</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={!user || sending}
        placeholder={
          user ? 'Type your message here' : 'Please login to type a message'
        }
        className={`w-full border rounded p-2 mb-4 resize-none ${
          !user ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
        rows={4}
      />

      {user ? (
        <button
          onClick={handleSendMessage}
          disabled={sending}
          className={`w-full bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900 px-4 py-2 rounded shadow font-semibold text-sm md:text-base transition-colors ${
            sending ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      ) : (
        <button
          onClick={handleLoginRedirect}
          className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Login to Send Message
        </button>
      )}
    </div>
  );
};

export default SendMessage;

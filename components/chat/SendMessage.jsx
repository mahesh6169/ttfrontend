'use client';

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendMessage } from '@/store/slices/messageSlice';
import { useRouter } from 'next/navigation';
import { CgProfile } from 'react-icons/cg';
import { toast } from 'react-toastify';

const SendMessage = ({ advertId, participantId, owner, preserveRedirectUrl }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const user = useSelector((state) => state.user.user); // Get current user from redux
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Message content cannot be empty.');
      return;
    }

    if (!advertId || !participantId) {
      console.error('Missing required IDs:', { advertId, participantId });
      toast.error('Advert ID and participantID are required to send a message.');
      return;
    }

    setSending(true);
    const toastId = toast.loading('Sending message...');

    try {
      const messageData = { advertId, participantId, message };
      await dispatch(sendMessage(messageData)).unwrap();
      setMessage('');
      toast.update(toastId, {
        render: 'Message sent successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      toast.update(toastId, {
        render: err.message || 'Failed to send the message. Please try again.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setSending(false);
    }
  };

  const handleLoginRedirect = () => {
    if (preserveRedirectUrl) {
      localStorage.setItem('redirectAfterLogin', preserveRedirectUrl);
    }
    router.push('/users/login?preserveRedirect=true');
  };

  return (
    <div className="border p-4 rounded shadow-md bg-white">
      {/* Title */}
      <h2 className="text-lg font-semibold mb-2">Get in touch</h2>

      {/* Owner Info */}
      <p className="flex items-center mb-2">
        <CgProfile className="mr-2 text-gray-700" size={24} />
        {owner || 'User'}
      </p>

      {/* Enquire Text */}
      <p className="mb-4 text-sm text-gray-600">Enquire about the listing</p>

      {/* Message Input */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={!user || sending}
        placeholder={user ? 'Type your message here' : 'Please login to type a message'}
        className={`w-full border rounded p-2 mb-4 resize-none ${
          !user ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
        rows={4}
      />

      {/* Button Section */}
      {user ? (
        <button
          onClick={handleSendMessage}
          disabled={sending}
          className={`w-full py-2 px-4 bg-blue-600 text-white rounded ${
            sending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
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

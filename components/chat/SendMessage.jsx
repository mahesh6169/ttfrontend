'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { sendMessage } from '@/store/slices/messageSlice';
import { CgProfile } from 'react-icons/cg';

const SendMessage = ({ advertId, participantId, owner }) => {
  //console.log('SendMessage Component:', { advertId, participantId, owner });
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert('Message content cannot be empty.');
      return;
    }

    if (!advertId || !participantId) {
      console.error('Missing required IDs:', { advertId, participantId });
      alert('Advert ID and participantID are required to send a message.');
      return;
    }

    setSending(true);

    try {
      const messageData = {
        advertId,
        participantId,
        message,
      };

      await dispatch(sendMessage(messageData)).unwrap();
      setMessage('');
      alert('Message sent successfully!');
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err.message || 'Failed to send the message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border p-4 rounded shadow-md bg-white">
      {/* Owner Section */}
      <h2 className=" text-center text-xl font-bold mb-2">Get in touch</h2>
      <h2 className="flex items-center text-xl font-bold mb-2">
        <CgProfile className="mr-2 text-gray-700" size={24} />
        {owner || 'Unknown'}
      </h2>
  
      {/* Heading */}
      <h3 className="text-lg font-semibold mb-4">Enquire about the listing</h3>
  
      {/* Input and Button */}
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here"
          className="w-full p-4 h-40 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
          disabled={sending}
        />
        <button
          onClick={handleSendMessage}
          disabled={sending}
          className={`mt-4 w-full p-2 bg-blue-600 text-white font-medium rounded-md ${
            sending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
          } transition`}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
  
};

export default SendMessage;

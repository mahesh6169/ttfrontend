"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { sendMessage } from "@/store/slices/messageSlice";

export default function ChatContainer({ advertId, otherUserId, messages, advert }) {
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;

    // Our backend expects: { advertId, participantId, message }
    // participantId must be the actual participant’s ID if we are the owner,
    // or our own ID if we are the participant.
    // For simplicity, we'll assume the "otherUser" is the participant.

    dispatch(sendMessage({
      advertId,
      participantId: otherUserId, 
      message: newMessage
    }));

    setNewMessage("");
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>
      {/* Scrollable Message List */}
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          marginBottom: "1rem",
          border: "1px solid #ddd",
          padding: "0.5rem",
        }}
      >
        {messages.map((msg) => (
          <div key={msg._id} style={{ margin: "0.5rem 0" }}>
            <strong>{msg.senderRole}:</strong> {msg.message}
          </div>
        ))}
      </div>

      {/* Input and Send Button */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          style={{ flex: 1 }}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

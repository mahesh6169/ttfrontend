"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { sendMessage } from "@/store/slices/messageSlice";

export default function ChatContainer({ resourceId, resourceType, otherUserId, messages, resource }) {
  const dispatch = useDispatch();
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim()) return;

    dispatch(
      sendMessage({
        resourceId,         // supports advert or event
        resourceType,       // "advert" or "event"
        participantId: otherUserId,
        message: newMessage,
      })
    );

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

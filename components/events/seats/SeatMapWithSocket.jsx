// components/events/seats/SeatMapWithSocket.jsx
'use client';

import React, { useCallback, useRef } from 'react';
import SeatSocketListenerNoRedux from './SeatSocketListenerNoRedux';
import SeatMapSelectionNoRedux from './SeatMapSelectionNoRedux';

const SeatMapWithSocket = ({
  event,
  ticketRequirement,
  eventId,
  userId,
  existingReservation,
  onSeatsChange
}) => {
  const [socketConnected, setSocketConnected] = React.useState(false);
  const [socketJoinedRoom, setSocketJoinedRoom] = React.useState(false);
  const seatMapRef = useRef();

  // Handle socket updates
  const handleSeatUpdate = useCallback((update) => {
    console.log('🔄 Socket update received:', update);
    
    // Trigger immediate fetch in SeatMapSelectionNoRedux
    if (seatMapRef.current && seatMapRef.current.fetchSeatData) {
      seatMapRef.current.fetchSeatData();
    }
  }, []);

  return (
    <SeatSocketListenerNoRedux
      eventId={eventId}
      onSeatUpdate={handleSeatUpdate}
      onSocketConnected={setSocketConnected}
      onSocketJoinedRoom={setSocketJoinedRoom}
    >
      <SeatMapSelectionNoRedux
        ref={seatMapRef}
        event={event}
        ticketRequirement={ticketRequirement}
        eventId={eventId}
        userId={userId}
        existingReservation={existingReservation}
        onSeatsSelected={onSeatsChange}
        socketConnected={socketConnected}
        socketJoinedRoom={socketJoinedRoom}
      />
    </SeatSocketListenerNoRedux>
  );
};

export default SeatMapWithSocket;
import { io } from 'socket.io-client';

// Socket.IO client connection: Dialing backend server
const socket = io(process.env.NEXT_PUBLIC_BACKEND_BASE_URL, {
   withCredentials: true,
   transports: ['websocket', 'polling'], // Add polling fallback for mobile
   autoConnect: false,
   reconnection: true,
   reconnectionAttempts: Infinity,
   reconnectionDelay: 1000,
   reconnectionDelayMax: 5000,
   randomizationFactor: 0.5,
   timeout: 20000, // Increase timeout for mobile networks
   // Add API key to auth
   auth: {
     apiKey: process.env.NEXT_PUBLIC_FRONTEND_API_KEY
   },
   // Also add to headers as fallback
   extraHeaders: {
     'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY
   }
});

socket.on('connect', () => {
    // Connection successful
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message); // Logs if there is an error during connection
});

socket.on('disconnect', (reason) => {
    // Socket disconnected
});

socket.on('reconnect_attempt', () => {
    // Attempting to reconnect
});

socket.on('reconnect', (attemptNumber) => {
    // Reconnected
});

socket.on('reconnect_failed', () => {
    console.error('Socket failed to reconnect');
});

export default socket;

import { io } from 'socket.io-client';

// Socket.IO client connection: Dialing backend server
const socket = io(process.env.NEXT_PUBLIC_BACKEND_BASE_URL, {
   withCredentials: true,
   transports: ['websocket'], 
   autoConnect: false,
   reconnection: true,
   reconnectionAttempts: Infinity,
   reconnectionDelay: 1000,
   // Add API key to auth
   auth: {
     apiKey: process.env.NEXT_PUBLIC_FRONTEND_API_KEY
   },
   // Also add to headers as fallback
   extraHeaders: {
     'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY
   }
});

// ✅ Debugging Log: Check if WebSocket connection is being attempted
console.log("Attempting WebSocket connection to:", socket.io.uri);

// Debugging logs for connection lifecycle events
socket.on('connect', () => {
    console.log(`Events Socket Listener connected: ${socket.id}`); // Logs when the socket successfully connects
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error.message); // Logs if there is an error during connection
});

socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${reason}`); // Logs when the socket disconnectss
});

// Additional logs for reconnection events
socket.on('reconnect_attempt', () => {
    console.log('Socket attempting to reconnect...');
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempt(s)`);
});

socket.on('reconnect_failed', () => {
    console.error('Socket failed to reconnect');
});

// Log connection status every 5 seconds
setInterval(() => console.log('FrontEnd Socket Client alive:', socket.connected), 5000);

export default socket;

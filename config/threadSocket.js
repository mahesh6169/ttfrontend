import { io } from 'socket.io-client';

// Create thread socket with proper configuration (matching chat socket config)
const threadSocket = io(process.env.NEXT_PUBLIC_BACKEND_BASE_URL, { 
  withCredentials: true,
  transports: ['websocket', 'polling'], // Add polling fallback for mobile
  autoConnect: false, // Will be managed by ThreadSocketListener
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 20000, // Increase timeout for mobile networks
  // Add API key authentication
  auth: {
    apiKey: process.env.NEXT_PUBLIC_FRONTEND_API_KEY
  },
  extraHeaders: {
    'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY
  }
});

// Add debugging logs
console.log("Thread Socket URI:", process.env.NEXT_PUBLIC_BACKEND_BASE_URL);
console.log("Thread Socket API Key exists:", !!process.env.NEXT_PUBLIC_FRONTEND_API_KEY);

// Export both the socket instance and a reference for imports
export default threadSocket;
export { threadSocket };

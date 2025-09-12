import { io } from 'socket.io-client';

const threadSocket = io(process.env.NEXT_PUBLIC_BACKEND_BASE_URL, { 
  withCredentials: true,
  transports: ['websocket'],
  autoConnect: false,
  // Add API key authentication
  auth: {
    apiKey: process.env.NEXT_PUBLIC_FRONTEND_API_KEY
  },
  extraHeaders: {
    'x-api-key': process.env.NEXT_PUBLIC_FRONTEND_API_KEY
  }
});

threadSocket.on('newThreadMessage', (message) => {
  console.log('New thread message received:', message);
});

export default threadSocket;

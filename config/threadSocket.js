import { io } from 'socket.io-client';

const threadSocket = io(process.env.NEXT_PUBLIC_BACKEND_BASE_URL, { 
  withCredentials: true,
  transports: ['websocket'],
 });

threadSocket.on('newThreadMessage', (message) => {
  console.log('New thread message received:', message);
});

export default threadSocket;

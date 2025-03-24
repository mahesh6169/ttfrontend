import { io } from 'socket.io-client';

const threadSocket = io('http://192.168.168.41:5020', { withCredentials: true });

threadSocket.on('newThreadMessage', (message) => {
  console.log('New thread message received:', message);
});

export default threadSocket;

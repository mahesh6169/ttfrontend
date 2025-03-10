import { io } from 'socket.io-client';

const threadSocket = io('http://192.168.181.115:5015', { withCredentials: true });

threadSocket.on('newThreadMessage', (message) => {
  console.log('New thread message received:', message);
});

export default threadSocket;

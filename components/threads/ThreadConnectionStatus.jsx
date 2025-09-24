'use client';

import { useSelector } from 'react-redux';
import { FaCircle } from 'react-icons/fa';

const ThreadConnectionStatus = () => {
  const socketConnected = useSelector((state) => state.threads.socketConnected);
  const connectionError = useSelector((state) => state.threads.connectionError);
  
  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!socketConnected && !connectionError) {
    return (
      <div className="flex items-center text-yellow-600 text-xs">
        <FaCircle className="w-2 h-2 mr-1" />
        Connecting...
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center text-red-600 text-xs">
        <FaCircle className="w-2 h-2 mr-1" />
        Disconnected
      </div>
    );
  }

  return (
    <div className="flex items-center text-green-600 text-xs">
      <FaCircle className="w-2 h-2 mr-1" />
      Connected
    </div>
  );
};

export default ThreadConnectionStatus;
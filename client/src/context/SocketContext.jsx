import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // array of userIds

  useEffect(() => {
    // Only connect if the user is logged in
    if (!token) return;

    const newSocket = io('http://localhost:5000', {
      auth: { token }, // this is what socket.js middleware reads
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    // Server sends us the current list of online users on connect
    newSocket.on('users:online', (userIds) => {
      setOnlineUsers(userIds);
    });

    // Someone came online
    newSocket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    });

    // Someone went offline
    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    setSocket(newSocket);

    // Cleanup: disconnect when token changes or component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, [token]); // re-runs if token changes (login/logout)

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
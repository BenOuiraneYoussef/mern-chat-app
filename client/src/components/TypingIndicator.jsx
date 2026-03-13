import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const TypingIndicator = ({ roomId }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // { userId: username } — everyone currently typing
  const [typers, setTypers] = useState({});

  useEffect(() => {
    if (!socket) return;

    const handleStart = ({ roomId: rId, userId, username }) => {
      if (rId !== roomId) return;
      if (userId === user.id) return; // don't show yourself

      setTypers((prev) => ({ ...prev, [userId]: username }));
    };

    const handleStop = ({ roomId: rId, userId }) => {
      if (rId !== roomId) return;

      setTypers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    socket.on('typing:start', handleStart);
    socket.on('typing:stop', handleStop);

    return () => {
      socket.off('typing:start', handleStart);
      socket.off('typing:stop', handleStop);
    };
  }, [socket, roomId, user.id]);

  const names = Object.values(typers);
  if (names.length === 0) return null; // render nothing when no one is typing

  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing...`
      : 'Several people are typing...';

  return (
    <div style={styles.container}>
      <span style={styles.dots}>
        <span>•</span><span>•</span><span>•</span>
      </span>
      <span style={styles.text}>{text}</span>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 16px 8px',
    minHeight: '24px',
  },
  dots: {
    display: 'flex',
    gap: '2px',
    color: '#4f46e5',
    fontSize: '18px',
    animation: 'pulse 1.2s infinite',
  },
  text: {
    fontSize: '12px',
    color: '#555',
    fontStyle: 'italic',
  },
};

export default TypingIndicator;
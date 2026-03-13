import { useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const MessageInput = ({ roomId }) => {
  const { socket } = useSocket();
  const [content, setContent] = useState('');
  const isTyping = useRef(false);      // tracks whether we're currently typing
  const typingTimer = useRef(null);    // timer to auto-stop typing indicator

  const startTyping = () => {
    if (!isTyping.current) {
      isTyping.current = true;
      socket.emit('typing:start', { roomId });
    }

    // Reset the stop timer on every keystroke
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 1500);
    // If no keystroke for 1.5 seconds → stop typing
  };

  const stopTyping = () => {
    if (isTyping.current) {
      isTyping.current = false;
      socket.emit('typing:stop', { roomId });
    }
    clearTimeout(typingTimer.current);
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    startTyping();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || !socket) return;

    socket.emit('message:send', {
      roomId,
      content: content.trim(),
    });

    setContent('');
    stopTyping(); // make sure typing indicator clears on send
  };

  const handleKeyDown = (e) => {
    // Send on Enter, allow Shift+Enter for newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        style={styles.input}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send)"
        autoComplete="off"
      />
      <button
        type="submit"
        style={{
          ...styles.button,
          opacity: content.trim() ? 1 : 0.4,
        }}
        disabled={!content.trim()}
      >
        Send
      </button>
    </form>
  );
};

const styles = {
  form: {
    display: 'flex',
    gap: '10px',
    padding: '12px 16px 16px',
    borderTop: '1px solid #1a1a1a',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    resize: 'none',
  },
  button: {
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    flexShrink: 0,
  },
};

export default MessageInput;
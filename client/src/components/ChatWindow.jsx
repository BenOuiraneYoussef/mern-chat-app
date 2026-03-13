import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import useMessages from '../hooks/useMessages';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ room }) => {
  const { user } = useAuth();
  const { messages, loading, hasMore, loadMore } = useMessages(room._id);
  const bottomRef = useRef(null);
  const topRef = useRef(null);

  // ─── Auto-scroll to bottom on new messages ──────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Load more when user scrolls to the top ─────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { threshold: 1.0 }
    );
    if (topRef.current) observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOwnMessage = (senderId) => {
    return senderId === user.id || senderId?._id === user.id;
  };

  return (
    <div style={styles.window}>

      {/* Room header */}
      <div style={styles.header}>
        <span style={styles.roomName}># {room.name}</span>
        {room.description && (
          <span style={styles.roomDesc}>{room.description}</span>
        )}
      </div>

      {/* Message list */}
      <div style={styles.messageList}>

        {/* Invisible div at the top — triggers loadMore when visible */}
        <div ref={topRef} style={styles.loadTrigger}>
          {loading && <span style={styles.loadingText}>Loading...</span>}
          {!hasMore && messages.length > 0 && (
            <span style={styles.loadingText}>Beginning of #{room.name}</span>
          )}
        </div>

        {messages.length === 0 && !loading && (
          <div style={styles.emptyRoom}>
            <p style={styles.emptyIcon}>👋</p>
            <p style={styles.emptyText}>
              This is the start of <strong>#{room.name}</strong>. Say hello!
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const own = isOwnMessage(msg.sender?._id || msg.sender);
          const senderName = msg.sender?.username || 'Unknown';
          const showSender =
            i === 0 || messages[i - 1]?.sender?._id !== msg.sender?._id;
          // Only show username when sender changes — groups consecutive messages

          return (
            <div
              key={msg._id}
              style={{
                ...styles.messageGroup,
                marginTop: showSender ? '16px' : '2px',
              }}
            >
              {showSender && (
                <div style={styles.messageMeta}>
                  <div
                    style={{
                      ...styles.messageAvatar,
                      backgroundColor: own ? '#4f46e5' : '#333',
                    }}
                  >
                    {senderName[0].toUpperCase()}
                  </div>
                  <span style={styles.senderName}>
                    {own ? 'You' : senderName}
                  </span>
                  <span style={styles.timestamp}>
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              )}
              <div
                style={{
                  ...styles.bubble,
                  marginLeft: showSender ? '0' : '34px',
                  backgroundColor: own ? '#1e1e3a' : '#1a1a1a',
                  borderColor: own ? '#2e2e5a' : '#222',
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Invisible div at the bottom — scroll target */}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator sits just above the input */}
      <TypingIndicator roomId={room._id} />

      {/* Message input */}
      <MessageInput roomId={room._id} />

    </div>
  );
};

const styles = {
  window: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '14px 20px',
    borderBottom: '1px solid #1a1a1a',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  roomName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
  },
  roomDesc: {
    fontSize: '13px',
    color: '#555',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px 8px',
    display: 'flex',
    flexDirection: 'column',
  },
  loadTrigger: {
    textAlign: 'center',
    padding: '8px 0',
    minHeight: '24px',
  },
  loadingText: {
    fontSize: '12px',
    color: '#444',
  },
  emptyRoom: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    paddingTop: '60px',
  },
  emptyIcon: {
    fontSize: '40px',
    margin: 0,
  },
  emptyText: {
    color: '#555',
    fontSize: '14px',
    margin: 0,
  },
  messageGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  messageAvatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '700',
    flexShrink: 0,
  },
  senderName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ccc',
  },
  timestamp: {
    fontSize: '11px',
    color: '#444',
  },
  bubble: {
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#ddd',
    border: '1px solid',
    maxWidth: '100%',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
};

export default ChatWindow;

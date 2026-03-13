import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const ChatPage = () => {
  // activeRoom is the room the user is currently viewing
  const [activeRoom, setActiveRoom] = useState(null);

  return (
    <div style={styles.page}>
      <Sidebar activeRoom={activeRoom} onSelectRoom={setActiveRoom} />

      <main style={styles.main}>
        {activeRoom ? (
          <ChatWindow room={activeRoom} />
        ) : (
          <div style={styles.empty}>
            <p style={styles.emptyIcon}>💬</p>
            <p style={styles.emptyText}>Select a room to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#0f0f0f',
    fontFamily: 'system-ui, sans-serif',
    color: '#fff',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    margin: 0,
  },
  emptyText: {
    color: '#555',
    fontSize: '15px',
    margin: 0,
  },
};

export default ChatPage;
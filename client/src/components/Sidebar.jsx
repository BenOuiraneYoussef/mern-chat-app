import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

const Sidebar = ({ activeRoom, onSelectRoom }) => {
  const { user, logout } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');

  // ─── Fetch rooms on mount ───────────────────────────────────
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms');
        setRooms(res.data.rooms);
      } catch (err) {
        console.error('Failed to fetch rooms:', err.message);
      }
    };
    fetchRooms();
  }, []);

  // ─── Listen for new messages to reorder rooms ───────────────
  // When a room gets a new message, bump it to the top of the list
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setRooms((prev) => {
        const updated = prev.map((room) =>
          room._id === message.room
            ? { ...room, lastMessage: message, updatedAt: new Date() }
            : room
        );
        // Sort by most recently active
        return updated.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket]);

  // ─── Select a room ──────────────────────────────────────────
  const handleSelectRoom = (room) => {
    onSelectRoom(room);

    // Tell the server we joined this room's socket channel
    socket.emit('room:join', { roomId: room._id });
  };

  // ─── Create a new room ──────────────────────────────────────
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const res = await api.post('/rooms', { name: newRoomName.trim() });
      const room = res.data.room;

      setRooms((prev) => [room, ...prev]);
      setNewRoomName('');
      setShowInput(false);
      setError('');

      // Immediately select and join the new room
      handleSelectRoom(room);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create room');
    }
  };

  const isOnline = (userId) => onlineUsers.includes(userId?.toString());

  return (
    <aside style={styles.sidebar}>

      {/* User profile strip at the top */}
      <div style={styles.profile}>
        <div style={styles.avatar}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div style={styles.profileInfo}>
          <span style={styles.username}>{user?.username}</span>
          <span style={styles.onlineBadge}>● Online</span>
        </div>
        <button style={styles.logoutBtn} onClick={logout} title="Logout">
          ⎋
        </button>
      </div>

      {/* Room list header */}
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Rooms</span>
        <button
          style={styles.addBtn}
          onClick={() => { setShowInput((v) => !v); setError(''); }}
          title="Create room"
        >
          +
        </button>
      </div>

      {/* New room input */}
      {showInput && (
        <form onSubmit={handleCreateRoom} style={styles.newRoomForm}>
          <input
            style={styles.newRoomInput}
            value={newRoomName}
            onChange={(e) => { setNewRoomName(e.target.value); setError(''); }}
            placeholder="Room name..."
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.newRoomActions}>
            <button type="submit" style={styles.createBtn}>Create</button>
            <button
              type="button"
              style={styles.cancelBtn}
              onClick={() => { setShowInput(false); setNewRoomName(''); setError(''); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Room list */}
      <ul style={styles.roomList}>
        {rooms.length === 0 && (
          <li style={styles.noRooms}>No rooms yet. Create one!</li>
        )}
        {rooms.map((room) => (
          <li
            key={room._id}
            style={{
              ...styles.roomItem,
              ...(activeRoom?._id === room._id ? styles.roomItemActive : {}),
            }}
            onClick={() => handleSelectRoom(room)}
          >
            <span style={styles.roomHash}>#</span>
            <div style={styles.roomInfo}>
              <span style={styles.roomName}>{room.name}</span>
              {room.lastMessage && (
                <span style={styles.lastMessage}>
                  {room.lastMessage.sender?.username}: {room.lastMessage.content}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>

    </aside>
  );
};

// ─── Styles ────────────────────────────────────────────────────
const styles = {
  sidebar: {
    width: '260px',
    minWidth: '260px',
    backgroundColor: '#111',
    borderRight: '1px solid #222',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  profile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px',
    borderBottom: '1px solid #222',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  username: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  onlineBadge: {
    fontSize: '11px',
    color: '#22c55e',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 8px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  addBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: '20px',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0 4px',
  },
  newRoomForm: {
    padding: '0 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  newRoomInput: {
    backgroundColor: '#0f0f0f',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    padding: '8px 10px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  newRoomActions: {
    display: 'flex',
    gap: '6px',
  },
  createBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '7px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#222',
    color: '#aaa',
    border: 'none',
    borderRadius: '6px',
    padding: '7px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  error: {
    color: '#ff4444',
    fontSize: '12px',
    margin: 0,
  },
  roomList: {
    listStyle: 'none',
    margin: 0,
    padding: '4px 8px',
    overflowY: 'auto',
    flex: 1,
  },
  noRooms: {
    color: '#444',
    fontSize: '13px',
    padding: '12px 8px',
    textAlign: 'center',
  },
  roomItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  roomItemActive: {
    backgroundColor: '#1e1e2e',
  },
  roomHash: {
    color: '#555',
    fontSize: '16px',
    flexShrink: 0,
  },
  roomInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  roomName: {
    fontSize: '14px',
    color: '#ddd',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  lastMessage: {
    fontSize: '12px',
    color: '#555',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

export default Sidebar;
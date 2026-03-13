import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

const useMessages = (roomId) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // ─── Fetch history when room changes ───────────────────────
  useEffect(() => {
    if (!roomId) return;

    // Reset state when switching rooms
    setMessages([]);
    setPage(1);
    setHasMore(false);

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/messages/${roomId}?page=1&limit=30`);
        setMessages(res.data.messages);
        setHasMore(res.data.pagination.hasMore);
      } catch (err) {
        console.error('Failed to fetch messages:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId]);

  // ─── Load older messages (pagination) ──────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const nextPage = page + 1;
    setLoading(true);

    try {
      const res = await api.get(`/messages/${roomId}?page=${nextPage}&limit=30`);

      // Prepend older messages to the top
      setMessages((prev) => [...res.data.messages, ...prev]);
      setHasMore(res.data.pagination.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more:', err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId, page, hasMore, loading]);

  // ─── Listen for incoming messages via socket ────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleNewMessage = (message) => {
      // Only add if it belongs to the current room
      if (message.room !== roomId) return;

      setMessages((prev) => {
        // Prevent duplicates (in case of reconnects)
        const exists = prev.some((m) => m._id === message._id);
        return exists ? prev : [...prev, message];
      });
    };

    socket.on('message:new', handleNewMessage);
    return () => socket.off('message:new', handleNewMessage);
  }, [socket, roomId]);

  return { messages, loading, hasMore, loadMore };
};

export default useMessages;
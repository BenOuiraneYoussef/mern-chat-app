const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');

// Tracks who's online: { userId -> socketId }
const onlineUsers = new Map();

module.exports = (io) => {

  // ─── AUTH MIDDLEWARE ────────────────────────────────────────
  // Runs before every connection is accepted
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      // Client sends: io({ auth: { token: '...' } })

      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket so all event handlers can access it
      socket.userId = user._id.toString();
      socket.user = user;
      next(); // accept the connection

    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ─── ON CONNECTION ──────────────────────────────────────────
  io.on('connection', async (socket) => {
    console.log(`🔌 Connected: ${socket.user.username}`);

    // Mark user as online
    onlineUsers.set(socket.userId, socket.id);
    await User.findByIdAndUpdate(socket.userId, { isOnline: true });

    // Tell everyone this user came online
    socket.broadcast.emit('user:online', {
      userId: socket.userId,
      username: socket.user.username,
    });

    // Tell the newly connected user who else is online
    socket.emit('users:online', Array.from(onlineUsers.keys()));

    // Auto-join all rooms this user is a member of
    const userRooms = await Room.find({ members: socket.userId });
    userRooms.forEach((room) => {
      socket.join(room._id.toString());
    });

    // ─── JOIN A ROOM ──────────────────────────────────────────
    socket.on('room:join', async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });

        // Add to members if not already in
        if (!room.members.includes(socket.userId)) {
          room.members.push(socket.userId);
          await room.save();
        }

        socket.join(roomId); // joins the Socket.io "room" (like a channel)

        // Confirm to the user they joined
        socket.emit('room:joined', { roomId });

        // Notify other room members
        socket.to(roomId).emit('room:user_joined', {
          roomId,
          user: { id: socket.userId, username: socket.user.username },
        });

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── LEAVE A ROOM ─────────────────────────────────────────
    socket.on('room:leave', ({ roomId }) => {
      socket.leave(roomId);

      socket.to(roomId).emit('room:user_left', {
        roomId,
        user: { id: socket.userId, username: socket.user.username },
      });
    });

    // ─── SEND A MESSAGE ───────────────────────────────────────
    socket.on('message:send', async ({ roomId, content }) => {
      try {
        // Ignore empty messages
        if (!content?.trim()) return;

        // Save to database
        const message = await Message.create({
          room: roomId,
          sender: socket.userId,
          content: content.trim(),
        });

        // Populate sender info so the client gets full user data
        await message.populate('sender', 'username avatar');

        // Update room's lastMessage pointer
        await Room.findByIdAndUpdate(roomId, {
          lastMessage: message._id,
          updatedAt: new Date(),
        });

        // Broadcast to EVERYONE in the room (including sender)
        // so the sender sees their own message appear
        io.to(roomId).emit('message:new', message);

      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ─── TYPING INDICATORS ────────────────────────────────────
    socket.on('typing:start', ({ roomId }) => {
      // Tell everyone EXCEPT the typer
      socket.to(roomId).emit('typing:start', {
        roomId,
        userId: socket.userId,
        username: socket.user.username,
      });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:stop', {
        roomId,
        userId: socket.userId,
      });
    });

    // ─── DISCONNECT ───────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔌 Disconnected: ${socket.user.username}`);

      onlineUsers.delete(socket.userId);
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Tell everyone this user went offline
      socket.broadcast.emit('user:offline', {
        userId: socket.userId,
        username: socket.user.username,
      });
    });
  });
};
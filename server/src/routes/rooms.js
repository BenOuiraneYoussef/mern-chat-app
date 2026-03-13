const express = require('express');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes below require a valid JWT
router.use(authMiddleware);

// ─── GET /api/rooms ───────────────────────────────────────────
// Get all public rooms + any private rooms the user is in
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false },
        { members: req.user._id }
      ]
    })
      .populate('createdBy', 'username avatar')   // replace ID with user data
      .populate('lastMessage')                     // replace ID with message data
      .sort({ updatedAt: -1 });                    // most recently active first

    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/rooms/:id ───────────────────────────────────────
// Get a single room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('members', 'username avatar isOnline')
      .populate('createdBy', 'username avatar');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Block access to private rooms for non-members
    if (room.isPrivate && !room.members.some(m => m._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/rooms ──────────────────────────────────────────
// Create a new room
router.post('/', async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    // Check if a public room with that name already exists
    const existing = await Room.findOne({ name: name.trim(), isPrivate: false });
    if (existing) {
      return res.status(409).json({ message: 'A room with that name already exists' });
    }

    const room = await Room.create({
      name: name.trim(),
      description: description?.trim() || '',
      isPrivate: isPrivate || false,
      members: [req.user._id],   // creator is automatically a member
      createdBy: req.user._id,
    });

    await room.populate('createdBy', 'username avatar');

    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/rooms/:id/join ─────────────────────────────────
// Join a public room via HTTP (Socket.io handles the real-time side)
router.post('/:id/join', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isPrivate) {
      return res.status(403).json({ message: 'Cannot join a private room this way' });
    }

    // Only add if not already a member
    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    res.json({ message: 'Joined successfully', roomId: room._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/rooms/:id ────────────────────────────────────
// Delete a room — only the creator can do this
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the room creator can delete it' });
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
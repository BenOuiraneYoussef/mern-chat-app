const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// ─── GET /api/messages/:roomId ────────────────────────────────
// Fetch message history for a room (paginated)
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;   // ?page=2
    const limit = parseInt(req.query.limit) || 30; // 30 messages per page
    const skip = (page - 1) * limit;

    // Make sure the room exists and user has access
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.isPrivate && !room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })  // newest first from DB...
      .skip(skip)
      .limit(limit);

    // ...then reverse so oldest is at the top in the UI
    const ordered = messages.reverse();

    const total = await Message.countDocuments({ room: roomId });

    res.json({
      messages: ordered,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,  // are there older messages to load?
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
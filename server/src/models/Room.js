const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  isPrivate: {
    type: Boolean,
    default: false, // public rooms anyone can join
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // reference to the User collection
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
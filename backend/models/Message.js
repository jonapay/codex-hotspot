const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    mediaUrl: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);

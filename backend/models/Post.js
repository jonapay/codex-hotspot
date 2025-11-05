const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      radius: {
        type: Number,
        default: 500,
      },
    },
    opensAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

PostSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'mention', 'like', 'story_like', 'follow', 'comment', 'story_reply', 'reply',
      'tag', 'follow_request', 'accept_request', 'follow_accepted', 'story', 'reel',
      'save', 'system',
      // Phase T — download notification types
      'story_downloaded', 'reel_downloaded'
    ],
    required: true
  },
  // Reference to the downloaded Story or Reel (optional, for deep-linking)
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // 'story' | 'reel' — used when contentId is set
  contentType: {
    type: String,
    enum: ['story', 'reel', 'post', null],
    default: null
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for fast queries on recipient's notifications
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;

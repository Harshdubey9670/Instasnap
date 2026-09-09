const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  media: [{
    url: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    }
  }],
  stickers: [{
    type: {
      type: String,
      enum: ['poll', 'question', 'quiz', 'countdown', 'gif', 'link', 'mention', 'location'],
      required: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    position: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 50 }
    }
  }],
  music: {
    title: { type: String, default: '' },
    artist: { type: String, default: '' },
    audioUrl: { type: String, default: '' },
    coverUrl: { type: String, default: '' }
  },
  status: {
    type: String,
    enum: ['published', 'scheduled'],
    default: 'published'
  },
  scheduledAt: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  privacy: {
    type: String,
    enum: ['public', 'followers', 'close_friends', 'custom'],
    default: 'public'
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  hiddenFrom: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  allowReplies: {
    type: Boolean,
    default: true
  },
  allowSharing: {
    type: Boolean,
    default: true
  },
  allowDownload: {
    type: Boolean,
    default: true
  },
  analytics: {
    completionRate: { type: Number, default: 92 },
    exits: { type: Number, default: 2 },
    stickerClicks: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound Indexes for fast feed filtering
storySchema.index({ expiresAt: 1, user: 1 });
storySchema.index({ user: 1, createdAt: -1 });

const Story = mongoose.model('Story', storySchema);
module.exports = Story;

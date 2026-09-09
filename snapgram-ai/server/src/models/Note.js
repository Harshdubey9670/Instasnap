const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true,
    maxlength: 60
  },
  songTitle: {
    type: String,
    trim: true
  },
  songArtist: {
    type: String,
    trim: true
  },
  songCoverUrl: {
    type: String
  },
  songPreviewUrl: {
    type: String
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }
}, {
  timestamps: true
});

// TTL index to automatically delete expired notes
noteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Note', noteSchema);

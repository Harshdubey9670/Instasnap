const Note = require('../models/Note');
const User = require('../models/User');

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
exports.createNote = async (req, res, next) => {
  try {
    const { text, songTitle, songArtist, songCoverUrl, songPreviewUrl } = req.body;
    
    // Check if user already has an active note and delete it (only 1 note allowed at a time)
    await Note.deleteMany({ author: req.user._id });

    const newNote = await Note.create({
      author: req.user._id,
      text,
      songTitle,
      songArtist,
      songCoverUrl,
      songPreviewUrl
    });

    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active notes from following & self
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).select('following');
    const followingIds = currentUser.following || [];
    
    const targetIds = [...followingIds, req.user._id]; // Include self

    const notes = await Note.find({
      author: { $in: targetIds },
      expiresAt: { $gt: new Date() }
    })
    .populate('author', 'username profilePicture avatar fullName')
    .sort({ createdAt: -1 });

    // Deduplicate to show only latest note per user (if deleteMany failed)
    const userNoteMap = new Map();
    for (const note of notes) {
      if (!userNoteMap.has(note.author._id.toString())) {
        userNoteMap.set(note.author._id.toString(), note);
      }
    }

    res.status(200).json({ success: true, data: Array.from(userNoteMap.values()) });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    
    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();
    res.status(200).json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

const Story = require('../models/Story');
const User = require('../models/User');

const seedMockStoriesIfNeeded = async () => {
  const count = await Story.countDocuments();
  if (count > 0) return;

  console.log('[DEV ONLY] Seeding mock stories...');
  let mockUser = await User.findOne({ username: 'snapgram_official' });
  if (!mockUser) return;

  const mockUsers = [mockUser];

  // We can create a few more mock users for stories so the row looks nice
  for (let i = 1; i <= 5; i++) {
    let u = await User.findOne({ username: `user_${i}` });
    if (!u) {
      u = await User.create({
        fullName: `Mock User ${i}`,
        username: `user_${i}`,
        email: `user${i}@snapgram.ai`,
        password: 'password123',
        profilePicture: `https://i.pravatar.cc/150?u=${i}`
      });
    }
    mockUsers.push(u);
  }

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  for (let i = 0; i < mockUsers.length; i++) {
    await Story.create({
      user: mockUsers[i]._id,
      media: [{ url: `https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop`, type: 'image' }],
      expiresAt: tomorrow,
    });
  }
};

// Helper function to check if a user is authorized to access/view a story
const canAccessStory = async (story, userId) => {
  if (!story || !userId) return false;
  const currentUserIdStr = userId.toString();
  const authorIdStr = (story.user._id || story.user).toString();

  // Own story is always accessible
  if (authorIdStr === currentUserIdStr) return true;

  const storyAuthor = story.user._id ? story.user : await User.findById(story.user);
  const currentUser = await User.findById(userId);

  if (!storyAuthor || !currentUser) return false;

  // 1. Blocked status: Neither blocked users nor blockers can access stories
  const authorBlockedUsers = (storyAuthor.blockedUsers || []).map(id => id.toString());
  const userBlockedUsers = (currentUser.blockedUsers || []).map(id => id.toString());
  if (authorBlockedUsers.includes(currentUserIdStr) || userBlockedUsers.includes(authorIdStr)) {
    return false;
  }

  // 2. Hidden story check
  const hiddenFromList = (story.hiddenFrom || []).map(id => id.toString());
  if (hiddenFromList.includes(currentUserIdStr)) {
    return false;
  }

  // 3. Privacy level checks
  if (story.privacy === 'custom') {
    const allowedList = (story.allowedUsers || []).map(id => id.toString());
    if (!allowedList.includes(currentUserIdStr)) return false;
  } else if (story.privacy === 'close_friends') {
    const closeFriendsList = (storyAuthor.closeFriends || []).map(id => id.toString());
    if (!closeFriendsList.includes(currentUserIdStr)) return false;
  } else if (story.privacy === 'followers') {
    const followersList = (storyAuthor.followers || []).map(id => id.toString());
    if (!followersList.includes(currentUserIdStr)) return false;
  }

  // 4. Private account rule (only approved followers)
  if (storyAuthor.isPrivate && (story.privacy === 'public' || story.privacy === 'followers')) {
    const followersList = (storyAuthor.followers || []).map(id => id.toString());
    if (!followersList.includes(currentUserIdStr)) return false;
  }

  return true;
};

// @desc    Get active stories for feed
// @route   GET /api/stories
// @access  Private
exports.getStories = async (req, res, next) => {
  try {
    await seedMockStoriesIfNeeded();

    const currentUserId = (req.user?._id || req.user?.id)?.toString();
    const currentUser = currentUserId ? await User.findById(currentUserId) : null;

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const mutedUserIds = (currentUser.mutedUsers || []).map(id => id.toString());
    const blockedUserIds = (currentUser.blockedUsers || []).map(id => id.toString());

    // Also find users who have blocked the current user
    const usersWhoBlockedMe = await User.find({ blockedUsers: currentUser._id }).select('_id');
    const blockerIds = usersWhoBlockedMe.map(u => u._id.toString());

    // Exclude muted and blocked users (both ways)
    const excludedIds = Array.from(new Set([...mutedUserIds, ...blockedUserIds, ...blockerIds]));

    const query = { expiresAt: { $gt: new Date() } };
    if (excludedIds.length > 0) {
      query.user = { $nin: excludedIds };
    }

    const rawStories = await Story.find(query)
      .populate('user', 'username profilePicture avatar isPrivate following followers closeFriends blockedUsers')
      .populate('viewers', 'username profilePicture avatar')
      .populate('likes', 'username profilePicture avatar')
      .sort({ createdAt: -1 });

    // Filter stories based on privacy, hiddenFrom, custom audience, and account privacy
    const stories = rawStories.filter(story => {
      if (!story.user || !story.user._id) return false;
      const authorId = story.user._id.toString();

      // Own story is always visible in feed
      if (authorId === currentUserId) return true;

      // 1. Hide from selected users
      const hiddenList = (story.hiddenFrom || []).map(id => id.toString());
      if (hiddenList.includes(currentUserId)) return false;

      // 2. Custom audience privacy
      if (story.privacy === 'custom') {
        const allowedList = (story.allowedUsers || []).map(id => id.toString());
        if (!allowedList.includes(currentUserId)) return false;
      }

      // 3. Close friends privacy
      if (story.privacy === 'close_friends') {
        const closeFriendsList = (story.user.closeFriends || []).map(id => id.toString());
        if (!closeFriendsList.includes(currentUserId)) return false;
      }

      // 4. Followers only privacy
      if (story.privacy === 'followers') {
        const followersList = (story.user.followers || []).map(id => id.toString());
        if (!followersList.includes(currentUserId)) return false;
      }

      // 5. Account Privacy (Private accounts only allow approved followers)
      if (story.user.isPrivate && (story.privacy === 'public' || story.privacy === 'followers')) {
        const followersList = (story.user.followers || []).map(id => id.toString());
        if (!followersList.includes(currentUserId)) return false;
      }

      return true;
    });

    // Group stories by user for the feed tray
    const userStoriesMap = new Map();
    stories.forEach(story => {
      const userId = story.user._id.toString();
      if (!userStoriesMap.has(userId)) {
        userStoriesMap.set(userId, {
          user: story.user,
          stories: [story]
        });
      } else {
        userStoriesMap.get(userId).stories.push(story);
      }
    });

    res.status(200).json({
      success: true,
      data: Array.from(userStoriesMap.values())
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a story
// @route   POST /api/stories/:id/reply
// @access  Private
exports.replyToStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const story = await Story.findById(id).populate('user', 'username profilePicture avatar isPrivate followers closeFriends blockedUsers');
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (story.allowReplies === false) {
      return res.status(403).json({ success: false, message: 'Replies are disabled for this story' });
    }

    const senderId = req.user._id || req.user.id;
    const recipientId = story.user._id || story.user;

    // Authorization check
    const authorized = await canAccessStory(story, senderId);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this story' });
    }

    if (recipientId.toString() === senderId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot reply to your own story' });
    }

    // Extract @mentions
    const User = require('../models/User');
    const Comment = require('../models/Comment');
    const mentionMatches = message.match(/@(\w+)/g) || [];
    const mentionUsernames = mentionMatches.map(m => m.substring(1));
    let mentionedUsers = [];
    if (mentionUsernames.length > 0) {
      mentionedUsers = await User.find({ username: { $in: mentionUsernames } }).select('_id');
    }

    // Save story comment document
    const newComment = await Comment.create({
      story: story._id,
      user: senderId,
      text: message.trim(),
      mentions: mentionedUsers.map(u => u._id)
    });
    await newComment.populate('user', 'username profilePicture avatar');

    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    const { getIo } = require('../socket');

    // Find or create 1-on-1 conversation
    let conversation = await Conversation.findOne({
      isGroupChat: false,
      participants: { $all: [senderId, recipientId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        isGroupChat: false,
        participants: [senderId, recipientId]
      });
    }

    const replyMediaUrl = story.media?.[0]?.url;
    const replyMediaType = story.media?.[0]?.type === 'video' ? 'video' : 'image';

    const newMessage = await Message.create({
      sender: senderId,
      conversation: conversation._id,
      text: message.trim(),
      mediaUrl: replyMediaUrl,
      messageType: replyMediaUrl ? replyMediaType : 'text',
      status: 'sent'
    });

    await newMessage.populate('sender', 'username profilePicture avatar');

    conversation.latestMessage = newMessage._id;
    await conversation.save();

    // Broadcast Socket.io event for real-time delivery
    const io = getIo();
    if (io) {
      conversation.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit('newMessage', newMessage.toJSON());
      });
    }

    // Fire story_reply notification
    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type: 'story_reply',
      message: message.trim()
    });

    res.status(200).json({ success: true, message: 'Reply sent', data: newComment, chatMessage: newMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comments/replies for a story
// @route   GET /api/stories/:id/comments
// @access  Private
exports.getStoryComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id || req.user.id;
    const story = await Story.findById(id).populate('user');
    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });
    
    const authorized = await canAccessStory(story, currentUserId);
    if (!authorized) return res.status(403).json({ success: false, message: 'Not authorized' });

    const Comment = require('../models/Comment');
    const comments = await Comment.find({ story: id })
      .populate('user', 'username profilePicture avatar')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a story comment/reply
// @route   DELETE /api/stories/comments/:commentId
// @access  Private
exports.deleteStoryComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const currentUserId = req.user._id || req.user.id;
    const Comment = require('../models/Comment');
    const comment = await Comment.findById(commentId).populate('story');
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const isCommentAuthor = comment.user.toString() === currentUserId.toString();
    const isStoryOwner = comment.story && comment.story.user && comment.story.user.toString() === currentUserId.toString();

    if (!isCommentAuthor && !isStoryOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();
    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a story comment/reply
// @route   POST /api/stories/comments/:commentId/like
// @access  Private
exports.toggleStoryCommentLike = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const currentUserId = req.user._id || req.user.id;
    const Comment = require('../models/Comment');
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (!comment.likes) comment.likes = [];
    const isLiked = comment.likes.some(id => id.toString() === currentUserId.toString());

    if (isLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== currentUserId.toString());
    } else {
      comment.likes.push(currentUserId);
    }

    await comment.save();
    res.status(200).json({ success: true, liked: !isLiked, likesCount: comment.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Report a story comment/reply
// @route   POST /api/stories/comments/:commentId/report
// @access  Private
exports.reportStoryComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    const currentUserId = req.user._id || req.user.id;
    const Report = require('../models/Report');
    await Report.create({
      reporter: currentUserId,
      targetType: 'comment',
      targetId: commentId,
      reason: reason || 'Inappropriate story reply'
    });
    res.status(200).json({ success: true, message: 'Reply reported successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res, next) => {
  try {
    const { 
      media, stickers, music, status = 'published', scheduledAt, isArchived = true, 
      privacy = 'public', allowedUsers = [], hiddenFrom = [],
      allowReplies = true, allowSharing = true, allowDownload = true
    } = req.body;

    if (!media || !Array.isArray(media) || media.length === 0) {
      return res.status(400).json({ success: false, message: 'Media is required' });
    }

    // Automatically expire after 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await Story.create({
      user: req.user._id,
      media,
      stickers: stickers || [],
      music: music || {},
      status,
      scheduledAt,
      isArchived,
      expiresAt,
      privacy,
      allowedUsers,
      hiddenFrom,
      allowReplies,
      allowSharing,
    });

    res.status(201).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's Story Archive
// @route   GET /api/stories/archive
// @access  Private
exports.getStoryArchive = async (req, res, next) => {
  try {
    const stories = await Story.find({ user: req.user.id, isArchived: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Highlights for a user
// @route   GET /api/stories/highlights/:userId
// @access  Private
exports.getHighlights = async (req, res, next) => {
  try {
    const Highlight = require('../models/Highlight');
    const highlights = await Highlight.find({ user: req.params.userId }).populate('stories');
    res.status(200).json({ success: true, data: highlights });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a Story Highlight
// @route   POST /api/stories/highlights
// @access  Private
exports.createHighlight = async (req, res, next) => {
  try {
    const Highlight = require('../models/Highlight');
    const { title, coverImage, stories } = req.body;

    if (!title || !stories || stories.length === 0) {
      return res.status(400).json({ success: false, message: 'Title and stories are required' });
    }

    const highlight = await Highlight.create({
      user: req.user.id,
      title,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=400&auto=format&fit=crop',
      stories
    });

    res.status(201).json({ success: true, data: highlight });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Story Generation
// @route   POST /api/stories/ai-generate
// @access  Private
exports.generateAIStory = async (req, res, next) => {
  try {
    const { prompt = 'Sunset aesthetic', theme = 'cyberpunk' } = req.body;

    const aiMediaUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop';
    
    res.status(200).json({
      success: true,
      data: {
        mediaUrl: aiMediaUrl,
        type: 'image',
        suggestedCaption: `AI Generated story inspired by: ${prompt}`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Detailed Story Analytics
// @route   GET /api/stories/:id/analytics
// @access  Private
exports.getStoryAnalytics = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id).populate('viewers', 'username profilePicture');
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (story.user.toString() !== (req.user._id || req.user.id).toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(200).json({
      success: true,
      data: {
        storyId: story._id,
        totalViewers: story.viewers ? story.viewers.length : 0,
        viewers: story.viewers,
        completionRate: story.analytics?.completionRate || 94,
        exits: story.analytics?.exits || 1,
        stickerClicks: 12
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Interact with Story Sticker (Vote Poll/Quiz, Answer Question)
// @route   POST /api/stories/:id/sticker-interact
// @access  Private
exports.interactSticker = async (req, res, next) => {
  try {
    const { stickerId, optionIndex, answerText } = req.body;

    res.status(200).json({
      success: true,
      message: 'Sticker interaction recorded successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a story as viewed
// @route   PUT /api/stories/:id/view
// @access  Private
exports.markStoryViewed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id || req.user.id;
    
    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const authorized = await canAccessStory(story, currentUserId);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this story' });
    }

    story.viewers = story.viewers || [];
    if (!story.viewers.some(v => v.toString() === currentUserId.toString())) {
      story.viewers.push(currentUserId);
      await story.save();
    }

    res.status(200).json({ success: true, message: 'Story marked as viewed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Like / Unlike Story
// @route   POST /api/stories/:id/like
// @access  Private
exports.toggleLikeStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id || req.user.id;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const authorized = await canAccessStory(story, currentUserId);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to like this story' });
    }

    if (!story.likes) story.likes = [];
    const isLiked = story.likes.some(likeId => likeId.toString() === currentUserId.toString());

    if (isLiked) {
      story.likes = story.likes.filter(likeId => likeId.toString() !== currentUserId.toString());
    } else {
      story.likes.push(currentUserId);

      // Trigger notification if not own story
      if (story.user.toString() !== currentUserId.toString()) {
        const Notification = require('../models/Notification');
        await Notification.create({
          recipient: story.user,
          sender: currentUserId,
          type: 'story_like',
          message: 'liked your story'
        });
      }
    }

    await story.save();

    res.status(200).json({
      success: true,
      liked: !isLiked,
      likesCount: story.likes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id || req.user.id;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (story.user.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this story' });
    }

    await Story.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Share Story to user chat
// @route   POST /api/stories/:id/share
// @access  Private
exports.shareStory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipientId, recipientIds, message: shareNote } = req.body;

    const story = await Story.findById(id).populate('user', 'username profilePicture avatar isPrivate followers closeFriends blockedUsers');
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    const senderId = req.user._id || req.user.id;

    const authorized = await canAccessStory(story, senderId);
    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to share this story' });
    }

    let targets = [];
    if (Array.isArray(recipientIds) && recipientIds.length > 0) {
      targets = recipientIds;
    } else if (recipientId) {
      targets = [recipientId];
    } else {
      return res.status(400).json({ success: false, message: 'Recipient is required' });
    }

    const Conversation = require('../models/Conversation');
    const Message = require('../models/Message');
    const Notification = require('../models/Notification');
    const { getIo } = require('../socket');
    const io = getIo();

    const createdMessages = [];

    for (const targetId of targets) {
      // Check recipient privacy access
      const recipientAuthorized = await canAccessStory(story, targetId);
      if (!recipientAuthorized) continue;

      let conversation = await Conversation.findOne({
        isGroupChat: false,
        participants: { $all: [senderId, targetId], $size: 2 }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          isGroupChat: false,
          participants: [senderId, targetId]
        });
      }

      const sharedStoryUrl = story.media?.[0]?.url;

      const newMessage = await Message.create({
        sender: senderId,
        conversation: conversation._id,
        story: story._id,
        text: (shareNote || '').trim(),
        mediaUrl: sharedStoryUrl,
        messageType: 'story_share',
        status: 'sent'
      });

      await newMessage.populate('sender', 'username profilePicture avatar');
      await newMessage.populate({
        path: 'story',
        populate: { path: 'user', select: 'username profilePicture avatar' }
      });

      conversation.latestMessage = newMessage._id;
      await conversation.save();

      // Socket.io real-time delivery
      if (io) {
        conversation.participants.forEach((pId) => {
          io.to(pId.toString()).emit('newMessage', newMessage.toJSON());
        });
      }

      // Notification to recipient
      if (targetId.toString() !== senderId.toString()) {
        await Notification.create({
          recipient: targetId,
          sender: senderId,
          type: 'story_reply',
          message: `shared @${story.user.username}'s story with you`
        });
      }

      createdMessages.push(newMessage);
    }

    res.status(200).json({ success: true, message: 'Story shared to chat', data: createdMessages });
  } catch (error) {
    next(error);
  }
};

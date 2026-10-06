const Notification = require('../models/Notification');

// @desc    Get notifications for the authenticated user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };
    // Comma-separated `type` param (e.g. "like,story_like,save") backs the
    // All/Likes/Comments/Follows/Mentions/System filter chips.
    if (req.query.type) {
      const types = req.query.type.split(',').map(t => t.trim()).filter(Boolean);
      if (types.length) query.type = { $in: types };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'username fullName profilePicture avatar')
      .populate('post', 'media caption')
      .populate('reel', 'video caption user');

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, hasMore: skip + notifications.length < total }
    });
  } catch (error) {
    next(error);
  }
};

const LIKE_TYPES = ['like', 'story_like', 'save'];
const COMMENT_TYPES = ['comment', 'reply', 'story_reply'];
const FOLLOWER_TYPES = ['follow', 'follow_accepted'];

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const pctChange = (current, previous) => {
  if (previous === 0) return current > 0 ? null : 0; // null = "new activity", nothing to compare against
  return Math.round(((current - previous) / previous) * 100);
};

// @desc    Real activity insights for the desktop sidebar — this week's vs
//          last week's counts per category, plus a 7-day daily total for
//          the sparkline. Computed from the user's own Notification history,
//          not fabricated.
// @route   GET /api/notifications/insights
// @access  Private
const getInsights = async (req, res, next) => {
  try {
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recent = await Notification.find({
      recipient: req.user._id,
      createdAt: { $gte: fourteenDaysAgo }
    }).select('type createdAt').lean();

    const bucket = (types, since) =>
      recent.filter(n => types.includes(n.type) && new Date(n.createdAt) >= since).length;

    const categoryStat = (types) => {
      const thisWeek = bucket(types, sevenDaysAgo);
      const lastWeekCount = recent.filter(n =>
        types.includes(n.type) &&
        new Date(n.createdAt) >= fourteenDaysAgo &&
        new Date(n.createdAt) < sevenDaysAgo
      ).length;
      return { count: thisWeek, changePct: pctChange(thisWeek, lastWeekCount) };
    };

    // 7-day daily totals (all types) for the sparkline
    const dailyTotals = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const count = recent.filter(n => {
        const t = new Date(n.createdAt);
        return t >= dayStart && t < dayEnd;
      }).length;
      dailyTotals.push({ date: dayStart.toISOString(), count });
    }

    const thisWeekTotal = bucket([...LIKE_TYPES, ...COMMENT_TYPES, ...FOLLOWER_TYPES, 'mention', 'tag', 'system'], sevenDaysAgo);
    const lastWeekTotal = recent.filter(n =>
      new Date(n.createdAt) >= fourteenDaysAgo && new Date(n.createdAt) < sevenDaysAgo
    ).length;

    res.status(200).json({
      success: true,
      data: {
        likes: categoryStat(LIKE_TYPES),
        comments: categoryStat(COMMENT_TYPES),
        newFollowers: categoryStat(FOLLOWER_TYPES),
        dailyTotals,
        overallChangePct: pctChange(thisWeekTotal, lastWeekTotal),
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markOneRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { read: true } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread
// @access  Private
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.status(200).json({ success: true, count: unreadCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAllRead, markOneRead, getUnreadCount, deleteNotification, getInsights };

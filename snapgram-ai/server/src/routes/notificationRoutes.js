const express = require('express');
const { getNotifications, markAllRead, markOneRead, getUnreadCount, deleteNotification, getInsights } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/unread', getUnreadCount);
router.get('/insights', getInsights);
router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markOneRead);
router.delete('/:id', deleteNotification);

module.exports = router;

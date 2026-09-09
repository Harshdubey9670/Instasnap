const express = require('express');
const { getConversations, createOrGetConversation } = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getConversations)
  .post(protect, createOrGetConversation);

module.exports = router;

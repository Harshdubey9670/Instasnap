const express = require('express');
const { 
  getStories, 
  replyToStory, 
  createStory, 
  markStoryViewed, 
  getStoryArchive, 
  getHighlights, 
  createHighlight, 
  generateAIStory, 
  getStoryAnalytics, 
  interactSticker,
  toggleLikeStory,
  deleteStory,
  shareStory,
  getStoryComments,
  deleteStoryComment,
  toggleStoryCommentLike,
  reportStoryComment
} = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getStories);
router.post('/', protect, createStory);
router.get('/archive', protect, getStoryArchive);
router.get('/highlights/:userId', protect, getHighlights);
router.post('/highlights', protect, createHighlight);
router.post('/ai-generate', protect, generateAIStory);

router.post('/:id/reply', protect, replyToStory);
router.get('/:id/comments', protect, getStoryComments);
router.delete('/comments/:commentId', protect, deleteStoryComment);
router.post('/comments/:commentId/like', protect, toggleStoryCommentLike);
router.post('/comments/:commentId/report', protect, reportStoryComment);
router.put('/:id/view', protect, markStoryViewed);
router.get('/:id/analytics', protect, getStoryAnalytics);
router.post('/:id/sticker-interact', protect, interactSticker);
router.post('/:id/like', protect, toggleLikeStory);
router.delete('/:id', protect, deleteStory);
router.post('/:id/share', protect, shareStory);

module.exports = router;

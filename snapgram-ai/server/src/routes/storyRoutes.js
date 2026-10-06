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
  downloadStory,
  getStoryComments,
  deleteStoryComment,
  toggleStoryCommentLike,
  reportStoryComment
} = require('../controllers/storyController');
const { protect, requireVerified } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getStories);
router.post('/', protect, requireVerified, createStory);
router.get('/archive', protect, getStoryArchive);
router.get('/highlights/:userId', protect, getHighlights);
router.post('/highlights', protect, requireVerified, createHighlight);
router.post('/ai-generate', protect, requireVerified, generateAIStory);

router.post('/:id/reply', protect, requireVerified, replyToStory);
router.get('/:id/comments', protect, getStoryComments);
router.delete('/comments/:commentId', protect, requireVerified, deleteStoryComment);
router.post('/comments/:commentId/like', protect, toggleStoryCommentLike);
router.post('/comments/:commentId/report', protect, reportStoryComment);
router.put('/:id/view', protect, markStoryViewed);
router.get('/:id/analytics', protect, getStoryAnalytics);
router.post('/:id/sticker-interact', protect, interactSticker);
router.post('/:id/like', protect, toggleLikeStory);
router.delete('/:id', protect, requireVerified, deleteStory);
router.post('/:id/share', protect, shareStory);
router.post('/:id/download', protect, downloadStory);


module.exports = router;

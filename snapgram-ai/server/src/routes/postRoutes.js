const express = require('express');
const { 
  getFeed, toggleLike, toggleSave, createPost, getExploreFeed, 
  getHashtagPosts, getTrendingHashtags, getUserPosts, getPostById,
  editPost, deletePost, archivePost, pinPost, updatePostSettings, reportPost, hidePost, getPostLikes
} = require('../controllers/postController');
const { addComment, getComments, deleteComment, editComment, likeComment, pinComment, reportComment } = require('../controllers/commentController');
const { protect, requireVerified } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected Routes
router.use(protect);
router.get('/feed', getFeed);
router.get('/explore', getExploreFeed);
router.get('/trending-hashtags', getTrendingHashtags);
router.get('/hashtag/:tag', getHashtagPosts);
router.get('/user/:id', getUserPosts);
router.post('/', requireVerified, createPost);
router.get('/:id', getPostById);
router.put('/:id', requireVerified, editPost);
router.delete('/:id', requireVerified, deletePost);
router.put('/:id/archive', requireVerified, archivePost);
router.put('/:id/pin', requireVerified, pinPost);
router.put('/:id/settings', requireVerified, updatePostSettings);
router.post('/:id/report', reportPost);
router.post('/:id/hide', hidePost);

router.post('/:id/like', toggleLike);
router.get('/:id/likes', getPostLikes);
router.post('/:id/save', toggleSave);

// Comments
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', requireVerified, addComment);
router.put('/:postId/comments/:commentId', requireVerified, editComment);
router.delete('/:postId/comments/:commentId', requireVerified, deleteComment);
router.put('/:postId/comments/:commentId/like', likeComment);
router.put('/:postId/comments/:commentId/pin', requireVerified, pinComment);
router.post('/:postId/comments/:commentId/report', reportComment);

module.exports = router;

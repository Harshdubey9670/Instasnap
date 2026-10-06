const express = require('express');
const {
  getReels,
  createReel,
  getReelById,
  toggleLike,
  incrementViews,
  incrementShares,
  deleteReel,
  getMusicLibrary,
  generateAICaptions,
  getReelAnalytics,
  downloadReel,
  toggleSaveReel
} = require('../controllers/reelController');
const { protect, requireVerified } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getReels);
router.post('/', requireVerified, createReel);
router.get('/music-library', getMusicLibrary);
router.post('/generate-captions', generateAICaptions);

router.get('/:id', getReelById);
router.get('/:id/analytics', getReelAnalytics);
router.put('/:id/like', toggleLike);
router.put('/:id/save', toggleSaveReel);
router.put('/:id/view', incrementViews);
router.put('/:id/share', incrementShares);
router.delete('/:id', requireVerified, deleteReel);
router.post('/:id/download', downloadReel);


module.exports = router;

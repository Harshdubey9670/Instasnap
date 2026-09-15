const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const vaultController = require('../controllers/vaultController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// A 4-digit PIN has only 10,000 combinations, so this endpoint must be
// throttled server-side — the mobile/web lockout UI is client-side only
// and does not protect against a script calling the API directly.
const pinAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many PIN attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Route is behind `protect`, so req.user is always set here.
  keyGenerator: (req) => req.user.id,
});

router.post('/verify-pin', pinAttemptLimiter, vaultController.verifyVaultPin);
router.post('/set-pin', vaultController.setVaultPin);

router.get('/memories', vaultController.getMemories);
router.post('/memories', vaultController.addMemory);
router.put('/memories/:id/favorite', vaultController.toggleFavorite);
router.delete('/memories/:id', vaultController.softDeleteMemory);

router.get('/trash', vaultController.getTrashBin);
router.post('/restore/:id', vaultController.restoreMemory);

router.get('/albums', vaultController.getAlbums);
router.post('/albums', vaultController.createAlbum);

router.post('/share-link', vaultController.generateShareLink);

module.exports = router;

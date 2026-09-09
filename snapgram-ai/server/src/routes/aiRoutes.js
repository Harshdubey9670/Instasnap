const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // limit each user to 20 requests per windowMs
  message: { success: false, message: 'You have reached your daily limit of 20 AI Copilot requests. Please try again tomorrow.' },
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : 'unauthenticated';
  }
});

router.use(protect);

router.post('/assistant', aiLimiter, aiController.chatAssistant);
router.post('/generate-image', aiLimiter, aiController.generateImage);
router.post('/caption', aiController.generateCaption);
router.post('/hashtags', aiController.generateHashtags);
router.post('/bio', aiController.generateBio);
router.post('/usernames', aiController.suggestUsernames);
router.post('/post-ideas', aiController.generatePostIdeas);
router.post('/comments', aiController.suggestComments);
router.post('/translate', aiController.translateText);
router.post('/moderate', aiController.moderateContent);
router.post('/fake-account-check', aiController.detectFakeAccount);
router.post('/alt-text', aiController.generateAltText);

module.exports = router;

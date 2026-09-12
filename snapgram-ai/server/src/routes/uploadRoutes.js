const express = require('express');
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Apply auth middleware to all upload routes
router.use(protect);

// Support either 'image' or 'file' field names for universal compatibility
const uploadAny = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return next(err);
    if (req.file) return next();
    upload.single('file')(req, res, next);
  });
};

router.post('/', uploadAny, uploadImage);

// Use a standard parameter and encodeURIComponent on the frontend for slashes
router.delete('/:public_id', deleteImage);

module.exports = router;

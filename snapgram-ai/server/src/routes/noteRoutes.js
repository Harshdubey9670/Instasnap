const express = require('express');
const router = express.Router();
const { createNote, getNotes, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createNote)
  .get(getNotes);

router.route('/:id')
  .delete(deleteNote);

module.exports = router;

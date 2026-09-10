const express = require('express');
const router = express.Router();
const { toggleBookmark, getBookmarks } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getBookmarks);
router.route('/toggle').post(protect, toggleBookmark);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getNotifications);
router.route('/read-all').post(protect, markAllAsRead);
router.route('/:id/read').patch(protect, markAsRead);

module.exports = router;

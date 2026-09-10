const express = require('express');
const router = express.Router();
const { getDashboardData, logSearch } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.route('/dashboard').get(getDashboardData); // Should be protected by role in production
router.route('/log-search').post(logSearch);

module.exports = router;

const express = require('express');
const router = express.Router();
const { createReport, getReports, resolveReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getReports).post(protect, createReport);
router.route('/:id').patch(protect, resolveReport);

module.exports = router;

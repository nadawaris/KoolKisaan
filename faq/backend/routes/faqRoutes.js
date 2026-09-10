const express = require('express');
const router = express.Router();
const { getCategories, getFAQs, getMyFAQs, getPendingFAQs, getFAQBySlug, createFAQ, updateFAQStatus, voteFAQ, suggestEdit, getPendingSuggestions, reviewSuggestion, backfillEmbeddings } = require('../controllers/faqController');
const { protect, admin, moderator } = require('../middleware/auth');

const { cacheMiddleware } = require('../middleware/redisCache');

router.route('/').get(cacheMiddleware('faqs'), getFAQs).post(protect, createFAQ);
router.route('/mine').get(protect, getMyFAQs);
router.route('/categories').get(getCategories);
router.get('/pending', protect, moderator, getPendingFAQs);
router.get('/suggestions/pending', protect, moderator, getPendingSuggestions);
router.post('/backfill-embeddings', protect, moderator, backfillEmbeddings);
router.route('/suggestions/:suggestionId/review').put(protect, moderator, reviewSuggestion);
router.route('/:slug').get(getFAQBySlug);
router.route('/:id/status').put(protect, moderator, updateFAQStatus);
router.route('/:id/vote').post(protect, voteFAQ);
router.route('/:id/suggest-edit').post(protect, suggestEdit);

module.exports = router;

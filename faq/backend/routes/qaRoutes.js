const express = require('express');
const router = express.Router();
const { getQuestions, getQuestionById, createQuestion, createAnswer, voteQuestion, voteAnswer, acceptAnswer, createComment, getUserQuestions, getUserAnswers } = require('../controllers/qaController');
const { protect } = require('../middleware/auth');

router.route('/user/questions').get(protect, getUserQuestions);
router.route('/user/answers').get(protect, getUserAnswers);

router.route('/').get(getQuestions).post(protect, createQuestion);
router.route('/:id').get(getQuestionById);
router.route('/:id/answers').post(protect, createAnswer);

// Voting, Accepting, and Commenting routes
router.route('/:id/vote').post(protect, voteQuestion);
router.route('/answer/:id/vote').post(protect, voteAnswer);
router.route('/answer/:id/accept').post(protect, acceptAnswer);
router.route('/answer/:id/comments').post(protect, createComment);

module.exports = router;

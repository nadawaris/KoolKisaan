const express = require('express');
const router = express.Router();
const { generateChatResponse } = require('../controllers/chatbotController');

router.post('/', generateChatResponse);

module.exports = router;

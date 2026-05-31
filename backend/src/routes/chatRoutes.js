const express = require('express');
const router = express.Router();
const { getChatHistory, streamChatResponse } = require('../controllers/chatController');

router.get('/history/:threadId', getChatHistory);
router.post('/stream', streamChatResponse);

module.exports = router;

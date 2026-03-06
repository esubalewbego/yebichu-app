const express = require('express');
const router = express.Router();
const { sendMessage, getConversations, getMessages } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/send', sendMessage);
router.get('/conversations', getConversations);
router.get('/messages/:conversationId', getMessages);

module.exports = router;

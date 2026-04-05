const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const chatbotController = require('./chatbot.controller');

// All chatbot routes require authentication
router.use(protect);

router.post('/message', chatbotController.sendMessage);

module.exports = router;
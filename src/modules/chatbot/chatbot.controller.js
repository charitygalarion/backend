const chatbotService = require('./chatbot.service');

exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    const reply = await chatbotService.processMessage(message);
    res.json({ reply });
    
  } catch (error) {
    console.error('Chatbot controller error:', error);
    res.status(500).json({ message: 'Failed to process message' });
  }
};
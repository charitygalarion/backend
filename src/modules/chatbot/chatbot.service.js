const axios = require('axios');

class ChatbotService {
  constructor() {
    this.HF_API_KEY = process.env.HF_API_KEY;
    // Using DialoGPT for conversational responses
    this.HF_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large';
    // Alternative: Use a smaller model for faster responses
    // this.HF_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-small';
  }

  async processMessage(message) {
    try {
      // First, check if API key is set
      if (!this.HF_API_KEY) {
        console.error('HF_API_KEY not configured');
        return this.getFallbackResponse(message);
      }

      const response = await axios.post(
        this.HF_URL,
        {
          inputs: message,
          parameters: {
            max_length: 150,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
          },
          options: {
            wait_for_model: true, // Wait for model to load if needed
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Extract the generated text
      let reply = response.data.generated_text;
      
      // Clean up the response (remove the original message if repeated)
      if (reply.startsWith(message)) {
        reply = reply.substring(message.length).trim();
      }
      
      // If response is empty, use fallback
      if (!reply || reply.length === 0) {
        return this.getFallbackResponse(message);
      }
      
      return reply;
      
    } catch (error) {
      console.error('Hugging Face API error:', error.response?.data || error.message);
      return this.getFallbackResponse(message);
    }
  }

  // Fallback responses when API fails
  getFallbackResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    // Recipe related
    if (lowerMsg.includes('recipe') || lowerMsg.includes('cook')) {
      return "I can help you find recipes! Try scanning ingredients or searching by name in the app. What would you like to cook?";
    }
    
    // Ingredients
    if (lowerMsg.includes('ingredient')) {
      return "You can scan ingredients using the camera in the Scan tab. It will suggest recipes based on what you have!";
    }
    
    // Filipino dishes
    if (lowerMsg.includes('adobo')) {
      return "Adobo is a classic Filipino dish! It uses chicken or pork marinated in vinegar, soy sauce, and garlic. Would you like to see the recipe?";
    }
    if (lowerMsg.includes('sinigang')) {
      return "Sinigang is a sour Filipino soup! It's made with tamarind, vegetables, and your choice of meat or seafood.";
    }
    
    // Help
    if (lowerMsg.includes('help')) {
      return "I can help with:\n🔍 Finding recipes\n📸 Scanning ingredients\n💾 Saving favorites\n🍽️ Filipino dishes\n\nWhat would you like to know?";
    }
    
    // Default
    return "I'm here to help with cooking and recipes! You can ask me about Filipino dishes, ingredient substitutions, cooking tips, or how to find recipes in the app.";
  }
}

module.exports = new ChatbotService();
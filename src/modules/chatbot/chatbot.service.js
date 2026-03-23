const axios = require('axios');

class ChatbotService {
  constructor() {
    this.HF_API_KEY = process.env.HF_API_KEY;
    // Updated to use the new router endpoint
    this.HF_URL = 'https://router.huggingface.co/hf-inference/models/microsoft/DialoGPT-large';
  }

  async processMessage(message) {
    try {
      // Check if API key is set
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
        },
        {
          headers: {
            'Authorization': `Bearer ${this.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      // Extract the generated text
      let reply = response.data.generated_text;
      
      // Clean up the response
      if (reply && reply.startsWith(message)) {
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
    if (lowerMsg.includes('recipe') || lowerMsg.includes('cook') || lowerMsg.includes('make')) {
      if (lowerMsg.includes('adobo')) {
        return "Adobo is a classic Filipino dish! Here's a simple recipe:\n\nIngredients:\n• 1 kg chicken or pork\n• 1/2 cup soy sauce\n• 1/2 cup vinegar\n• 6 cloves garlic\n• 3 bay leaves\n• 1 tsp pepper\n\nInstructions:\n1. Marinate meat in soy sauce and garlic for 30 mins\n2. Brown meat in oil\n3. Add vinegar, bay leaves, pepper\n4. Simmer for 30-40 mins\n5. Serve with rice!\n\nWould you like more details?";
      }
      if (lowerMsg.includes('sinigang')) {
        return "Sinigang is a sour Filipino soup! Here's a basic recipe:\n\nIngredients:\n• 500g pork belly\n• 1 pack sinigang mix\n• 1 onion, 2 tomatoes\n• Radish, kangkong, string beans\n\nInstructions:\n1. Boil pork with onion and tomatoes\n2. Add sinigang mix\n3. Add vegetables\n4. Simmer until tender\n5. Serve hot!\n\nWant the full recipe?";
      }
      if (lowerMsg.includes('egg')) {
        return "Eggs are so versatile! You can make:\n🍳 Scrambled eggs\n🥚 Fried eggs\n🍳 Omelette\n🥚 Egg fried rice\n🥚 Tortang talong (Eggplant omelette)\n\nWhat would you like to make?";
      }
      return "I can help you find recipes! Try:\n🔍 Searching by name in the Scan tab\n📸 Scanning ingredients with your camera\n🍽️ Checking the Dashboard for popular recipes\n\nWhat dish are you interested in?";
    }
    
    // Ingredients
    if (lowerMsg.includes('ingredient')) {
      return "You can scan ingredients using the camera in the Scan tab! 📸\n\nJust tap 'Scan Ingredients', take a photo, and I'll detect what's in your kitchen and suggest recipes!";
    }
    
    // Filipino dishes
    if (lowerMsg.includes('filipino') || lowerMsg.includes('pinoy')) {
      return "Filipino cuisine is amazing! 🇵🇭 Popular dishes include:\n• Adobo (chicken/pork in soy sauce & vinegar)\n• Sinigang (sour tamarind soup)\n• Lechon (roasted pig)\n• Pancit (noodles)\n• Sisig (sizzling pork)\n• Kare-kare (peanut stew)\n\nWhich one would you like to learn about?";
    }
    
    // Save recipes
    if (lowerMsg.includes('save') || lowerMsg.includes('favorite')) {
      return "To save a recipe:\n1. Find a recipe you like\n2. Tap the bookmark icon 📌\n3. It will appear in your Favorites\n\nYou can view all saved recipes in the Dashboard or Profile under 'Saved Recipes'.";
    }
    
    // Help
    if (lowerMsg.includes('help') || lowerMsg.includes('what can you do')) {
      return "I'm your cooking assistant! I can help with:\n🔍 Finding recipes\n📸 Scanning ingredients\n💾 Saving favorites\n🍽️ Filipino dishes\n🥘 Cooking tips\n📝 Recipe adjustments\n\nWhat would you like to know?";
    }
    
    // Greetings
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      return "Hello! 👋 I'm your cooking assistant. Ready to cook something delicious? What can I help you with today?";
    }
    
    // Thank you
    if (lowerMsg.includes('thank')) {
      return "You're welcome! 😊 Happy cooking! Let me know if you need anything else.";
    }
    
    // Default
    return "I'm here to help with cooking and recipes! You can ask me about:\n• Filipino dishes like Adobo, Sinigang\n• Ingredient substitutions\n• Cooking tips and techniques\n• Finding recipes in the app\n\nWhat would you like to know?";
  }
}

module.exports = new ChatbotService();
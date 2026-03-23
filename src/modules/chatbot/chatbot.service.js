const axios = require('axios');

class ChatbotService {
  constructor() {
    this.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    // Use Gemini 2.5 Flash (5 RPM free)
    this.GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  async processMessage(message) {
    try {
      if (!this.GEMINI_API_KEY) {
        console.log('⚠️ No Gemini API key, using fallback');
        return this.getFallbackResponse(message);
      }

      console.log('🤖 Sending to Google Gemini 2.5 Flash...');
      console.log('📝 Message:', message);

      const response = await axios.post(
        `${this.GEMINI_URL}?key=${this.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `You are a friendly Filipino cooking assistant. Help users with recipes, cooking tips, and Filipino dishes. Keep responses helpful and warm.

User: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        },
        {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (reply) {
        console.log('✅ Gemini response received');
        return reply;
      }
      
      return this.getFallbackResponse(message);
      
    } catch (error) {
      console.error('❌ Gemini error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
      }
      return this.getFallbackResponse(message);
    }
  }

  getFallbackResponse(message) {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('sinigang')) {
      return "🇵🇭 **Pork Sinigang Recipe**\n\n**Ingredients:**\n• 500g pork belly\n• 1 pack sinigang mix\n• 1 onion, 2 tomatoes\n• Radish, kangkong, string beans\n\n**Steps:**\n1. Boil pork 30 mins\n2. Add sinigang mix\n3. Add vegetables\n4. Simmer 10 mins\n5. Serve hot with rice!";
    }
    
    if (lowerMsg.includes('adobo')) {
      return "🇵🇭 **Pork Adobo Recipe**\n\n**Ingredients:**\n• 1 kg pork\n• 1/2 cup soy sauce\n• 1/2 cup vinegar\n• 6 cloves garlic\n• 3 bay leaves\n\n**Steps:**\n1. Marinate 30 mins\n2. Brown meat\n3. Add marinade, bay leaves\n4. Simmer 30 mins\n5. Serve with rice!";
    }
    
    if (lowerMsg.includes('help')) {
      return "🍳 I can help with:\n• Filipino dishes (Adobo, Sinigang)\n• Scanning ingredients\n• Saving favorites\n• Cooking tips\n\nWhat would you like to know?";
    }
    
    return "🇵🇭 Hi! I'm your Filipino cooking assistant. Ask me about Adobo, Sinigang, or how to scan ingredients! 🍳";
  }
}

module.exports = new ChatbotService();
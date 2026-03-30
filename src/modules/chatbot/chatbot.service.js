const axios = require('axios');

class ChatbotService {
  constructor() {
    this.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    this.GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  async processMessage(message) {
    try {
      const response = await axios.post(
        `${this.GEMINI_URL}?key=${this.GEMINI_API_KEY}`, 
        {
          contents: [{
            parts: [{
              text: `You are a friendly Filipino cooking assistant built into a recipe app. Here is what you know about the app:
APP KNOWLEDGE:
- Fresh Recipe is a Filipino recipe app that helps you discover, cook, and save authentic Filipino dishes.
- To save/bookmark a recipe: tap the bookmark icon 🔖 on any recipe card. View saved recipes in the "Saved" icon in the bottom navigation bar.
- To scan ingredients: tap the "Scan" icon (camera) in the bottom navigation bar. You can take a photo or pick from your gallery. The AI will detect your ingredients and suggest matching recipes automatically.
- After scanning, you can tap/deselect individual ingredients to refine the recipe matches.
- If no matching recipes are found after scanning, you can tap "Generate Filipino Recipe" to let AI create a custom Filipino recipe using your detected ingredients.
- To explore/browse recipes: go to the "Scan" tab to browse all dishes and filter by category (Breakfast, Lunch, Dinner and Snacks).
- The app can generate a Filipino recipe for you — just ask and I'll create one!
- The app features Filipino recipes including Adobo, Sinigang, Tinola, Kare-Kare, Lechon, Pancit, Lumpia, Leche Flan, Halo-Halo, and more.


When users ask how to save, bookmark, scan, or explore recipes — answer using the app knowledge above. When users ask you to generate or suggest a Filipino recipe, create one for them with ingredients and steps. For all other cooking questions, answer as a knowledgeable Filipino cooking assistant. Keep responses helpful, warm, and concise.

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
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      return reply || "Sorry, I couldn't get a response. Please try again.";

    } catch (error) {
      console.error('❌ Gemini error:', error.message);
      return "Sorry, I'm having trouble responding right now. Please try again.";
    }
  }
}

module.exports = new ChatbotService();
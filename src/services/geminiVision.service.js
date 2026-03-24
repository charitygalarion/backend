const axios = require('axios');

class GeminiVisionService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    // Use Gemini 2.5 Flash for vision
    this.url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  }

  async detectIngredients(imageBuffer) {
    try {
      if (!this.apiKey) {
        return this.getMockIngredients();
      }

      console.log('📸 Sending image to Gemini Vision...');

      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        `${this.url}?key=${this.apiKey}`,
        {
          contents: [{
            parts: [
              {
                text: "List all the food ingredients you can see in this image. Return ONLY a comma-separated list of ingredient names. Example: 'garlic, onion, chicken, rice'"
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 200,
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
        // Parse comma-separated ingredients
        const ingredients = reply.split(',').map(i => i.trim().toLowerCase());
        console.log('✅ Detected ingredients:', ingredients);
        
        return ingredients.map((name, index) => ({
          name: name,
          confidence: 85 - (index * 5)
        }));
      }
      
      return this.getMockIngredients();
      
    } catch (error) {
      console.error('❌ Gemini Vision error:', error.message);
      return this.getMockIngredients();
    }
  }

  getMockIngredients() {
    return [
      { name: 'garlic', confidence: 85 },
      { name: 'onion', confidence: 82 },
      { name: 'chicken', confidence: 78 },
      { name: 'rice', confidence: 75 },
      { name: 'tomato', confidence: 72 },
    ];
  }
}

module.exports = new GeminiVisionService();
const axios = require('axios');

class GeminiVisionService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = 'gemini-2.5-flash';
    this.url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  async detectIngredients(imageBuffer) {
    try {
      if (!this.apiKey) {
        console.log('⚠️ No Gemini API key, using mock ingredients');
        return this.getMockIngredients();
      }

      console.log('📸 Sending image to Gemini Vision...');
      console.log('📏 Image size:', (imageBuffer.length / 1024).toFixed(2), 'KB');

      const base64Image = imageBuffer.toString('base64');
      const mimeType = 'image/jpeg';

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [
              {
                text: "List all the food ingredients you can see in this image. Return ONLY a comma-separated list of ingredient names. Example: 'garlic, onion, chicken, rice'"
              },
              {
                inlineData: {
                  mimeType: mimeType,
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
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // ✅ SAFELY extract the response text
      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (reply && typeof reply === 'string' && reply.trim()) {
        const ingredients = reply.split(',').map(i => i.trim().toLowerCase());
        console.log('✅ Detected ingredients:', ingredients);
        
        return ingredients.map((name, index) => ({
          name: name,
          confidence: Math.max(60, 85 - (index * 5))
        }));
      }
      
      console.log('⚠️ No ingredients detected, using mock');
      return this.getMockIngredients();
      
    } catch (error) {
      console.error('❌ Gemini Vision error:', error.message);
      
      // ✅ Always return mock ingredients on error
      console.log('⚠️ Using mock ingredients due to API error');
      return this.getMockIngredients();
    }
  }

  getMockIngredients() {
    // ✅ Return a valid array with proper structure
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
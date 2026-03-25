const axios = require('axios');

class GeminiVisionService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    // ✅ Use gemini-2.5-flash (supports vision)
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

      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');
      const mimeType = 'image/jpeg';

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
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (reply && reply.trim()) {
        // Parse comma-separated ingredients
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
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error details:', error.response.data?.error?.message || error.response.data);
        
        // Handle specific error codes
        if (error.response.status === 403) {
          console.error('⚠️ API key is invalid or quota exceeded');
        } else if (error.response.status === 429) {
          console.error('⚠️ Rate limit exceeded. Try again later.');
        } else if (error.response.status === 404) {
          console.error('⚠️ Model not found. Using fallback.');
        }
      }
      return this.getMockIngredients();
    }
  }

  async checkApiKey() {
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY is not set');
      return false;
    }
    
    try {
      // Quick test with a simple text request
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [{ parts: [{ text: "Hello" }] }],
          generationConfig: { maxOutputTokens: 5 }
        },
        { timeout: 5000 }
      );
      
      console.log('✅ Gemini API key is valid');
      console.log('📊 Using model: gemini-2.5-flash (vision-capable)');
      return true;
    } catch (error) {
      console.error('❌ Gemini API key is invalid:', error.response?.data?.error?.message);
      return false;
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
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
      console.log('⚠️ No Gemini API key');
      return []; // ✅ Return empty array, no mock
    }

    console.log('📸 Sending image to Gemini Vision...');

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
                mimeType: 'image/jpeg',
                data: imageBuffer.toString('base64')
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 200,
        }
      },
      { timeout: 30000 }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (reply && typeof reply === 'string' && reply.trim()) {
      const ingredients = reply.split(',').map(i => i.trim().toLowerCase());
      console.log('✅ Detected ingredients:', ingredients);
      
      return ingredients.map((name, index) => ({
        name: name,
        confidence: Math.max(60, 85 - (index * 5))
      }));
    }
    
    console.log('⚠️ No ingredients detected');
    return []; // ✅ Return empty array, no mock
    
  } catch (error) {
    console.error('❌ Gemini Vision error:', error.message);
    return []; // ✅ Return empty array, no mock
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
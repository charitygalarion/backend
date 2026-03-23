const axios = require('axios');

class HuggingFaceVisionService {
   constructor() {
    this.apiKey = process.env.HF_API_KEY;
    // Update to new router URL
    this.model = 'google/vit-base-patch16-224';
    this.url = `https://router.huggingface.co/hf-inference/models/${this.model}`;
  }

  async detectIngredients(imageBuffer) {
    try {
      if (!this.apiKey) {
        console.error('❌ HF_API_KEY not configured');
        return this.getMockIngredients();
      }

      console.log('🔍 Analyzing food image with Hugging Face...');

      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        this.url,
        { inputs: base64Image },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      console.log('✅ Food detection response received');

      // Food to ingredients mapping
      const foodToIngredients = {
        'adobo': ['chicken', 'soy sauce', 'vinegar', 'garlic', 'bay leaves'],
        'sinigang': ['pork', 'tamarind', 'tomato', 'onion', 'radish', 'kangkong'],
        'lechon': ['pork', 'garlic', 'onion', 'salt', 'pepper'],
        'pancit': ['noodles', 'carrot', 'cabbage', 'chicken', 'soy sauce'],
        'fried chicken': ['chicken', 'flour', 'egg', 'breadcrumbs', 'oil'],
        'fried rice': ['rice', 'garlic', 'egg', 'soy sauce', 'vegetables'],
        'eggplant': ['eggplant', 'oil', 'salt'],
        'tortang talong': ['eggplant', 'egg', 'salt', 'pepper'],
        'lugaw': ['rice', 'chicken', 'ginger', 'garlic', 'egg'],
        'arroz caldo': ['rice', 'chicken', 'ginger', 'garlic', 'egg'],
        'menudo': ['pork', 'potato', 'carrot', 'tomato sauce', 'garlic'],
        'caldereta': ['beef', 'potato', 'carrot', 'tomato sauce', 'cheese'],
        'bicol express': ['pork', 'coconut milk', 'chili', 'shrimp paste'],
        'sisig': ['pork', 'onion', 'chili', 'calamansi', 'mayonnaise'],
        'kare-kare': ['oxtail', 'peanut butter', 'vegetables', 'bagoong'],
      };

      // Get top prediction
      const predictions = response.data;
      if (predictions && predictions.length > 0) {
        const topDish = predictions[0].label.toLowerCase();
        console.log(`🍽️ Detected dish: ${topDish}`);
        
        // Check if dish is in our mapping
        for (const [dish, ingredients] of Object.entries(foodToIngredients)) {
          if (topDish.includes(dish)) {
            return ingredients.map((ing, index) => ({
              name: ing,
              confidence: 85 - (index * 5)
            }));
          }
        }
      }

      // If no specific dish, return common Filipino ingredients
      return this.getCommonFilipinoIngredients();

    } catch (error) {
      console.error('❌ Hugging Face API error:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return this.getMockIngredients();
    }
  }

  getCommonFilipinoIngredients() {
    return [
      { name: 'garlic', confidence: 85 },
      { name: 'onion', confidence: 82 },
      { name: 'rice', confidence: 80 },
      { name: 'soy sauce', confidence: 75 },
      { name: 'vinegar', confidence: 72 },
    ];
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

module.exports = new HuggingFaceVisionService();
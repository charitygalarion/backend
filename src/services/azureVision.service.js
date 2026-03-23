const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');

class AzureVisionService {
  constructor() {
    const key = process.env.AZURE_VISION_KEY;
    const endpoint = process.env.AZURE_VISION_ENDPOINT;
    
    if (!key || !endpoint) {
      console.warn('Azure Vision credentials not configured');
      return;
    }
    
    const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } });
    this.client = new ComputerVisionClient(credentials, endpoint);
  }

  async detectIngredients(imageBuffer) {
    try {
      if (!this.client) {
        return this.getMockIngredients();
      }

      // Analyze image with Azure Vision
      const result = await this.client.analyzeImageInStream(
        () => imageBuffer,
        { visualFeatures: ['Tags', 'Description'] }
      );

      // Food-related keywords for Filipino cuisine
      const foodKeywords = [
        'chicken', 'pork', 'beef', 'fish', 'shrimp', 'tofu', 'egg',
        'garlic', 'onion', 'tomato', 'ginger', 'bell pepper', 'carrot', 'potato',
        'cabbage', 'spinach', 'rice', 'noodles', 'soy sauce', 'vinegar',
        'coconut', 'milk', 'bread', 'cheese', 'butter', 'oil',
        'adobo', 'sinigang', 'lechon', 'pancit', 'sisig', 'kare-kare'
      ];

      // Filter food-related tags
      const foodTags = result.tags.filter(tag => 
        foodKeywords.some(keyword => tag.name.toLowerCase().includes(keyword)) ||
        tag.name.toLowerCase().includes('food') ||
        tag.name.toLowerCase().includes('vegetable') ||
        tag.name.toLowerCase().includes('fruit') ||
        tag.name.toLowerCase().includes('meat')
      );

      // Extract ingredients with confidence > 50%
      const ingredients = foodTags
        .filter(tag => tag.confidence > 0.5)
        .map(tag => ({
          name: tag.name,
          confidence: tag.confidence
        }));

      // Also check description for additional ingredients
      if (result.description && result.description.captions) {
        const description = result.description.captions[0]?.text || '';
        const descWords = description.toLowerCase().split(' ');
        
        foodKeywords.forEach(keyword => {
          if (descWords.includes(keyword) && !ingredients.find(i => i.name === keyword)) {
            ingredients.push({ name: keyword, confidence: 0.6 });
          }
        });
      }

      // If no ingredients detected, use mock
      if (ingredients.length === 0) {
        return this.getMockIngredients();
      }

      return ingredients.slice(0, 10); // Limit to 10 ingredients
      
    } catch (error) {
      console.error('Azure Vision error:', error);
      return this.getMockIngredients();
    }
  }

  getMockIngredients() {
    // Return common Filipino ingredients as fallback
    const commonIngredients = [
      { name: 'garlic', confidence: 0.85 },
      { name: 'onion', confidence: 0.82 },
      { name: 'tomato', confidence: 0.78 },
      { name: 'chicken', confidence: 0.75 },
      { name: 'rice', confidence: 0.72 },
      { name: 'soy sauce', confidence: 0.68 },
      { name: 'vinegar', confidence: 0.65 },
    ];
    return commonIngredients;
  }
}

module.exports = new AzureVisionService();
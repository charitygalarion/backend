// backend/seedTestData.js
// Run this script to seed test users and recipes for the admin dashboard
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Recipe = require('./models/Recipe');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/freshrecipe';

const testUsers = [
  {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    lastActive: new Date(),
    savedRecipes: []
  },
  {
    username: 'jane_smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    lastActive: new Date(Date.now() - 3600000), // 1 hour ago
    savedRecipes: []
  },
  {
    username: 'bob_wilson',
    email: 'bob@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    lastActive: new Date(Date.now() - 86400000), // 1 day ago
    savedRecipes: []
  },
  {
    username: 'alice_brown',
    email: 'alice@example.com',
    password: 'password123',
    role: 'user',
    isActive: false,
    lastActive: new Date(Date.now() - 172800000), // 2 days ago
    savedRecipes: []
  },
  {
    username: 'charlie_davis',
    email: 'charlie@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    lastActive: new Date(),
    savedRecipes: []
  },
  {
    username: 'diana_evans',
    email: 'diana@example.com',
    password: 'password123',
    role: 'user',
    isActive: false,
    lastActive: new Date(Date.now() - 604800000), // 1 week ago
    savedRecipes: []
  },
  {
    username: 'edward_garcia',
    email: 'edward@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    lastActive: new Date(Date.now() - 7200000), // 2 hours ago
    savedRecipes: []
  },
  {
    username: 'frank_martinez',
    email: 'frank@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    lastActive: new Date(),
    savedRecipes: []
  },
  {
    username: 'grace_lee',
    email: 'grace@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    lastActive: new Date(Date.now() - 1800000), // 30 min ago
    savedRecipes: []
  },
  {
    username: 'henry_taylor',
    email: 'henry@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    lastActive: new Date(),
    savedRecipes: []
  }
];

const testRecipes = [
  {
    title: 'Classic Chicken Adobo',
    description: 'The national dish of the Philippines - tangy, savory, and delicious',
    image: '/recipes/adobo.jpg',
    mealType: 'Dinner',
    ingredients: [
      { name: 'Chicken', quantity: '1', unit: 'kg', filipinoName: 'Manok' },
      { name: 'Soy Sauce', quantity: '1/2', unit: 'cup', filipinoName: 'Soya' },
      { name: 'Vinegar', quantity: '1/2', unit: 'cup', filipinoName: 'Suka' },
      { name: 'Garlic', quantity: '6', unit: 'cloves', filipinoName: 'Bawang' },
      { name: 'Bay Leaves', quantity: '3', unit: 'pieces', filipinoName: 'Dahon ng Laurel' }
    ],
    instructions: [
      { step: 1, description: 'Combine chicken, soy sauce, vinegar, garlic, and bay leaves in a pot' },
      { step: 2, description: 'Marinate for 30 minutes' },
      { step: 3, description: 'Bring to a boil, then simmer for 30 minutes' },
      { step: 4, description: 'Fry in oil until brown and crispy' }
    ],
    prepTime: 15,
    cookTime: 45,
    servings: 4,
    difficulty: 'Easy',
    category: ['Filipino', 'Main Dish'],
    isFilipino: true,
    views: 1250
  },
  {
    title: 'Sinigang na Baboy',
    description: 'Sour pork soup with tamarind',
    image: '/recipes/sinigang_baboy.jpg',
    mealType: 'Lunch',
    ingredients: [
      { name: 'Pork Belly', quantity: '500', unit: 'g', filipinoName: 'Baboy' },
      { name: 'Tamarind Paste', quantity: '2', unit: 'tbsp', filipinoName: 'Sampalok' },
      { name: 'Tomatoes', quantity: '2', unit: 'medium', filipinoName: 'Kamatis' },
      { name: 'Radish', quantity: '1', unit: 'medium', filipinoName: 'Labanos' },
      { name: 'Water Spinach', quantity: '1', unit: 'bunch', filipinoName: 'Kangkong' }
    ],
    instructions: [
      { step: 1, description: 'Boil pork in water with tomatoes' },
      { step: 2, description: 'Add tamarind paste and vegetables' },
      { step: 3, description: 'Simmer until pork is tender' },
      { step: 4, description: 'Season with fish sauce and pepper' }
    ],
    prepTime: 20,
    cookTime: 60,
    servings: 6,
    difficulty: 'Medium',
    category: ['Filipino', 'Soup'],
    isFilipino: true,
    views: 980
  },
  {
    title: 'Pancit Canton',
    description: 'Stir-fried egg noodles with vegetables',
    image: '/recipes/pancit_canton.jpg',
    mealType: 'Lunch',
    ingredients: [
      { name: 'Egg Noodles', quantity: '250', unit: 'g', filipinoName: 'Pancit Canton' },
      { name: 'Chicken Breast', quantity: '200', unit: 'g', filipinoName: 'Manok' },
      { name: 'Cabbage', quantity: '1', unit: 'small', filipinoName: 'Repolyo' },
      { name: 'Carrots', quantity: '2', unit: 'medium', filipinoName: 'Karot' },
      { name: 'Soy Sauce', quantity: '3', unit: 'tbsp', filipinoName: 'Soya' }
    ],
    instructions: [
      { step: 1, description: 'Cook noodles according to package' },
      { step: 2, description: 'Stir-fry chicken and vegetables' },
      { step: 3, description: 'Add noodles and soy sauce' },
      { step: 4, description: 'Mix well and serve with calamansi' }
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    difficulty: 'Easy',
    category: ['Filipino', 'Noodles'],
    isFilipino: true,
    views: 742
  },
  {
    title: 'Chicken Inasal',
    description: 'Grilled chicken with native spices',
    image: '/recipes/chicken_inasal.jpg',
    mealType: 'Lunch',
    ingredients: [
      { name: 'Chicken', quantity: '1', unit: 'whole', filipinoName: 'Manok' },
      { name: 'Coconut Vinegar', quantity: '1/2', unit: 'cup', filipinoName: 'Suka' },
      { name: 'Lemongrass', quantity: '3', unit: 'stalks', filipinoName: 'Tanglad' },
      { name: 'Ginger', quantity: '2', unit: 'inch', filipinoName: 'Luya' },
      { name: 'Garlic', quantity: '8', unit: 'cloves', filipinoName: 'Bawang' }
    ],
    instructions: [
      { step: 1, description: 'Marinate chicken in vinegar and spices overnight' },
      { step: 2, description: 'Grill over charcoal' },
      { step: 3, description: 'Baste with oil and marinade while grilling' },
      { step: 4, description: 'Serve with atchar and rice' }
    ],
    prepTime: 30,
    cookTime: 45,
    servings: 4,
    difficulty: 'Medium',
    category: ['Filipino', 'Grilled'],
    isFilipino: true,
    views: 625
  },
  {
    title: 'Lechon Kawali',
    description: 'Crispy fried pork belly',
    image: '/recipes/lechon_kawali.jpg',
    mealType: 'Dinner',
    ingredients: [
      { name: 'Pork Belly', quantity: '1', unit: 'kg', filipinoName: 'Baboy' },
      { name: 'Bay Leaves', quantity: '5', unit: 'pieces', filipinoName: 'Dahon ng Laurel' },
      { name: 'Peppercorns', quantity: '1', unit: 'tsp', filipinoName: 'Pimiento' },
      { name: 'Salt', quantity: '2', unit: 'tbsp', filipinoName: 'Asin' },
      { name: 'Oil', quantity: '4', unit: 'cups', filipinoName: 'Mantika' }
    ],
    instructions: [
      { step: 1, description: 'Boil pork with spices until tender' },
      { step: 2, description: 'Air dry or pat dry the pork' },
      { step: 3, description: 'Deep fry until golden and crispy' },
      { step: 4, description: 'Serve with liver sauce' }
    ],
    prepTime: 15,
    cookTime: 90,
    servings: 6,
    difficulty: 'Medium',
    category: ['Filipino', 'Main Dish'],
    isFilipino: true,
    views: 856
  },
  {
    title: 'Halo-Halo',
    description: 'Shaved ice dessert with mixed fruits',
    image: '/recipes/halo_halo.jpg',
    mealType: 'Snack',
    ingredients: [
      { name: 'Shaved Ice', quantity: '2', unit: 'cups', filipinoName: 'Yeast' },
      { name: 'Sweetened Milk', quantity: '1/2', unit: 'cup', filipinoName: 'Gatas' },
      { name: 'Jackfruit', quantity: '1/2', unit: 'cup', filipinoName: 'Langka' },
      { name: 'Coconut Gel', quantity: '1/4', unit: 'cup', filipinoName: 'Nata de Coco' },
      { name: 'Purple Yam', quantity: '1/4', unit: 'cup', filipinoName: 'Ube' }
    ],
    instructions: [
      { step: 1, description: 'Layer fruits and sweets in a glass' },
      { step: 2, description: 'Add shaved ice on top' },
      { step: 3, description: 'Pour sweetened milk' },
      { step: 4, description: 'Mix well before eating' }
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 1,
    difficulty: 'Easy',
    category: ['Filipino', 'Dessert'],
    isFilipino: true,
    views: 520
  },
  {
    title: 'Bicol Express',
    description: 'Spicy pork stew with coconut milk and chilies',
    image: '/recipes/bicol_express.jpg',
    mealType: 'Dinner',
    ingredients: [
      { name: 'Pork Belly', quantity: '500', unit: 'g', filipinoName: 'Baboy' },
      { name: 'Coconut Milk', quantity: '2', unit: 'cups', filipinoName: 'Gata' },
      { name: 'Shrimp Paste', quantity: '2', unit: 'tbsp', filipinoName: 'Bagoong' },
      { name: 'Chili Peppers', quantity: '10', unit: 'pieces', filipinoName: 'Siling Labuyo' },
      { name: 'Garlic', quantity: '4', unit: 'cloves', filipinoName: 'Bawang' }
    ],
    instructions: [
      { step: 1, description: 'Sauté garlic and onion' },
      { step: 2, description: 'Add pork and cook until browned' },
      { step: 3, description: 'Add coconut milk and simmer' },
      { step: 4, description: 'Add shrimp paste and chilies' }
    ],
    prepTime: 15,
    cookTime: 45,
    servings: 4,
    difficulty: 'Medium',
    category: ['Filipino', 'Spicy', 'Main Dish'],
    isFilipino: true,
    views: 680
  },
  {
    title: 'Tinolang Isda',
    description: 'Fish soup with ginger and vegetables',
    image: '/recipes/tinolang_isda.jpg',
    mealType: 'Lunch',
    ingredients: [
      { name: 'Fish', quantity: '1', unit: 'kg', filipinoName: 'Isda' },
      { name: 'Ginger', quantity: '3', unit: 'inch', filipinoName: 'Luya' },
      { name: 'Onion', quantity: '1', unit: 'medium', filipinoName: 'Sibuyas' },
      { name: 'Tomatoes', quantity: '2', unit: 'medium', filipinoName: 'Kamatis' },
      { name: 'Fish Sauce', quantity: '2', unit: 'tbsp', filipinoName: 'Patis' }
    ],
    instructions: [
      { step: 1, description: 'Boil water with ginger and onion' },
      { step: 2, description: 'Add tomatoes and fish' },
      { step: 3, description: 'Season with fish sauce' },
      { step: 4, description: 'Add green onions and serve' }
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'Easy',
    category: ['Filipino', 'Soup', 'Healthy'],
    isFilipino: true,
    views: 450
  },
  {
    title: 'Ginataanang Langka',
    description: 'Jackfruit cooked in coconut milk',
    image: '/recipes/ginataang_lanka.jpg',
    mealType: 'Dinner',
    ingredients: [
      { name: 'Young Jackfruit', quantity: '1', unit: 'can', filipinoName: 'Langka' },
      { name: 'Coconut Milk', quantity: '2', unit: 'cups', filipinoName: 'Gata' },
      { name: 'Shrimp Paste', quantity: '2', unit: 'tbsp', filipinoName: 'Bagoong' },
      { name: 'Chili', quantity: '2', unit: 'pieces', filipinoName: 'Siling Pula' },
      { name: 'Garlic', quantity: '4', unit: 'cloves', filipinoName: 'Bawang' }
    ],
    instructions: [
      { step: 1, description: 'Sauté garlic and onion' },
      { step: 2, description: 'Add coconut milk and bring to simmer' },
      { step: 3, description: 'Add jackfruit and shrimp paste' },
      { step: 4, description: 'Cook until tender and season' }
    ],
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    difficulty: 'Easy',
    category: ['Filipino', 'Main Dish', 'Vegan'],
    isFilipino: true,
    views: 390
  },
  {
    title: 'Pochero',
    description: 'Beef stew with tomatoes and plantains',
    image: '/recipes/pochero.jpg',
    mealType: 'Dinner',
    ingredients: [
      { name: 'Beef', quantity: '1', unit: 'kg', filipinoName: 'Baka' },
      { name: 'Tomatoes', quantity: '4', unit: 'medium', filipinoName: 'Kamatis' },
      { name: 'Plantains', quantity: '2', unit: 'pieces', filipinoName: 'Saging' },
      { name: 'Chickpeas', quantity: '1', unit: 'can', filipinoName: 'Garbanzos' },
      { name: 'Onion', quantity: '1', unit: 'large', filipinoName: 'Sibuyas' }
    ],
    instructions: [
      { step: 1, description: 'Boil beef with tomatoes until tender' },
      { step: 2, description: 'Add plantains and chickpeas' },
      { step: 3, description: 'Season with salt and pepper' },
      { step: 4, description: 'Serve with rice' }
    ],
    prepTime: 15,
    cookTime: 90,
    servings: 6,
    difficulty: 'Medium',
    category: ['Filipino', 'Stew', 'Main Dish'],
    isFilipino: true,
    views: 420
  },
  {
    title: 'Pinakbet',
    description: 'Mixed vegetables with shrimp paste',
    image: '/recipes/pinakbet.jpg',
    mealType: 'Lunch',
    ingredients: [
      { name: 'Squash', quantity: '1', unit: 'cup', filipinoName: 'Kalabasa' },
      { name: 'Eggplant', quantity: '1', unit: 'medium', filipinoName: 'Talong' },
      { name: 'Okra', quantity: '1', unit: 'cup', filipinoName: 'Okra' },
      { name: 'Shrimp Paste', quantity: '3', unit: 'tbsp', filipinoName: 'Bagoong' },
      { name: 'Garlic', quantity: '4', unit: 'cloves', filipinoName: 'Bawang' }
    ],
    instructions: [
      { step: 1, description: 'Sauté garlic and onion' },
      { step: 2, description: 'Add vegetables and shrimp paste' },
      { step: 3, description: 'Add water and cover to cook' },
      { step: 4, description: 'Season and serve with rice' }
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'Easy',
    category: ['Filipino', 'Vegetables', 'Healthy'],
    isFilipino: true,
    views: 560
  },
  {
    title: 'Turon',
    description: 'Sweet banana lumpia with caramel',
    image: '/recipe/turon.jpg',
    mealType: 'Snack',
    ingredients: [
      { name: 'Saba Banana', quantity: '6', unit: 'pieces', filipinoName: 'Saba' },
      { name: 'Spring Roll Wrapper', quantity: '12', unit: 'sheets', filipinoName: 'Lumpia Wrapper' },
      { name: 'Brown Sugar', quantity: '1/2', unit: 'cup', filipinoName: 'Asukal na Pula' },
      { name: 'Oil', quantity: '2', unit: 'cups', filipinoName: 'Mantika' }
    ],
    instructions: [
      { step: 1, description: 'Wrap banana in spring roll wrapper' },
      { step: 2, description: 'Roll and seal with water' },
      { step: 3, description: 'Deep fry until golden brown' },
      { step: 4, description: 'Coat with brown sugar' }
    ],
    prepTime: 15,
    cookTime: 15,
    servings: 6,
    difficulty: 'Easy',
    category: ['Filipino', 'Dessert', 'Sweet'],
    isFilipino: true,
    views: 480
  },
  {
    title: 'Paksiw na Isda',
    description: 'Fish cooked in vinegar with ginger',
    image: '/recipes/paksiw_isda.jpg',
    mealType: 'Lunch',
    ingredients: [
      { name: 'Fish', quantity: '1', unit: 'kg', filipinoName: 'Isda' },
      { name: 'Vinegar', quantity: '1', unit: 'cup', filipinoName: 'Suka' },
      { name: 'Ginger', quantity: '2', unit: 'inch', filipinoName: 'Luya' },
      { name: 'Garlic', quantity: '6', unit: 'cloves', filipinoName: 'Bawang' },
      { name: 'Chili', quantity: '4', unit: 'pieces', filipinoName: 'Siling Labuyo' }
    ],
    instructions: [
      { step: 1, description: 'Combine vinegar, garlic, and ginger' },
      { step: 2, description: 'Add fish and bring to boil' },
      { step: 3, description: 'Simmer until fish is cooked' },
      { step: 4, description: 'Add chilies and serve' }
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'Easy',
    category: ['Filipino', 'Sour', 'Healthy'],
    isFilipino: true,
    views: 380
  },
  {
    title: 'Kaldereta',
    description: 'Filipino beef stew with tomato sauce',
    image: '/recipes/caldereta.jpg',
    mealType: 'Dinner',
    ingredients: [
      { name: 'Beef', quantity: '1', unit: 'kg', filipinoName: 'Baka' },
      { name: 'Tomato Sauce', quantity: '1', unit: 'cup', filipinoName: 'Sarsa ng Kamatis' },
      { name: 'Liver Spread', quantity: '1/4', unit: 'cup', filipinoName: 'Pate' },
      { name: 'Potatoes', quantity: '2', unit: 'medium', filipinoName: 'Patatas' },
      { name: 'Carrots', quantity: '1', unit: 'medium', filipinoName: 'Karot' }
    ],
    instructions: [
      { step: 1, description: 'Brown beef and set aside' },
      { step: 2, description: 'Sauté garlic, onion, and tomato sauce' },
      { step: 3, description: 'Add beef and simmer until tender' },
      { step: 4, description: 'Add potatoes, carrots, and liver spread' }
    ],
    prepTime: 20,
    cookTime: 90,
    servings: 6,
    difficulty: 'Medium',
    category: ['Filipino', 'Stew', 'Main Dish'],
    isFilipino: true,
    views: 620
  },
  {
    title: 'Sapin-Sapin',
    description: 'Layered sticky rice dessert',
    image: '/recipes/sapin_sapin.jpg',
    mealType: 'Snack',
    ingredients: [
      { name: 'Glutinous Rice', quantity: '2', unit: 'cups', filipinoName: 'Bigas Galapong' },
      { name: 'Coconut Milk', quantity: '3', unit: 'cups', filipinoName: 'Gata' },
      { name: 'Sugar', quantity: '1/2', unit: 'cup', filipinoName: 'Asukal' },
      { name: 'Ube', quantity: '1/2', unit: 'cup', filipinoName: 'Ube' },
      { name: 'Langka', quantity: '1/4', unit: 'cup', filipinoName: 'Jackfruit' }
    ],
    instructions: [
      { step: 1, description: 'Mix rice flour with coconut milk and sugar' },
      { step: 2, description: 'Divide batter and add ube coloring' },
      { step: 3, description: 'Steam layers one by one' },
      { step: 4, description: 'Top with latik and serve' }
    ],
    prepTime: 20,
    cookTime: 45,
    servings: 8,
    difficulty: 'Medium',
    category: ['Filipino', 'Dessert', 'Traditional'],
    isFilipino: true,
    views: 350
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing test users (except admin)
    await User.deleteMany({ role: 'user' });
    console.log('Cleared existing test users');

    // Create test users with hashed passwords
    const hashedUsers = await Promise.all(
      testUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return { ...user, password: hashedPassword };
      })
    );

    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Created ${createdUsers.length} test users`);

    // Clear existing recipes
    await Recipe.deleteMany({});
    console.log('Cleared existing recipes');

    // Create test recipes
    const createdRecipes = await Recipe.insertMany(testRecipes);
    console.log(`Created ${createdRecipes.length} test recipes`);

    // Assign random saved recipes to users
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const numSaved = Math.floor(Math.random() * 4); // 0-3 recipes
      const shuffledRecipes = [...createdRecipes].sort(() => 0.5 - Math.random());
      const savedRecipes = shuffledRecipes.slice(0, numSaved).map(r => r._id);
      
      user.savedRecipes = savedRecipes;
      await user.save();
    }
    console.log('Assigned saved recipes to users');

    console.log('\n=== Test Data Seeded Successfully ===');
    console.log(`Users: ${createdUsers.length}`);
    console.log(`Recipes: ${createdRecipes.length}`);
    console.log('\nTest User Credentials:');
    console.log('Email: john@example.com | Password: password123');
    console.log('Email: jane@example.com | Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

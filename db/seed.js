/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const User = require('../models/user');
const Product = require('../models/product');
const Category = require('../models/category');
const mockData = require('./mockedData');

require('dotenv').config();

// Connect to the MongoDB database
mongoose.connect(process.env.DATABASE, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

// Seed function to populate the database with mock data
const seedDatabase = async () => {
  try {
    await db.dropDatabase(); // Drop the existing database to start fresh

    // Insert categories
    const categories = await Category.insertMany(mockData.categories);

    // Map category names to their respective IDs
    const categoryMap = {};
    categories.forEach((category) => {
      categoryMap[category.name] = category._id;
    });

    // Create product objects with category IDs
    const products = mockData.products.map((product) => ({
      ...product,
      category: categoryMap[product.category],
    }));

    // Insert products
    await Product.insertMany(products);
    // Insert the mock user data into the database
    await User.insertMany(mockData.users);

    console.log('Database seeded successfully!');
    db.close(); // Close the database connection
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Call the seed function to populate the database
seedDatabase();

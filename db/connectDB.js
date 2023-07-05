/* eslint-disable no-console */
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('DB Connected');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1); // Exit the process with a failure code
  }
};

module.exports = connectDB;

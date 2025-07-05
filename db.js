const mongoose = require('mongoose');
require('dotenv').config();

// Define the MongoDB connection URL
const mongoURL = process.env.MONGODB_URL_LOCAL;

// Set up MongoDB connection 
mongoose.connect(mongoURL);


// Get the default connection
// Mongoose maintains a default connection object representing the MongoDB connection - "db"
const db = mongoose.connection;

// Define event listeners for database connection
db.on('connected', () => {  
    console.log('Connected to MongoDB server');   // event listener will listen the 'connected' msg and print the text - 'connected' is predefined and understood by mongodb
});

db.on('error', (err) => {
    console.error('MongoDB connection error: ',err);
});

db.on('disconnected', () => {
    console.log('MongoDB disconnected');  // will be printed when db server is down - let say we stop the server and so this msg is printed
});

// Export the database connection
module.exports = db; // db - represents the mongodb connection - this is now needed to be imported in server.js file to run
const mongoose = require('mongoose');

// Define the schema for a Place
const placeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true }
});

// Export the Place model
module.exports = mongoose.model('Place', placeSchema);
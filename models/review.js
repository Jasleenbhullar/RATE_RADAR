const mongoose = require('mongoose');


const reviewSchema = new mongoose.Schema({
    placeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
    name: { type: String, required: true }, 
    comment: { type: String, required: true }, 
    rating: { type: Number, required: true, min: 1, max: 5 } 
});


module.exports = mongoose.model('Review', reviewSchema);
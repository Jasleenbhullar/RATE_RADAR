const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const morgan = require('morgan'); 
const mongoose = require('mongoose');
const Place = require('./models/place');
const Review = require('./models/review');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json()); 
app.use(morgan('dev')); 

mongoose.connect('mongodb://localhost:27017/rateradar', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB:', err);
});


app.get('/', async (req, res) => {
    try {
       
        const places = await Place.find();
    
        const placesWithRatings = await Promise.all(places.map(async place => {
            const reviews = await Review.find({ placeId: place._id });
            let avgRating = null;
            if (reviews.length > 0) {
                avgRating = (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1);
            }
            return { ...place.toObject(), avgRating };
        }));
        res.render('index', { places: placesWithRatings });
    } catch (err) {
        console.error('Error fetching places:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/place/:id', async (req, res) => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) return res.status(404).send('Place not found');
        const placeReviews = await Review.find({ placeId: req.params.id });
        
        let avgRating = null;
        if (placeReviews.length > 0) {
            avgRating = (placeReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / placeReviews.length).toFixed(1);
        }
        res.render('place', { place, reviews: placeReviews, avgRating });
    } catch (err) {
        console.error('Error fetching place:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/add-place', async (req, res) => {
    const { name, location } = req.body;
    try {
        const newPlace = new Place({ name, location });
        await newPlace.save();
        res.redirect('/');
    } catch (err) {
        console.error('Error adding place:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/place/:id/review', async (req, res) => {
    const { name, comment, rating } = req.body;
    const placeId = req.params.id;
    try {
        const newReview = new Review({ placeId, name, comment, rating });
        await newReview.save();
        res.redirect(`/place/${placeId}`);
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/search', async (req, res) => {
    const query = req.query.q?.toLowerCase();
    if (!query) {
        return res.render('search', { place: null, reviews: [], notFound: false });
    }
    try {
        const place = await Place.findOne({ name: { $regex: query, $options: 'i' } });
        if (place) {
            const placeReviews = await Review.find({ placeId: place._id });
            let avgRating = null;
            if (placeReviews.length > 0) {
                avgRating = (placeReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / placeReviews.length).toFixed(1);
            }
        
            const placeWithRating = { ...place.toObject(), avgRating };
            res.render('search', { place: placeWithRating, reviews: placeReviews, notFound: false });
        } else {
            res.render('search', { place: null, reviews: [], notFound: true });
        }
    } catch (err) {
        console.error('Error searching for place:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.use((err, req, res, next) => {
    if (!err.status) {
        err.status = 500;
    }
    res.status(err.status).send(`
        <h1>Error ${err.status}</h1>
        <p>${err.message}</p>
        <a href="/">Back to Home</a>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
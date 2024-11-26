const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = 3000;

// Import models
const Restaurant = require('./models/Restaurant');  // Ensure Restaurant model is imported here
require('./models/Product');
require('./models/Order');

// Import routes
const orderRoutes = require('./routes/order.routes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const apiRoutes = require('./routes/api'); // Import API routes for suggestions

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/food_delivery_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to FoodFaster.ai Database'))
  .catch(err => console.error('Database connection error:', err));

// Define routes
app.use('/orders', orderRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/api', apiRoutes); // API routes for auto-suggestions

// Default route (home page)
app.get('/', async (req, res) => {
    try {
        // Fetch the restaurant data to be passed to the view
        const restaurants = await Restaurant.find();

        // Render the index view with restaurant data
        res.render('index', { restaurants, orders: [], message: null });
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.render('index', { restaurants: [], orders: [], message: 'Error loading restaurants' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

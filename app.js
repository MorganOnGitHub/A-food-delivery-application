const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const apiRoutes = require('./routes/api'); // Import the new API routes for suggestions

// Import the Restaurant model to fetch data
const Restaurant = require('./models/Restaurant');

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Database connection
mongoose.connect('mongodb://127.0.0.1/food_delivery_app')  // Ensure your DB name is correct here
  .then(() => console.log('Connected to FoodFaster.ai Database'))
  .catch(err => console.error('Error connecting to database:', err));

// Routes
app.use('/users', userRoutes);
app.use('/restaurants', restaurantRoutes);  // Use the restaurantRoutes for restaurant management
app.use('/api', apiRoutes); // Use the new API routes

// Home route - Fetch all restaurants and render them on the home page
app.get('/', async (req, res) => {
  try {
    // Fetch all restaurants from the database
    const restaurants = await Restaurant.find(); 

    // Pass the restaurants data to the view
    res.render('index', { restaurants });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).send('Error fetching restaurant data.');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

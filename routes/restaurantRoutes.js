const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

// Route to view all restaurants
router.get('/', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.render('index', { restaurants });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).render('error', { message: 'Error retrieving restaurants' });
  }
});

// Route to view restaurant details by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).render('error', { message: 'Restaurant not found' });
    }
    res.render('restaurantDetails', { restaurant });
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'An error occurred while retrieving restaurant details' });
  }
});

// Route to create a new restaurant - GET form page
router.get('/create_restaurant', (req, res) => {
  res.render('createRestaurant');  // This should render the form for creating a restaurant
});

// Route to handle form submission to create a new restaurant
router.post('/create_restaurant', async (req, res) => {
  try {
    const { restaurantName, restaurantPhone, restaurantEmail, restaurantLocation, openingTimes } = req.body;

    // Validate opening times
    const timeFormat = /^([01]\d|2[0-3]):[0-5]\d - ([01]\d|2[0-3]):[0-5]\d$/;
    for (let day in openingTimes) {
      if (!timeFormat.test(openingTimes[day])) {
        return res.status(400).render('error', { message: `Invalid time format for ${day}. Please use "HH:MM - HH:MM".` });
      }
    }

    // Create new restaurant with opening times
    const newRestaurant = new Restaurant({
      name: restaurantName,
      phone_number: restaurantPhone,
      email: restaurantEmail,
      location: restaurantLocation,
      openingTimes: openingTimes
    });

    await newRestaurant.save();
    res.redirect('/');  // Redirect to the home page after creation
  } catch (error) {
    console.error(error);
    res.status(500).render('error', { message: 'Error creating restaurant' });
  }
});

module.exports = router;
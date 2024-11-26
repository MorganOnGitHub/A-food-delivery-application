const express = require('express');
const router = express.Router();  // Make sure to initialize the router here
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

// Route to search for restaurants by name
router.get('/search', async (req, res) => {
  const { query } = req.query;  // The search query from the user
  
  try {
    if (!query) {
      return res.render('index', { restaurants: [] });  // If no query, return an empty list
    }

    // Optimized query using text search for partial matches and case insensitivity
    const restaurants = await Restaurant.find({ 
      $text: { $search: query, $caseSensitive: false } 
    });

    res.render('index', { restaurants });  // Render results to the homepage
  } catch (error) {
    console.error(error);
    res.status(500).send('Error searching for restaurants');
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

// Route to view restaurant's menu, with sorting functionality by ingredient
router.get('/:id/menu/sort', async (req, res) => {
  const { id } = req.params;  // Use `id` from the URL path parameter
  const { sortBy } = req.query; // 'ingredient' or other criteria

  try {
    const restaurant = await Restaurant.findById(id);

    if (!restaurant || !restaurant.menu || restaurant.menu.length === 0) {
      return res.render('restaurantDetails', { restaurant, menu: [], message: 'Menu is empty. Cannot sort.' });
    }

    let sortedMenu = [];
    if (sortBy === 'ingredient') {
      sortedMenu = restaurant.menu.sort((a, b) => {
        const ingredientA = a.ingredients.join(', ').toLowerCase();
        const ingredientB = b.ingredients.join(', ').toLowerCase();
        return ingredientA.localeCompare(ingredientB);
      });
    }

    res.render('restaurantDetails', { restaurant, menu: sortedMenu, message: null });

  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).render('restaurantDetails', { message: 'Error fetching menu.' });
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

module.exports = router;  // Make sure to export the router at the end

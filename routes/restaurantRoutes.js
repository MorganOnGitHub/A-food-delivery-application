const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

// Render restaurant creation form
router.get('/create_restaurant', (req, res) => {
  res.render('create_restaurant');
});

// Create a new restaurant
router.post('/create_restaurant', async (req, res) => {
  const { restaurantName, restaurantEmail, restaurantPhone, restaurantLocation } = req.body;

  if (!restaurantName || !restaurantEmail || !restaurantPhone || !restaurantLocation) {
    return res.status(400).send('All fields are required.');
  }

  try {
    const existingRestaurant = await Restaurant.findOne({ name: restaurantName });
    if (existingRestaurant) {
      return res.status(400).send('A restaurant with this name already exists.');
    }

    const newRestaurant = new Restaurant({
      name: restaurantName,
      email: restaurantEmail,
      phone_number: restaurantPhone,
      location: restaurantLocation
    });

    await newRestaurant.save();
    res.send(`Restaurant created successfully: ${restaurantName}`);
  } catch (err) {
    console.error('Error creating restaurant:', err);
    res.status(500).send('Error creating restaurant.');
  }
});

// Update restaurant
router.put('/edit_restaurant/:id', async (req, res) => {
  const { restaurantName, restaurantEmail, restaurantPhone, restaurantLocation } = req.body;

  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).send('Restaurant not found.');

    restaurant.name = restaurantName;
    restaurant.email = restaurantEmail;
    restaurant.phone_number = restaurantPhone;
    restaurant.location = restaurantLocation;

    await restaurant.save();
    res.send(`Restaurant ${restaurantName} updated successfully.`);
  } catch (err) {
    console.error('Error updating restaurant:', err);
    res.status(500).send('Error updating restaurant.');
  }
});

// Delete restaurant
router.post('/delete_restaurant/:id', async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    res.redirect('/restaurants/delete_restaurant');
  } catch (err) {
    console.error('Error deleting restaurant:', err);
    res.status(500).send('Error deleting restaurant.');
  }
});

// Render the delete restaurant page
router.get('/delete_restaurant', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.render('delete_restaurant', { restaurants });
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    res.status(500).send('Error fetching restaurants.');
  }
});

module.exports = router;

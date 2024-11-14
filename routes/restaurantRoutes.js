// routes/restaurantRoutes.js
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/restaurant');

// Route for searching restaurants by cuisine
router.get('/search', async (req, res) => {
  try {
    const { cuisine } = req.query;
    const restaurants = await Restaurant.find({ cuisine: new RegExp(cuisine, 'i') });
    res.render('searchResults', { restaurants, cuisine });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;

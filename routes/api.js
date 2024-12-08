const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

// Auto-suggestions for cuisine types
router.get('/cuisine-suggestions', async (req, res) => {
  const { query } = req.query;
  const suggestions = await Restaurant.find({ cuisine: new RegExp(query, 'i') })
    .limit(5)
    .distinct('cuisine');
  res.json(suggestions);
});

module.exports = router;
const express = require('express');
const User = require('../models/User'); // Ensure this path is correct
const router = express.Router();

// Render user creation form
router.get('/create_user', (req, res) => {
  res.render('create_user');
});

// Handle user creation
router.post('/create_user', async (req, res) => {
  const { name, email, phone_number } = req.body;

  const user = new User({ name, email, phone_number });

  try {
    await user.save();
    res.redirect('/'); // Redirect after successful creation
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).send('Error creating user: ' + error.message);
  }
});

module.exports = router;


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

const url = 'mongodb://127.0.0.1/accounts';
mongoose.connect(url)
  .then(() => {
    console.log('Connected to Foodfaster.ai Database.');
  })
  .catch(err => {
    console.error('Error connecting to Foodfaster.ai Database: ' + err);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone_number: Number,
});
const User = mongoose.model('User', userSchema);

const restSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format.']
  },
  phone_number: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'Invalid phone number format. Must be 10 digits.']
  },
  location: {
    type: String,
    required: true
  }
});
const Restaurant = mongoose.model('Restaurant', restSchema);

app.use(express.urlencoded({ extended: true }));

// Create Restaurant with validation and duplicate check
app.post('/create_restaurant', async (req, res) => {
  const { restaurantName, restaurantEmail, restaurantPhone, restaurantLocation } = req.body;

  if (!restaurantName || !restaurantEmail || !restaurantPhone || !restaurantLocation) {
    return res.status(400).send('Error: All fields (name, email, phone, location) are required.');
  }

  if (restaurantName.length < 2 || restaurantName.length > 50) {
    return res.status(400).send('Error: Restaurant name must be between 2 and 50 characters.');
  }

  if (!/^\S+@\S+\.\S+$/.test(restaurantEmail)) {
    return res.status(400).send('Error: Invalid email format.');
  }

  if (!/^\d{10}$/.test(restaurantPhone)) {
    return res.status(400).send('Error: Invalid phone number format.');
  }

  const existingRestaurant = await Restaurant.findOne({ name: restaurantName });
  if (existingRestaurant) {
    return res.status(400).send('Error: A restaurant with this name already exists.');
  }

  

  const newRestaurant = new Restaurant({
    name: restaurantName,
    email: restaurantEmail,
    phone_number: restaurantPhone,
    location: restaurantLocation
  });

  try {
    await newRestaurant.save();
    res.send(`Restaurant created successfully: ${restaurantName}`);
  } catch (err) {
    console.error('Error creating restaurant: ' + err);
    res.status(500).send('Error creating restaurant.');
  }
});

// Modify Restaurant with validation and authorization
app.put('/edit_restaurant/:id', async (req, res) => {
  const { restaurantName, restaurantEmail, restaurantPhone, restaurantLocation } = req.body;

  if (!restaurantName || !restaurantEmail || !restaurantPhone || !restaurantLocation) {
    return res.status(400).send('Error: All fields are required.');
  }

  if (restaurantName.length < 2 || restaurantName.length > 50) {
    return res.status(400).send('Error: Restaurant name must be between 2 and 50 characters.');
  }

  if (!/^\S+@\S+\.\S+$/.test(restaurantEmail)) {
    return res.status(400).send('Error: Invalid email format.');
  }

  if (!/^\d{10}$/.test(restaurantPhone)) {
    return res.status(400).send('Error: Invalid phone number format.');
  }

  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).send('Error: Restaurant not found.');
  }

  // Authorization check placeholder
  // if (!req.user.isAdmin) {
  //   return res.status(403).send('Error: You are not authorized to modify this listing.');
  // }

  try {
    restaurant.name = restaurantName;
    restaurant.email = restaurantEmail;
    restaurant.phone_number = restaurantPhone;
    restaurant.location = restaurantLocation;
    await restaurant.save();
    res.send(`Restaurant ${restaurantName} updated successfully.`);
  } catch (err) {
    console.error('Error updating restaurant: ' + err);
    res.status(500).send('Error updating restaurant.');
  }
});

// Delete Restaurant with validation and authorization
app.post('/delete_restaurant/:id', async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).send('Error: Restaurant not found.');
  }

  // Authorization check placeholder
  // if (!req.user.isAdmin) {
  //   return res.status(403).send('Error: You are not authorized to delete this listing.');
  // }

  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    res.redirect('/delete_restaurant');  // Redirect back to delete page after deletion
  } catch (err) {
    console.error('Error deleting restaurant: ' + err);
    res.status(500).send('Error deleting restaurant.');
  }
});

// Route to render the delete restaurant page with a list of all restaurants
app.get('/delete_restaurant', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.render('delete_restaurant', { restaurants: restaurants });
  } catch (err) {
    console.error('Error fetching restaurants: ' + err);
    res.status(500).send('Error fetching restaurants.');
  }
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Routes for rendering views
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create_user', (req, res) => {
  res.render('create_user');
});

app.get('/create_restaurant', (req, res) => {
  res.render('create_restaurant');
});

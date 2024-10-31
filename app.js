const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Database connection
mongoose.connect('mongodb://127.0.0.1/accounts')
  .then(() => console.log('Connected to Foodfaster.ai Database'))
  .catch(err => console.error('Error connecting to database:', err));

// Routes
app.use('/users', userRoutes);
app.use('/restaurants', restaurantRoutes);

// Home route
app.get('/', (req, res) => {
  res.render('index');
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

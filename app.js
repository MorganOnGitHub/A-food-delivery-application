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
  username : String,
  name: String,
  email: String,
  phone_number: Number,
  date_of_birth: Date
});
const User = mongoose.model('User', userSchema);

const restSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone_number: Number
});
const Restaurant = mongoose.model('Restaurant', restSchema); 

app.use(express.urlencoded({ extended: true })); 

app.post('/create_user', async (req, res) => {
  const {usersName, userEmail, userPhone } = req.body;

  try {
    // checks if user has already used email
    const existingUser = await User.findOne({ email: userEmail });
    
    if (existingUser) {
      return res.send('Error: A user with this email already exists.');
    }
    const newUser = new User({
      username: UserName,
      name: usersName,
      email: userEmail,
      phone_number: userPhone
    });
    await newUser.save();
    res.send(`Received data and saved to the database: Name - ${usersName}, Email - ${userEmail}, Phone - ${userPhone}`);
  } catch (err) {
    console.error('Error saving User data: ' + err);
    res.send('Error saving User data.');
  }
});


app.post('/create_restaurant', (req, res) => {
  const { restaurantName, restaurantEmail, restaurantPhone } = req.body;

  const newRestaurant = new Restaurant({
    name: restaurantName,
    email: restaurantEmail,
    phone_number: restaurantPhone,
  });

  newRestaurant.save()
    .then(() => {
      res.send(`Restaurant data saved: Name - ${restaurantName}, Email - ${restaurantEmail}, Phone - ${restaurantPhone}`);
    })
    .catch(err => {
      console.error('Error saving Restaurant data: ' + err);
      res.send('Error saving Restaurant data.');
    });
});

app.set('view engine', 'ejs'); // allows use of res.render
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create_user', (req, res) => {
  res.render('create_user');
});

app.get('/create_restaurant', (req, res) => {
  res.render('create_restaurant');
});

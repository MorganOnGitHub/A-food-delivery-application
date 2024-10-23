const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

app.set('view engine', 'ejs');

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

// Create user route
app.post('/create_user', (req, res) => {
  const { userName, userEmail, userPhone, userAccountDate } = req.body;

  const newUser = new User({
    name: userName,
    email: userEmail,
    phone_number: userPhone
  });

  newUser.save()
    .then(() => {
      res.send(`Received data and saved to the database: Name - ${userName}, Email - ${userEmail}, Phone - ${userPhone}`);
    })
    .catch(err => {
      console.error('Error saving User data: ' + err);
      res.send('Error saving User data.');
    });
});

// Create restaurant route
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

app.get('/viewAccounts', async (req, res) => {
  const Users = await User.find({});
  res.render('viewAccounts', { Users }); 
});

app.get('/edit/:UserId', async (req, res) => {
  const UserId = req.params.UserId;

  try {
      const user = await User.findById(UserId);
      res.render('edit', { user });
  } catch (err) {
      console.error('Error retrieving User for edit: ' + err);
      res.send('Error retrieving User for edit.');
  }
});

app.post('/edit/:UserId', async (req, res) => {
  const UserId = req.params.UserId;

  try {
      await User.findByIdAndUpdate(UserId, req.body);
      res.redirect('/viewAccounts');
  } catch (err) {
      console.error('Error updating User: ' + err);
      res.send('Error updating User.');
  }
});

app.post('/delete/:UserId', async (req, res) => {
  const UserId = req.params.UserId;

  try {
      await User.findByIdAndDelete(UserId);
      res.redirect('/viewAccounts');
  } catch (err) {
      console.error('Error deleting User: ' + err);
      res.send('Error deleting User.');
  }
});

app.post('/viewAccounts', async (req, res) => {
  const Users = await User.find({
    name: req.body.user_name,  
    date_of_birth: { $gte: req.body.start_date, $lte: req.body.end_date }
  });
  res.render('viewAccounts', { Users });
});

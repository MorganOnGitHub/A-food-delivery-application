const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

const url = 'mongodb://127.0.0.1/accounts';
mongoose.connect(url)
  .then(() => {
    console.log('Connected to Foodfaster.ai Database.');
  })
  .catch(err => {
    console.error('Error connecting to Foodfaster.ai Database: ' + err);
  });

// Define User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  phone_number: { type: Number, required: true },
  password: { type: String, required: true } 
});
const User = mongoose.model('User', userSchema);

// Define Restaurant Schema
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
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create_user', (req, res) => {
  res.render('create_user');
});

app.get('/create_restaurant', (req, res) => {
  res.render('create_restaurant');
});

app.post('/create_user', async (req, res) => {
  const { usersName, UserName, userPhone, userEmail, userPassword } = req.body;

  if (!usersName || !UserName || !userPhone || !userEmail || !userPassword) {
    return res.status(400).send('Error: All fields (name, username, phone, email, password) are required.');
  }

  if (!/^[A-Za-z]{2,30}$/.test(usersName)) {
    return res.status(400).send('Error: Name must be 2 to 30 characters long and only contain letters.');
  }

  if (!/^[A-Za-z0-9]{2,30}$/.test(UserName)) {
    return res.status(400).send('Error: Username must be 2 to 30 characters long and can contain letters and numbers.');
  }

  if (!/^\d{10}$/.test(userPhone)) {
    return res.status(400).send('Error: Phone number must be exactly 10 digits.');
  }

  if (!/^\S+@\S+\.\S+$/.test(userEmail)) {
    return res.status(400).send('Error: Invalid email format.');
  }

  const existingUser = await User.findOne({ email: userEmail });
  if (existingUser) {
    return res.status(400).send('Error: A user with this email already exists.');
  }

  const newUser = new User({
    name: usersName,
    username: UserName,
    phone_number: userPhone,
    email: userEmail,
    password: userPassword
  });

  try {
    await newUser.save();
    res.send(`User created successfully: ${usersName}`);
  } catch (err) {
    console.error('Error creating user: ' + err);
    res.status(500).send('Error creating user.');
  }
});

// Search user by email
app.get('/search/email/:email', async (req, res) => {
    try {
        const email = req.params.email;
        
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const user = await User.findOne({ email: email });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                phone_number: user.phone_number
            }
        });
    } catch (err) {
        console.error('Error searching user by email:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

app.get('/search/name/:name', async (req, res) => {
    try {
        const name = req.params.name;
        
        if (!name || name.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        const users = await User.find({
            name: { $regex: name, $options: 'i' } 
        });
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No users found'
            });
        }

        res.json({
            success: true,
            users: users.map(user => ({
                name: user.name,
                email: user.email,
                phone_number: user.phone_number
            }))
        });
    } catch (err) {
        console.error('Error searching users by name:', err);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

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

app.post('/delete_restaurant/:id', async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).send('Error: Restaurant not found.');
  }

  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    res.redirect('/delete_restaurant'); 
  } catch (err) {
    console.error('Error deleting restaurant: ' + err);
    res.status(500).send('Error deleting restaurant.');
  }
});

app.get('/delete_restaurant', async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.render('delete_restaurant', { restaurants: restaurants });
  } catch (err) {
    console.error('Error fetching restaurants: ' + err);
    res.status(500).send('Error fetching restaurants.');
  }
});

app.get('/change-password', (req, res) => {
  res.render('change-password');
});

app.post('/change-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.render('change-password', {
        message: 'All fields are required'
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('change-password', {
        message: 'User not found'
      });
    }

    user.password = newPassword; 
    await user.save();

    res.render('change-password', {
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
    res.render('change-password', {
      message: 'Internal server error'
    });
  }
});

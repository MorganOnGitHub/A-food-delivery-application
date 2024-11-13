const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();

const upload = multer({ dest: 'uploads/' }); // 'uploads/' is the directory for image uploads
app.use('/uploads', express.static('uploads')); 


// MongoDB connection
const url = 'mongodb://127.0.0.1/accounts';
mongoose.connect(url)
  .then(() => console.log('Connected to Foodfaster.ai Database.'))
  .catch(err => console.error('Error connecting to Foodfaster.ai Database:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  phone_number: { type: Number, required: true },
  password: { type: String, required: true },
  image: { type: String }
});
const User = mongoose.model('User', userSchema);

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Start server
app.listen(3000, () => console.log('Server is running on port 3000'));

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/create_user', (req, res) => res.render('create_user'));
app.get('/user_signin', (req, res) => res.render('user_signin'));

// User creation with image upload
app.post('/create_user', upload.single('image'), async (req, res) => {
  const { usersName, UserName, userPhone, userEmail, userPassword } = req.body;
  const imagePath = req.file ? req.file.path : null;

  const newUser = new User({
    name: usersName,
    username: UserName,
    phone_number: userPhone,
    email: userEmail,
    password: userPassword,
    image: imagePath
  });

  try {
    await newUser.save();
    res.send(`User created successfully: ${usersName}`);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).send('Error creating user.');
  }
});

// User sign-in
app.post('/user_signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).send('Invalid email or password.');
    }

    res.redirect('/');
  } catch (err) {
    console.error('Error during user sign-in:', err);
    res.status(500).send('Internal server error');
  }
});

// Routes for search
app.get('/search', (req, res) => res.render('search'));  // Display search page

// Updated search by email route to handle query string
app.get('/search/email', async (req, res) => {
  const email = req.query.email;  // Getting email from query parameter

  try {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.render('searchResults', { user: user });
  } catch (err) {
    console.error('Error searching user by email:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// Route to search users by name using query string
app.get('/search/name', async (req, res) => {
  const name = req.query.name; 

  try {
    if (!name || name.length < 2) {
      return res.render('searchResults', { message: 'Name must be at least 2 characters long' });
    }

    const users = await User.find({ name: { $regex: name, $options: 'i' } });

    if (users.length === 0) {
      return res.render('searchResults', { message: 'No users found' });
    }

    res.render('searchResults', { users: users });
  } catch (err) {
    console.error('Error searching users by name:', err);
    res.render('searchResults', { message: 'Internal server error' });
  }
});
// Sorting by name route
app.get('/sort/name', async (req, res) => {
  try {
    // Ensure case-insensitive sorting and exclude null or empty names
    const users = await User.find({ name: { $ne: null, $ne: '' } })
      .sort({ name: 1 })  // Sort by name (1 for ascending, -1 for descending)
      .collation({ locale: 'en', strength: 2 }); 

    if (users.length === 0) {
      return res.render('searchResults', { message: 'No users found' });
    }

    res.render('searchResults', { users: users });
  } catch (err) {
    console.error('Error sorting users by name:', err);
    res.render('searchResults', { message: 'Error sorting users by name' });
  }
});

// Sorting by email route
app.get('/sort/email', async (req, res) => {
  try {
    // Ensure case-insensitive sorting and exclude null or empty names
    const users = await User.find({ email: { $ne: null, $ne: '' } }) 
      .sort({ email: 1 })
      .collation({ locale: 'en', strength: 2 });

    if (users.length === 0) {
      return res.render('searchResults', { message: 'No users found' });
    }

    res.render('searchResults', { users: users });
  } catch (err) {
    console.error('Error sorting users by email:', err);
    res.render('searchResults', { message: 'Error sorting users by email' });
  }
});

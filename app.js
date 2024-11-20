const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const session = require('express-session');
const upload = multer({ dest: 'uploads/' });
app.use('/uploads', express.static('uploads'));

// MongoDB connection
const url = 'mongodb://127.0.0.1/accounts';
mongoose
  .connect(url)
  .then(() => console.log('Connected to Foodfaster.ai Database.'))
  .catch((err) => console.error('Error connecting to Foodfaster.ai Database:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  phone_number: { type: Number, required: true },
  password: { type: String, required: true },
  image: { type: String },
});
const User = mongoose.model('User', userSchema);
// Define Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true } 
});
const Admin = mongoose.model('Admin', adminSchema);
// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));
function checkLogin(req, res, next) {
  if (req.session.userId) {
    res.locals.user = req.session.userId;
  }
  next();
}

app.use(checkLogin); 


// Start server
app.listen(3000, () => console.log('Server is running on port 3000'));

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/create_user', (req, res) => res.render('create_user'));
app.get('/user_signin', (req, res) => res.render('user_signin'));
app.get('/delete', (req, res) => res.render('deleteAccount'));
app.get('/error', (req, res) => res.render('error'));
app.get('/admin_signin', (req, res) => {res.render('admin_signin', { message: '' });});



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
    image: imagePath,
  });

  try {
    await newUser.save();
    res.render('success', { message: `User created successfully: ${usersName}` });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).render('error', { message: 'Error creating user.' });
  }
});

// User sign-in
app.post('/user_signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).render('error', { message: 'Invalid email or password.' });
    }

    res.redirect('/');
  } catch (err) {
    console.error('Error during user sign-in:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

// Account deletion
app.post('/user/delete-request', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).render('error', { message: 'Missing required fields.' });
    }

    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).render('error', { message: 'Invalid email or password.' });
    }

    await User.deleteOne({ email });

    res.render('accountDeleted', { email });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).render('error', { message: 'Error deleting account.' });
  }
});
app.post('/admin_signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Look up the admin user by username
    const admin = await Admin.findOne({ username });

    // If no admin found or passwords don't match
    if (!admin || admin.password !== password) {
      return res.status(401).render('error', { message: 'Invalid username or password.' });
    }

    // Successfully logged in, store the session
    req.session.userId = admin._id;  // Set the session for the logged-in user
    req.session.role = 'admin';       // Store 'admin' role

    res.redirect('/'); // Redirect to the admin home page or dashboard
  } catch (err) {
    console.error('Error during admin sign-in:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});


const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const session = require('express-session');
const upload = multer({ dest: 'uploads/' });
app.use('/uploads', express.static('uploads'));

// MongoDB connection
const url = 'mongodb://127.0.0.1/accounts';
mongoose
  .connect(url)
  .then(() => console.log('Connected to Foodfaster.ai Database.'))
  .catch((err) => console.error('Error connecting to Foodfaster.ai Database:', err));

// Define Basket Schema
const basketItemSchema = new mongoose.Schema({
  puser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, default: 1 }, 
    },
  ],
});

// Define Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Product name
  description: { type: String }, // Product description
  price: { type: Number, required: true }, // Product price
  image: { type: String },
});

// Create Product Model
const Product = mongoose.model('Product', productSchema);

module.exports = Product;

const basketSchema = new mongoose.Schema({
  items: [basketItemSchema],
  totalPrice: { type: Number, default: 0 }
});
const Basket = mongoose.model('Basket', basketSchema);
// Define User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  phone_number: { type: Number, required: true },
  password: { type: String, required: true },
  image: { type: String },
  basket: {
    type: basketSchema,
    default: { items: [], totalPrice: 0 } 
  }
});


// testing basket functionality
app.get('/create-product', (req, res) => {
  res.render('createProduct'); // Render a form to create products
});

app.post('/create-product', async (req, res) => {
  const { name, description, price } = req.body;

  try {
    const product = new Product({ name, description, price });
    await product.save();

    res.render('success', { message: `Product '${name}' created successfully.` });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).render('error', { message: 'Error creating product.' });
  }
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
app.get('/search', (req,res) => res.render('search'));
app.get('/change-password', (req, res) => res.render('change-password'));
app.get('/admin_index', (req,res) => res.render('admin_index'));
app.get('/create_restaurant', (req,res) => res.render('create_restaurant'));

// search functionality
// Route to search for a user by email
app.get('/search/email', async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email }); // Search the database for the email

    if (!user) {
      return res.render('error', { message: `No user found with email: ${email}` });
    }

    // If user is found, display their details
    res.render('userProfile', { user });
  } catch (err) {
    console.error('Error searching user by email:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

// Route to search for a user by name
app.get('/search/name', async (req, res) => {
  const { name } = req.query;

  try {
    const users = await User.find({ name: { $regex: name, $options: 'i' } }); // Case-insensitive name search

    if (users.length === 0) {
      return res.render('error', { message: `No users found with name: ${name}` });
    }

    // If users are found, display their details
    res.render('userList', { users });
  } catch (err) {
    console.error('Error searching user by name:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});


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

app.post('/user_signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).render('error', { message: 'Invalid email or password.' });
    }

    // Save user ID in session
    req.session.userId = user._id;

    res.redirect('/basket'); // Redirect to basket page after login
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
    const admin = await Admin.findOne({ username });

    if (!admin || admin.password !== password) {
      return res.status(401).render('error', { message: 'Invalid username or password.' });
    }

    // Successfully logged in, store the session
    req.session.userId = admin._id;  // Set the session for the logged-in user
    req.session.role = 'admin';       // Store 'admin' role

    res.redirect('/admin_index'); // Redirect to the admin home page or dashboard
  } catch (err) {
    console.error('Error during admin sign-in:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

// Middleware to check if the user is signed in
function ensureAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/user_signin');
}

// Basket page (only accessible if signed in)
app.get('/basket', ensureAuthenticated, (req, res) => {
  res.render('basket');
});

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const session = require('express-session');
const app = express();

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const upload = multer({ dest: 'uploads/' });
app.use('/uploads', express.static('uploads'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Database connection
const url = 'mongodb://127.0.0.1/accounts';
mongoose.connect(url)
    .then(() => console.log('Connected to Foodfaster.ai Database.'))
    .catch(err => console.error('Error connecting to Foodfaster.ai Database:', err));

// Define schemas
const basketItemSchema = new mongoose.Schema({
    puser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1 },
    }],
});

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
});

const basketSchema = new mongoose.Schema({
    items: [basketItemSchema],
    totalPrice: { type: Number, default: 0 }
});

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

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

// Driver Schema
const driverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone_number: { type: String, required: true },
    available: { type: Boolean, default: true },
    current_orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }]
});

// Menu Schema
const menuSchema = new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: [{
        name: { type: String, required: true },
        description: { type: String },
        price: { type: Number, required: true },
        offers: [{
            description: { type: String },
            discount: { type: Number },
            valid_until: { type: Date }
        }]
    }]
});

// Order Schema
const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    items: [{
        menu_item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        quantity: { type: Number, required: true }
    }],
    status: { type: String, enum: ['pending', 'accepted', 'in_transit', 'delivered'], default: 'pending' },
    estimated_delivery_time: { type: Date },
    delivery_address: { type: String, required: true }
});

// Create models
const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Basket = mongoose.model('Basket', basketSchema);
const Driver = mongoose.model('Driver', driverSchema);
const Menu = mongoose.model('Menu', menuSchema);
const Order = mongoose.model('Order', orderSchema);

// Login check middleware
function checkLogin(req, res, next) {
    if (req.session.userId) {
        res.locals.user = req.session.userId;
    }
    next();
}

app.use(checkLogin);

// Basic routes
app.get('/', (req, res) => res.render('index'));
app.get('/create_user', (req, res) => res.render('create_user'));
app.get('/user_signin', (req, res) => res.render('user_signin'));
app.get('/delete', (req, res) => res.render('deleteAccount'));
app.get('/error', (req, res) => res.render('error'));
app.get('/admin_signin', (req, res) => res.render('admin_signin', { message: '' }));
app.get('/search', (req, res) => res.render('search'));
app.get('/change-password', (req, res) => res.render('change-password'));

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

// Product routes
app.get('/create-product', (req, res) => {
  res.render('createProduct');
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

// Search routes
app.get('/search/email', async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('error', { message: `No user found with email: ${email}` });
    }
    res.render('userProfile', { user });
  } catch (err) {
    console.error('Error searching user by email:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

app.get('/search/name', async (req, res) => {
  const { name } = req.query;

  try {
    const users = await User.find({ name: { $regex: name, $options: 'i' } });
    if (users.length === 0) {
      return res.render('error', { message: `No users found with name: ${name}` });
    }
    res.render('userList', { users });
  } catch (err) {
    console.error('Error searching user by name:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

// Account deletion route
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

// Admin signin route
app.post('/admin_signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin || admin.password !== password) {
      return res.status(401).render('error', { message: 'Invalid username or password.' });
    }

    req.session.userId = admin._id;
    req.session.role = 'admin';
    res.redirect('/');
  } catch (err) {
    console.error('Error during admin sign-in:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

// Menu routes
app.get('/menu/:id', async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);
        if (!menu) {
            return res.status(404).render('error', { message: 'Menu not found' });
        }
        res.render('menu_details', { menu });
    } catch (err) {
        res.status(500).render('error', { message: 'Error fetching menu details' });
    }
});

// Driver routes
app.get('/drivers', async (req, res) => {
    try {
        const { sort = 'asc', searchTerm } = req.query;
        let query = {};
        
        if (searchTerm) {
            query = {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { phone_number: { $regex: searchTerm, $options: 'i' } }
                ]
            };
        }
        
        const drivers = await Driver.find(query).sort({ name: sort });
        res.render('drivers', { drivers });
    } catch (err) {
        res.status(500).render('error', { message: 'Error fetching drivers' });
    }
});

// Delivery time estimation
app.get('/estimate-delivery/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }
        
        // Simple estimation logic (can be enhanced with real distance calculation)
        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + 30);
        
        order.estimated_delivery_time = estimatedTime;
        await order.save();
        
        res.json({ estimated_time: estimatedTime });
    } catch (err) {
        res.status(500).render('error', { message: 'Error estimating delivery time' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;

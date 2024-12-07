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



const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant',
    required: true 
  },
  filter: {type: String, required: true}
});

const Product = mongoose.model('Product', productSchema);

const basketItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1 },
});

const basketItem = mongoose.model('BasketItem', basketItemSchema);

const basketSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true 
    },
    quantity: { type: Number, required: true, min: 1 }
  }],
  totalPrice: { type: Number, default: 0 }
}, {
  timestamps: true
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
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Basket'
  }
});

const User = mongoose.model('User', userSchema);

// Define Admin Schema
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});
const Admin = mongoose.model('Admin', adminSchema);


// Define Restaurant Schema
const restaurantSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  phone_number: { 
    type: String, 
    required: true, 
    match: /^[0-9]{10}$/ 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    match: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/ 
  },
  location: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

// Driver Schema
const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone_number: { type: String, required: true, match: /^[0-9]{10}$/ },
  email: { type: String, required: true, unique: true, lowercase: true, match: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/ },
  assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  available: { type: Boolean, default: true }
});


const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;


// Define Order Schema
const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  products: [
    {
      product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product',
        required: true 
      },
      quantity: { type: Number, default: 1 },
      price: { type: Number, required: true }
    }
  ],
  totalPrice: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'delivered'], 
    default: 'pending' 
  },
  assignedDriver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Driver'
  },
  deliveryLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }
});

const Order = mongoose.model('Order', orderSchema);

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true
}));

function checkLogin(req, res, next) {
  if (req.session.userId) {
    res.locals.user = req.session.userId;
  }
  next();
}

function checkAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  } else {
    return res.status(403).render('error', { message: "Access Denied. Admins only." });
  }
}

function ensureAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/user_signin');
}

function ensureRestaurantAuthenticated(req, res, next) {
  if (req.session.restaurantId) {
    return next();
  }
  res.redirect('/restaurant_signin');
}

async function fetchUserWithBasket(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).render('user_signin', { message: 'Please sign in first' });
    }

    const user = await User.findById(req.session.userId).populate({
      path: 'basket',
      populate: {
        path: 'items.product',
        model: 'Product'
      }
    });

    if (!user) {
      return res.status(404).render('error', { message: 'User not found' });
    }

    if (!user.basket) {
      const newBasket = new Basket({
        user: user._id,
        items: [],
        totalPrice: 0
      });
      await newBasket.save();
      user.basket = newBasket._id;
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Error fetching user basket:', error);
    res.status(500).render('error', { message: 'Internal server error' });
  }
}

app.use(checkLogin);
app.listen(3000, () => console.log('Server is running on port 3000'));

//Routes
app.get('/', (req, res) => res.render('index'));
app.get('/create_user', (req, res) => res.render('create_user'));
app.get('/create_driver', (req, res) => res.render('create_driver'));
app.get('/create_restaurant', (req, res) => res.render('create_restaurant'));
app.get('/create_product', ensureRestaurantAuthenticated, (req,res) => res.render('create_product'));
app.get('/user_signin', (req, res) => res.render('user_signin'));
app.get('/admin_signin', (req, res) => res.render('admin_signin', { message: '' }));
app.get('/restaurant_signin', (req, res) => res.render('restaurant_signin'));
app.get('/delete', checkLogin, (req, res) => res.render('deleteAccount'));
app.get('/error', (req, res) => res.render('error'));
app.get('/search', checkAdmin, (req, res) => res.render('search'));
app.get('/change-password', (req, res) => res.render('change-password'));
app.get('/admin_index', checkAdmin, (req, res) => res.render('admin_index'));
app.get('/delete-products', (req, res) => res.render('deleteProducts'));
app.get('/checkout', ensureAuthenticated, fetchUserWithBasket, async (req, res) => {
  try {
    const basket = await Basket.findById(req.user.basket._id)
      .populate({
        path: 'items.product',
        populate: { path: 'restaurant' }
      });

    if (basket.items.length === 0) {
      return res.redirect('/basket');
    }
    const restaurants = [...new Set(basket.items.map(item => item.product.restaurant.name))];

    res.render('checkout', { 
      basket: basket, 
      totalPrice: basket.totalPrice,
      restaurants: restaurants,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAocUGBD8RXlQLKcFPGlksFz0kOi28HONY'
    });
  } catch (err) {
    console.error('Error rendering checkout:', err);
    res.status(500).render('error', { message: 'Error preparing checkout' });
  }
});


// Create User with Basket
app.post('/create_user', upload.single('image'), async (req, res) => {
  try {
    const { usersName, userEmail, userPhone, userPassword } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const newUser = new User({
      name: usersName,
      email: userEmail,
      phone_number: userPhone,
      password: userPassword,
      image: imagePath,
    });

    await newUser.save();

    const newBasket = new Basket({
      user: newUser._id,
      items: [],
      totalPrice: 0
    });

    await newBasket.save();
    newUser.basket = newBasket._id;
    await newUser.save();

    res.status(201).send('User and Basket created successfully!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating user and basket');
  }
});


// Route to search for a user by email
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

// Route to search for a user by name
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

// Driver creation
app.post('/create_driver', async (req, res) => {
  const { name, phone_number, email } = req.body;

  try {
    const newDriver = new Driver({
      name,
      phone_number,
      email,
      available: true,
    });

    await newDriver.save();

    res.render('success', { message: `Driver ${name} created successfully!` });
  } catch (err) {
    console.error('Error creating driver:', err);
    res.status(500).render('error', { message: 'Error creating driver. Please try again.' });
  }
});



// User Sign-In Route
app.post('/user_signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('user_signin', { message: 'User not found. Please check your email or sign up.' });
    }
    if (user.password !== password) {
      return res.render('user_signin', { message: 'Incorrect password. Please try again.' });
    }
    req.session.userId = user._id;
    req.session.user = user;
    res.redirect('/menu');
  } catch (err) {
    console.error('Error signing in user:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

//Menu Item Creation
app.post('/create_product', ensureRestaurantAuthenticated, upload.single('image'), async (req, res) => {
  const { name, description, price, restaurantId, filter } = req.body;
  const image = req.file ? req.file.path : null;

  const product = new Product({
    name,
    description,
    price,
    image,
    restaurant: restaurantId,
    filter
  });

  try {
    await product.save();
    res.redirect(`/restaurant/${restaurantId}`);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).send('Error creating product.');
  }
});


app.get('/menu', ensureAuthenticated, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('restaurant', 'name');

    res.render('menu', { products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).render('error', { message: 'Error fetching products' });
  }
});

app.post('/delete-all-products',checkAdmin, async (req, res) => {
  try {
    const result = await Product.deleteMany({});
    res.redirect('/success'); 
  } catch (error) {
    console.error('Error deleting all products:', error);
    res.status(500).send('Failed to delete products');
  }
});

//Empty Basket
app.post('/empty-basket', fetchUserWithBasket, async (req, res) => {
  try {
    const basket = await Basket.findById(req.user.basket._id);
    
    basket.items = [];
    basket.totalPrice = 0;
    
    await basket.save();

    res.redirect('/basket');
  } catch (error) {
    console.error('Error emptying basket:', error);
    res.status(500).render('error', { message: 'Error emptying basket' });
  }
});

// Basket Menu
app.get('/basket', fetchUserWithBasket, async (req, res) => {
  try {
    const basket = await Basket.findById(req.user.basket._id)
      .populate('items.product');
    
    const totalPrice = basket.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    basket.totalPrice = totalPrice;
    await basket.save();

    res.render('basket', { 
      basket: basket,
      totalPrice: totalPrice 
    });
  } catch (error) {
    console.error('Error rendering basket:', error);
    res.status(500).render('error', { message: 'Error loading basket' });
  }
});


// Adding to Basket
app.post('/basket/add', fetchUserWithBasket, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).render('error', { message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).render('error', { message: 'Product not found' });
    }

    const basket = await Basket.findById(req.user.basket._id);

    const existingItemIndex = basket.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {

      basket.items[existingItemIndex].quantity += Number(quantity);
    } else {

      basket.items.push({
        product: productId,
        quantity: Number(quantity)
      });
    }

    basket.totalPrice = basket.items.reduce((total, item) => {
      const itemProduct = basket.items.find(i => i.product.toString() === item.product.toString());
      return total + (product.price * itemProduct.quantity);
    }, 0);

    await basket.save();

    res.redirect('/basket');
  } catch (error) {
    console.error('Error adding to basket:', error);
    res.status(500).render('error', { message: 'Error adding product to basket' });
  }
});

app.post('/remove-from-basket', fetchUserWithBasket, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).render('error', { message: 'Product ID is required' });
    }

    const basket = await Basket.findById(req.user.basket._id);
    
    // Remove the specific item
    basket.items = basket.items.filter(
      item => item.product.toString() !== productId
    );

    // Recalculate total price
    const updatedBasket = await Basket.findById(basket._id)
      .populate('items.product');
    
    basket.totalPrice = updatedBasket.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);

    await basket.save();

    res.redirect('/basket');
  } catch (error) {
    console.error('Error removing from basket:', error);
    res.status(500).render('error', { message: 'Error removing product from basket' });
  }
});

app.post('/checkout', ensureAuthenticated, fetchUserWithBasket, async (req, res) => {
  const { 
    cardNumber, 
    expiryDate, 
    cvv, 
    deliveryAddress, 
    latitude, 
    longitude 
  } = req.body;

  try {
    // Validate inputs
    if (!cardNumber || !expiryDate || !cvv || !deliveryAddress) {
      return res.status(400).render('error', { message: 'All payment and delivery details are required' });
    }

    // Validate credit card
    const cardValidation = validateCreditCard(cardNumber, expiryDate, cvv);
    if (!cardValidation.isValid) {
      return res.status(400).render('checkout', { 
        error: cardValidation.message,
        basket: req.user.basket
      });
    }

    // Find an available driver
    const assignedDriver = await assignDriver();
    if (!assignedDriver) {
      return res.render('error', { message: 'No available driver at the moment. Please try again later.' });
    }

    const basket = await Basket.findById(req.user.basket._id)
      .populate({
        path: 'items.product',
        populate: { path: 'restaurant' }
      });

    const order = new Order({
      user: req.user._id,
      products: basket.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      totalPrice: basket.totalPrice,
      status: 'pending',
      assignedDriver: assignedDriver._id,
      deliveryLocation: {
        address: deliveryAddress,
        latitude: latitude,
        longitude: longitude
      }
    });

    // Save the order
    await order.save();

    // Clear the basket
    basket.items = [];
    basket.totalPrice = 0;
    await basket.save();

    // Render confirmation page with order and driver details
    res.render('confirmation', { 
      order, 
      driver: assignedDriver, 
      message: 'Your order has been placed successfully!',
      deliveryAddress: deliveryAddress
    });
  } catch (err) {
    console.error('Error during checkout:', err);
    res.status(500).render('error', { message: 'Internal server error during checkout' });
  }
});

function validateCreditCard(cardNumber, expiryDate, cvv) {
  // Credit card number validation
  const sanitisedCardNumber = cardNumber.replace(/\s+/g, '');
  if (!/^\d{13,19}$/.test(sanitisedCardNumber)) {
    return { isValid: false, message: 'Invalid card number' };
  }

  // Expiry date validation
  const [month, year] = expiryDate.split('/');
  const expiry = new Date(`20${year}`, month - 1);
  const today = new Date();
  if (expiry < today) {
    return { isValid: false, message: 'Card has expired' };
  }

  // CVV validation
  if (!/^\d{3,4}$/.test(cvv)) {
    return { isValid: false, message: 'Invalid CVV' };
  }

  return { isValid: true };
}
// Assign an existing driver
async function assignDriver() {
  try {
    const availableDrivers = await Driver.find({ available: true });

    if (availableDrivers.length === 0) {
      return null;
    }

    const randomDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];

    randomDriver.available = false;
    await randomDriver.save();

    return randomDriver;
  } catch (err) {
    console.error('Error assigning driver:', err);
    return null;
  }
}
// Delete User
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

    req.session.user = { id: admin._id, role: 'admin' };

    res.redirect('/admin_index');
  } catch (err) {
    console.error('Error during admin sign-in:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});


app.get('/admin_index', checkAdmin, (req, res) => {
  res.render('admin_index');
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .populate('products.product', 'name price restaurant')
      .populate('assignedDriver', 'name');
    
    // Render the order list page with the fetched orders
    res.render('orderList', { orders, message: "All Orders:" });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});




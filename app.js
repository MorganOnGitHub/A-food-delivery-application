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
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1 },
});

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
  available: { type: Boolean, default: true }  // This field tracks if the driver is available for new orders
});


const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;

// Middleware setup
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
    return res.status(403).json({ message: "Access Denied. Admins only." });
  }
}

function ensureAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/user_signin');
}

app.get('/basket', (req, res) => {
  let basketItems = req.session.basket ? req.session.basket : { items: [], totalPrice: 0 };
  res.render('basket', { basket: basketItems });
});

function ensureRestaurantAuthenticated(req, res, next) {
  if (req.session.restaurantId) {
    return next();
  }
  res.redirect('/restaurant_signin');
}

app.use(checkLogin);

// Start server
app.listen(3000, () => console.log('Server is running on port 3000'));

// Routes
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
app.get('/checkout', ensureAuthenticated, (req,res) => res.render('checkout'));

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
  }
});

const Order = mongoose.model('Order', orderSchema);

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


// Routes for Restaurant Admin to manage products
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

app.get('/basket', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).populate('basket');
    const basket = user ? user.basket : null;

    if (!basket) {
      return res.render('basket', { basket: { items: [], totalPrice: 0 } });
    }

    res.render('basket', { basket: { items: basket.items, totalPrice: basket.totalPrice } });
  } catch (err) {
    console.error('Error fetching basket:', err);
    res.status(500).render('error', { message: 'Internal server error' });
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
app.post('/empty-basket', async (req, res) => {
  const userId = req.session.userId;  // Get user ID from session
  try {
      const result = await Basket.deleteOne({ user: userId });  // Clear basket for the user

      if (result.deletedCount > 0) {
          console.log('Basket emptied successfully');
      } else {
          console.log('No basket found for the user');
      }

      // Redirect back to the basket page
      res.redirect('/basket');
  } catch (error) {
      console.error('Error emptying basket:', error);
      res.status(500).send('Error emptying basket');
  }
});
app.post('/add-to-basket', ensureAuthenticated, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    const user = await User.findById(req.session.userId).populate('basket');
    if (!user) {
      return res.status(404).send('User not found');
    }

    let basket = user.basket;
    if (!basket) {
      basket = new Basket({
        user: user._id,
        items: [{ product: productId, quantity }],
        totalPrice: product.price * quantity
      });
      await basket.save();
      user.basket = basket._id;
      await user.save();
    } else {
      if (!Array.isArray(basket.items)) {
        basket.items = []; 
      }
      const itemIndex = basket.items.findIndex(item => item.product.toString() === productId);
      if (itemIndex >= 0) {
        basket.items[itemIndex].quantity += quantity;
      } else {
        basket.items.push({ product: productId, quantity });
      }
      basket.totalPrice = basket.items.reduce((total, item) => {
        return total + (item.quantity * product.price);
      }, 0);
      await basket.save();
    }

    res.redirect('/basket');
  } catch (err) {
    console.error('Error adding item to basket:', err);
    res.status(500).send('Error adding item to basket');
  }
});



app.post('/remove-from-basket', ensureAuthenticated, async (req, res) => {
  const { productId } = req.body;

  try {
    const user = await User.findById(req.session.userId).populate('basket');

    if (!user || !user.basket) {
      return res.status(404).send('Basket not found');
    }

    const basket = await Basket.findById(user.basket._id);
    basket.items = basket.items.filter(item => item.product.toString() !== productId);

    // Recalculate total price after removing item
    basket.totalPrice = basket.items.reduce((total, item) => {
      const productPrice = item.product.price;
      return total + productPrice * item.quantity;
    }, 0);

    await basket.save();

    // Update session basket after removal
    req.session.basket = basket; // Sync with session

    res.redirect('/basket');
  } catch (err) {
    console.error('Error removing item from basket:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});


 


app.post('/remove-from-basket', ensureAuthenticated, async (req, res) => {
  const { productId } = req.body;

  try {
    const user = await User.findById(req.session.userId).populate('basket');

    if (!user || !user.basket) {
      return res.status(404).send('Basket not found');
    }

    const basket = await Basket.findById(user.basket._id);
    basket.items = basket.items.filter(item => item.product.toString() !== productId);

    basket.totalPrice = basket.items.reduce((total, item) => {
      const productPrice = item.product.price;
      return total + productPrice * item.quantity;
    }, 0);

    await basket.save();

    req.session.basket = basket;

    res.redirect('/basket');
  } catch (err) {
    console.error('Error removing item from basket:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});
app.post('/checkout', ensureAuthenticated, async (req, res) => {
  const { cardNumber, expiryDate, cvv } = req.body;  // Payment processing (to be implemented)

  try {
    const user = await User.findById(req.session.userId); 

    const assignedDriver = await assignDriver();

    if (!assignedDriver) {
      return res.render('error', { message: 'No available driver at the moment. Please try again later.' });
    }

    const order = new Order({
      user: user._id,
      products: user.basket.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: user.basket.totalPrice,
      status: 'Pending',
      assignedDriver: assignedDriver._id,
    });

    user.basket.items = [];
    user.basket.totalPrice = 0;
    await user.save();


    // Render the confirmation page with the order and assigned driver
    res.render('confirmation', { order, driver: assignedDriver, message: 'Your order has been placed successfully!' });
  } catch (err) {
    console.error('Error during checkout:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});

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
    req.session.userId = admin._id;
    req.session.role = 'admin';

    res.redirect('/admin_index');
  } catch (err) {
    console.error('Error during admin sign-in:', err);
    res.status(500).render('error', { message: 'Internal server error' });
  }
});
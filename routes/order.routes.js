const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Order = require('../models/Order');

// Search for orders by product ID
router.get('/search', async (req, res) => {
  const { productId } = req.query;

  try {
    // Validate product ID format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.render('order-search', {
        orders: [],
        message: 'Invalid product ID format',
      });
    }

    // Find orders associated with the product
    const orders = await Order.find({ productId }).populate('productId', 'name price');
    if (orders.length === 0) {
      return res.render('order-search', {
        orders: [],
        message: 'No orders found for the given product ID',
      });
    }

    res.render('order-search', { orders, message: null });
  } catch (error) {
    console.error('Error searching orders:', error);
    res.render('order-search', {
      orders: [],
      message: 'An error occurred while searching orders',
    });
  }
});

module.exports = router;


const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    maxlength: 500
  }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);

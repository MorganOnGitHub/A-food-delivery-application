const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
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

module.exports = mongoose.model('Restaurant', restaurantSchema);

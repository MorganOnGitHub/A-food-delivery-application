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
  },
  cuisine: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    default: []  // Array of image URLs
  },
  openingTimes: {
    type: Map,
    of: String,  // Days of the week with times in "HH:MM - HH:MM" format
    validate: {
      validator: function (times) {
        const timeFormat = /^([01]\d|2[0-3]):[0-5]\d - ([01]\d|2[0-3]):[0-5]\d$/;
        return Array.from(times.values()).every(time => timeFormat.test(time));
      },
      message: 'Invalid time format. Use "HH:MM - HH:MM" format for opening and closing times.'
    }
  }
});

module.exports = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);

const mongoose = require('mongoose');
const Admin = require('./models/admin');

const url = 'mongodb://127.0.0.1/accounts';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB.');

    const username = 'admin';
    const password = 'Password123'; 


    const admin = new Admin({
      username: username,
      password: password
    });

    await admin.save();
    console.log('Admin account created successfully.');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error creating admin account:', err);
  });

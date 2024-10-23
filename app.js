const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

app.set('view engine', 'ejs');

const url = 'mongodb://127.0.0.1/accounts';
mongoose.connect(url)
  .then(() => {
    console.log('Connected to Foodfaster.ai Database.');
  })
  .catch(err => {
    console.error('Error connecting to Foodfaster.ai Database: ' + err);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone_number: Number,
  date_of_birth: Date
});

const Account = mongoose.model('account', userSchema);

app.use(express.urlencoded({ extended: true })); // Allows use of req.body

app.post('/create_user', (req, res) => {
  const name = req.body.userName;
  const email = req.body.userEmail;
  const phoneNumber = req.body.userPhone;
  const date = req.body.userAccountDate;

  
  const newAccount = new Account({
    name,
    email,
    phone_number: phoneNumber,
    date_of_birth: date,
  });

app.post('/create_restaurant', (req,res) =>{
  const name = req.body.
})

  
  newAccount.save()
    .then(() => {
      res.send(`Received data and saved to the database: Name - ${name}, Email - ${email}, Phone - ${phoneNumber}, Date - ${date}`);
    })
    .catch(err => {
      console.error('Error saving Account data: ' + err);
      res.send('Error saving Account data.');
    });
});

app.set('view engine', 'ejs'); // allows use of res.render
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/create_user', (req, res) => {
  res.render('create_user');
});

app.get('/create_restaurant', (req, res) => {
  res.render('create_restaurant');
});

app.get('/viewAccounts', async (req, res) => {
  const Accounts = await Account.find({});
  res.render('viewAccounts', { Accounts });
});

app.get('/edit/:AccountId', async (req, res) => {
  const AccountId = req.params.AccountId;

  try {
      const Account = await Account.findById(AccountId);
      res.render('edit', { Account });
  } catch (err) {
      console.error('Error retrieving Account for edit: ' + err);
      res.send('Error retrieving Account for edit.');
  }
});

app.post('/edit/:AccountId', async (req, res) => {
  const AccountId = req.params.AccountId;

  try {
      await Account.findByIdAndUpdate(AccountId, req.body);
      res.redirect('/viewAccounts');
  } catch (err) {
      console.error('Error updating Account: ' + err);
      res.send('Error updating Account.');
  }
});

app.post('/delete/:AccountId', async (req, res) => {
  const AccountId = req.params.AccountId;

  try {
      await Account.findByIdAndDelete(AccountId);
      res.redirect('/viewAccounts');
  } catch (err) {
      console.error('Error deleting Account: ' + err);
      res.send('Error deleting Account.');
  }
});

app.post('/viewAccounts', async (req, res) => {
  const Accounts = await Account.find({name: req.body.user_name,  date_of_birth: {$gte: req.body.start_date, $lte: req.body.end_date}});
  res.render('viewAccounts', { Accounts });
});

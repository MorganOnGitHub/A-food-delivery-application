const Admin = require('./models/admin');

async function verifyAdmin(username, password) {
  try {
    const admin = await Admin.findOne({ username: username });
    if (!admin) {
      return { success: false, message: 'Admin not found' };
    }

    if (admin.password !== password) {
      return { success: false, message: 'Invalid credentials' };
    }

    return { success: true, message: 'Admin verified' };
  } catch (err) {
    console.error('Error verifying admin:', err);
    return { success: false, message: 'Internal server error' };
  }
}

module.exports = { verifyAdmin };

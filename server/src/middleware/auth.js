const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Token comes in as: "Bearer eyJhbGci..."
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; // grab just the token part

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { userId: '...', iat: ..., exp: ... }

    const user = await User.findById(decoded.userId).select('-password');
    // .select('-password') means "give me everything EXCEPT the password"

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user; // attach user to request so routes can use it
    next();           // move on to the actual route handler

  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
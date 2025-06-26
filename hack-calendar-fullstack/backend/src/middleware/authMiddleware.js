const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      User.findById(decoded.id, (err, user) => {
        if (err || !user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        
        // Exclude password from the user object attached to the request
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        next();
      });
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
const jwt = require('jsonwebtoken');
const winston = require('../config/winston');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        winston.error(error);
        return res.status(401).json({ msg: 'Token is not valid' });
      } else {
        req.user = decoded;
        next();
      }
    });
  } catch (err) {
    winston.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

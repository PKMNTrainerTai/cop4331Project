const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const authenticateMiddleware = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication token is missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateMiddleware };
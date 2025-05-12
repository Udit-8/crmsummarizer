const bcrypt = require('bcryptjs');

// Generate a salt and hash a password
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}

// Verify a password against stored hash
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
//create a authenticateToken function jwt
async function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  });
}

module.exports = {
  hashPassword,
  verifyPassword,
  authenticateToken
};
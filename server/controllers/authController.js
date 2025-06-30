const jwt = require('jsonwebtoken');
const { localDb } = require('../config/db');

exports.authenticate = (req, res) => {
  const { accessCode } = req.body;
  console.log('🔐 Authentication attempt with code:', accessCode);
  localDb.query(
    'SELECT * FROM access_codes WHERE code = ? AND active = 1',
    [accessCode],
    (err, results) => {
      if (err) {
        console.error('❌ Database error during authentication:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      console.log('📊 Authentication results:', results.length, 'records found');
      if (results.length > 0) {
        const token = jwt.sign({ accessCode }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        console.log('✅ Authentication successful, token generated');
        res.json({ success: true, token });
      } else {
        console.log('❌ Authentication failed: Invalid access code');
        res.json({ success: false, message: 'Invalid access code' });
      }
    }
  );
};

exports.verifyToken = (req, res) => {
  console.log('✅ Token verified successfully');
  res.json({ valid: true });
};
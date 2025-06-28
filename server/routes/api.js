const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');
const { localDb, glpiDb } = require('../config/db');

// Middleware de autenticación
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret_key_here';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// Rutas
router.post('/generate-pdf', authenticateToken, pdfController.generatePdf);

router.post('/authenticate', (req, res) => {
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
        const token = jwt.sign({ accessCode }, JWT_SECRET, { expiresIn: '24h' });
        console.log('✅ Authentication successful, token generated');
        res.json({ success: true, token });
      } else {
        console.log('❌ Authentication failed: Invalid access code');
        res.json({ success: false, message: 'Invalid access code' });
      }
    }
  );
});

router.post('/verify-token', authenticateToken, (req, res) => {
  console.log('✅ Token verified successfully');
  res.json({ valid: true });
});

router.post('/technicians/signature', authenticateToken, (req, res) => {
  const { technicianId, signature } = req.body;
  console.log('✍️ Saving signature for technician ID:', technicianId);
  localDb.query(
    'UPDATE technicians SET signature_base64 = ? WHERE id = ?',
    [signature, technicianId],
    (err) => {
      if (err) {
        console.error('❌ Error saving signature:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('✅ Signature saved successfully');
      res.json({ success: true });
    }
  );
});

router.get('/technicians', authenticateToken, (req, res) => {
  console.log('👥 Fetching technicians...');
  localDb.query(
    'SELECT id, name, email, signature_base64 FROM technicians WHERE active = 1',
    (err, results) => {
      if (err) {
        console.error('❌ Error fetching technicians:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('✅ Technicians fetched successfully:', results.length, 'technicians found');
      res.json(results);
    }
  );
});

router.get('/glpi/users', authenticateToken, (req, res) => {
  const search = `%${req.query.q || ''}%`;
  console.log('🔍 Searching GLPI users with query:', req.query.q || '(empty)');
  glpiDb.query(
    `SELECT u.id, CONCAT(u.firstname, ' ', u.realname) as full_name, e.email, u.registration_number
     FROM glpi_users u
     LEFT JOIN glpi_useremails e ON u.id = e.users_id AND e.is_default = 1
     WHERE u.is_active = 1 AND u.is_deleted = 0
       AND (u.firstname LIKE ? OR u.realname LIKE ? OR u.name LIKE ?)
     ORDER BY u.realname
     LIMIT 10`,
    [search, search, search],
    (err, results) => {
      if (err) {
        console.error('❌ Error fetching GLPI users:', err);
        return res.status(500).json({ error: 'GLPI Database error' });
      }
      console.log('✅ GLPI users fetched successfully:', results.length, 'users found');
      const formattedUsers = results.map(user => ({
        id: user.id,
        name: user.full_name,
        email: user.email || 'Sin email',
        code: user.registration_number
      }));
      res.json(formattedUsers);
    }
  );
});

router.get('/glpi/user-assets/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  console.log('💻 Fetching assets for user ID:', userId);
  const query = `
    SELECT 
      c.id, c.name, c.otherserial, ct.name as type, s.name as state, c.states_id, u.registration_number
    FROM glpi_computers c
    LEFT JOIN glpi_computertypes ct ON c.computertypes_id = ct.id
    LEFT JOIN glpi_states s ON c.states_id = s.id
    LEFT JOIN glpi_users u ON c.users_id = u.id
    WHERE c.users_id = ? AND c.is_deleted = 0
    UNION ALL
    SELECT 
      p.id, p.name, p.otherserial, pt.name as type, s.name as state, p.states_id, u.registration_number
    FROM glpi_phones p
    LEFT JOIN glpi_phonetypes pt ON p.phonetypes_id = pt.id
    LEFT JOIN glpi_states s ON p.states_id = s.id
    LEFT JOIN glpi_users u ON p.users_id = u.id
    WHERE p.users_id = ? AND p.is_deleted = 0
    UNION ALL
    SELECT 
      m.id, m.name, m.otherserial, mt.name as type, s.name as state, m.states_id, u.registration_number
    FROM glpi_monitors m
    LEFT JOIN glpi_monitortypes mt ON m.monitortypes_id = mt.id
    LEFT JOIN glpi_states s ON m.states_id = s.id
    LEFT JOIN glpi_users u ON m.users_id = u.id
    WHERE m.users_id = ? AND m.is_deleted = 0
    ORDER BY type, name
  `;
  glpiDb.query(query, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching user assets:', err);
      return res.status(500).json({ error: 'GLPI Database error' });
    }
    console.log('✅ User assets fetched successfully:', results.length, 'assets found');
    res.json(results);
  });
});

module.exports = router;
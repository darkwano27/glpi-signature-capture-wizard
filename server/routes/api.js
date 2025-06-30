const express = require('express');
const router = express.Router();

// Controllers
const pdfService = require('../services/pdfService');
const authController = require('../controllers/authController');
const technicianController = require('../controllers/technicianController');
const glpiController = require('../controllers/glpiController');

// Middlewares
const authenticateToken = require('../middlewares/auth');

// Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called');
  res.json({
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// Auth routes
router.post('/authenticate', authController.authenticate);
router.post('/verify-token', authenticateToken, authController.verifyToken);

// PDF routes
router.post('/generate-pdf', authenticateToken, pdfService.generatePdf);

// Technician routes
router.get('/technicians', authenticateToken, technicianController.getTechnicians);
router.post('/technicians/signature', authenticateToken, technicianController.saveSignature);

// GLPI routes
router.get('/glpi/users', authenticateToken, glpiController.getGlpiUsers);
router.get('/glpi/user-assets/:userId', authenticateToken, glpiController.getUserAssets);

module.exports = router;
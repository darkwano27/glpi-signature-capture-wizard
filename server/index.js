
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Database configurations
const localDbConfig = {
  host: 'localhost',
  user: 'your_local_user',
  password: 'your_local_password',
  database: 'signature_wizard'
};

const glpiDbConfig = {
  host: 'localhost', // Cambia por la IP de tu servidor GLPI
  user: 'your_glpi_user',
  password: 'your_glpi_password',
  database: 'glpi'
};

// Create database connections
const localDb = mysql.createConnection(localDbConfig);
const glpiDb = mysql.createConnection(glpiDbConfig);

// Email configuration
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com', // Cambiar según tu proveedor de email
  port: 587,
  secure: false,
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_app_password'
  }
});

// JWT Secret
const JWT_SECRET = 'your_jwt_secret_key_here';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes

// Authentication
app.post('/api/authenticate', async (req, res) => {
  const { accessCode } = req.body;

  try {
    localDb.query(
      'SELECT * FROM access_codes WHERE code = ? AND active = 1',
      [accessCode],
      (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length > 0) {
          const token = jwt.sign({ accessCode }, JWT_SECRET, { expiresIn: '24h' });
          res.json({ success: true, token });
        } else {
          res.json({ success: false, message: 'Invalid access code' });
        }
      }
    );
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify token
app.post('/api/verify-token', authenticateToken, (req, res) => {
  res.json({ valid: true });
});

// Get technicians
app.get('/api/technicians', authenticateToken, (req, res) => {
  localDb.query(
    'SELECT id, name, email, signature FROM technicians WHERE active = 1',
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(results);
    }
  );
});

// Save technician signature
app.post('/api/technicians/signature', authenticateToken, (req, res) => {
  const { technicianId, signature } = req.body;

  localDb.query(
    'UPDATE technicians SET signature = ? WHERE id = ?',
    [signature, technicianId],
    (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
});

// Get GLPI users
app.get('/api/glpi/users', authenticateToken, (req, res) => {
  glpiDb.query(
    `SELECT u.id, u.name, u.realname, u.firstname, 
            CONCAT(u.firstname, ' ', u.realname) as full_name,
            e.email
     FROM glpi_users u
     LEFT JOIN glpi_useremails e ON u.id = e.users_id AND e.is_default = 1
     WHERE u.is_active = 1 AND u.is_deleted = 0
     ORDER BY u.realname, u.firstname`,
    (err, results) => {
      if (err) {
        console.error('GLPI Database error:', err);
        return res.status(500).json({ error: 'GLPI Database error' });
      }
      
      // Format results
      const formattedUsers = results.map(user => ({
        id: user.id,
        name: user.full_name || user.name,
        email: user.email || 'Sin email'
      }));
      
      res.json(formattedUsers);
    }
  );
});

// Get user assets from GLPI
app.get('/api/glpi/user-assets/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      c.id,
      c.name,
      c.otherserial,
      ct.name as type,
      s.name as state,
      c.states_id
    FROM glpi_computers c
    LEFT JOIN glpi_computertypes ct ON c.computertypes_id = ct.id
    LEFT JOIN glpi_states s ON c.states_id = s.id
    WHERE c.users_id = ? AND c.is_deleted = 0
    
    UNION ALL
    
    SELECT 
      p.id,
      p.name,
      p.otherserial,
      pt.name as type,
      s.name as state,
      p.states_id
    FROM glpi_phones p
    LEFT JOIN glpi_phonetypes pt ON p.phonetypes_id = pt.id
    LEFT JOIN glpi_states s ON p.states_id = s.id
    WHERE p.users_id = ? AND p.is_deleted = 0
    
    UNION ALL
    
    SELECT 
      m.id,
      m.name,
      m.otherserial,
      mt.name as type,
      s.name as state,
      m.states_id
    FROM glpi_monitors m
    LEFT JOIN glpi_monitortypes mt ON m.monitortypes_id = mt.id
    LEFT JOIN glpi_states s ON m.states_id = s.id
    WHERE m.users_id = ? AND m.is_deleted = 0
    
    ORDER BY type, name
  `;

  glpiDb.query(query, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error('GLPI Database error:', err);
      return res.status(500).json({ error: 'GLPI Database error' });
    }
    res.json(results);
  });
});

// Generate PDF and send email
app.post('/api/generate-pdf', authenticateToken, async (req, res) => {
  const { technician, user, assets, technicianSignature, userSignature } = req.body;

  try {
    // Here you would generate the PDF using a library like puppeteer or jsPDF
    // For now, we'll create a simple HTML structure and return it
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Entrega de Activos - ${user.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .signature-box { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
            .signature-image { max-width: 300px; max-height: 100px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>ENTREGA DE ACTIVOS INFORMÁTICOS</h1>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
        
        <div class="section">
            <h3>Técnico Responsable:</h3>
            <p><strong>Nombre:</strong> ${technician.name}</p>
            <p><strong>Email:</strong> ${technician.email}</p>
        </div>
        
        <div class="section">
            <h3>Usuario Receptor:</h3>
            <p><strong>Nombre:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
        </div>
        
        <div class="section">
            <h3>Activos Entregados:</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Número de Serie</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${assets.map(asset => `
                        <tr>
                            <td>${asset.id}</td>
                            <td>${asset.name}</td>
                            <td>${asset.otherserial || 'N/A'}</td>
                            <td>${asset.type}</td>
                            <td>${asset.state}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h3>Firmas:</h3>
            <div style="display: flex; justify-content: space-between;">
                <div class="signature-box">
                    <h4>Firma del Técnico:</h4>
                    <img src="${technicianSignature}" class="signature-image" alt="Firma del Técnico" />
                    <p>${technician.name}</p>
                </div>
                <div class="signature-box">
                    <h4>Firma del Usuario:</h4>
                    <img src="${userSignature}" class="signature-image" alt="Firma del Usuario" />
                    <p>${user.name}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    // Save delivery record to database
    localDb.query(
      `INSERT INTO deliveries (technician_id, user_name, user_email, assets_data, 
       technician_signature, user_signature, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        technician.id,
        user.name,
        user.email,
        JSON.stringify(assets),
        technicianSignature,
        userSignature
      ],
      (err, result) => {
        if (err) {
          console.error('Error saving delivery:', err);
        }
      }
    );

    // Send email
    if (user.email && user.email !== 'Sin email') {
      const mailOptions = {
        from: 'your_email@gmail.com',
        to: user.email,
        subject: 'Entrega de Activos Informáticos',
        html: htmlContent
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Email error:', emailError);
      }
    }

    // Return HTML content for PDF generation on frontend
    res.json({ 
      success: true, 
      htmlContent: htmlContent,
      message: 'PDF generado y email enviado correctamente'
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Database connection error handling
localDb.on('error', (err) => {
  console.error('Local database error:', err);
});

glpiDb.on('error', (err) => {
  console.error('GLPI database error:', err);
});

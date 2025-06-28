const mysql = require('mysql2');

// Database configurations
const localDbConfig = {
  host: '172.18.20.107', // Cambia por la IP de tu servidor local
  user: 'firma_user',
  password: 'clave_segura123',
  port: 3306,
  // socketPath: '/var/run/mysqld/mysqld.sock', // Descomentar si usas socket
  database: 'signature_wizard'
};

const glpiDbConfig = {
  host: 'solucionesti.aris.com.pe', // Cambia por la URL de tu servidor GLPI
  user: 'glpi',
  password: 'GLPI_PASS',  
  database: 'glpidb',
  port: 3306 // Cambia si es necesario  
};

// Create database connections
const localDb = mysql.createConnection(localDbConfig);
const glpiDb = mysql.createConnection(glpiDbConfig);

// Test connections
localDb.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to local database:', err.message);
  } else {
    console.log('✅ Connected to local database successfully');
  }
});

glpiDb.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to GLPI database:', err.message);
  } else {
    console.log('✅ Connected to GLPI database successfully');
  }
});

// Handle connection errors
localDb.on('error', (err) => {
  console.error('Local database connection error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Local database connection was closed.');
  }
});

glpiDb.on('error', (err) => {
  console.error('GLPI database connection error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('GLPI database connection was closed.');
  }
});

module.exports = { localDb, glpiDb };
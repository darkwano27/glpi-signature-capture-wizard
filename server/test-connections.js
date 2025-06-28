const { localDb, glpiDb } = require('./config/db');

console.log('🧪 Testing database connections...');

// Test local database
localDb.query('SELECT 1 as test', (err, results) => {
  if (err) {
    console.error('❌ Local database test failed:', err.message);
  } else {
    console.log('✅ Local database connection successful');
    
    // Test technicians table
    localDb.query('SELECT COUNT(*) as count FROM technicians WHERE active = 1', (err, results) => {
      if (err) {
        console.error('❌ Technicians query failed:', err.message);
      } else {
        console.log(`📊 Found ${results[0].count} active technicians`);
      }
    });
    
    // Test access codes
    localDb.query('SELECT COUNT(*) as count FROM access_codes WHERE active = 1', (err, results) => {
      if (err) {
        console.error('❌ Access codes query failed:', err.message);
      } else {
        console.log(`🔑 Found ${results[0].count} active access codes`);
      }
    });
  }
});

// Test GLPI database
glpiDb.query('SELECT 1 as test', (err, results) => {
  if (err) {
    console.error('❌ GLPI database test failed:', err.message);
  } else {
    console.log('✅ GLPI database connection successful');
    
    // Test GLPI users
    glpiDb.query('SELECT COUNT(*) as count FROM glpi_users WHERE is_active = 1 AND is_deleted = 0', (err, results) => {
      if (err) {
        console.error('❌ GLPI users query failed:', err.message);
      } else {
        console.log(`👥 Found ${results[0].count} active GLPI users`);
      }
    });
  }
});

// Close connections after 5 seconds
setTimeout(() => {
  console.log('🔌 Closing database connections...');
  localDb.end();
  glpiDb.end();
  process.exit(0);
}, 5000); 
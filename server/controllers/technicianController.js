const { localDb } = require('../config/db');

exports.saveSignature = (req, res) => {
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
};

exports.getTechnicians = (req, res) => {
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
};
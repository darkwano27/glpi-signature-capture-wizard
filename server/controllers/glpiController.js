const { glpiDb } = require('../config/db');

exports.getGlpiUsers = (req, res) => {
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
};

exports.getUserAssets = (req, res) => {
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
  /*const query = `
  CREATE OR REPLACE VIEW v_user_assets AS
SELECT 
    c.id, c.name, c.otherserial, ct.name as type, s.name as state, c.states_id, u.id as users_id, u.registration_number
FROM glpi_computers c
LEFT JOIN glpi_computertypes ct ON c.computertypes_id = ct.id
LEFT JOIN glpi_states s ON c.states_id = s.id
LEFT JOIN glpi_users u ON c.users_id = u.id
WHERE c.is_deleted = 0
UNION ALL
SELECT 
    p.id, p.name, p.otherserial, pt.name as type, s.name as state, p.states_id, u.id as users_id, u.registration_number
FROM glpi_phones p
LEFT JOIN glpi_phonetypes pt ON p.phonetypes_id = pt.id
LEFT JOIN glpi_states s ON p.states_id = s.id
LEFT JOIN glpi_users u ON p.users_id = u.id
WHERE p.is_deleted = 0
UNION ALL
SELECT 
    m.id, m.name, m.otherserial, mt.name as type, s.name as state, m.states_id, u.id as users_id, u.registration_number
FROM glpi_monitors m
LEFT JOIN glpi_monitortypes mt ON m.monitortypes_id = mt.id
LEFT JOIN glpi_states s ON m.states_id = s.id
LEFT JOIN glpi_users u ON m.users_id = u.id
WHERE m.is_deleted = 0;
   `;*/
  glpiDb.query(query, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching user assets:', err);
      return res.status(500).json({ error: 'GLPI Database error' });
    }
    console.log('✅ User assets fetched successfully:', results.length, 'assets found');
    res.json(results);
  });
};
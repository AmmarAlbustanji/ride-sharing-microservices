const pool = require('../db');

exports.getProfile = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, phone, role FROM users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: 'Server error fetching profile.' });
  }
};

exports.updateRole = async (req, res) => {
  const { phone, role } = req.body;
  if (!phone || !role) return res.status(400).json({ error: 'Phone and role are required.' });

  try {
    const result = await pool.query("UPDATE users SET role = $1 WHERE phone = $2 RETURNING *", [role, phone]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found.' });

    res.json({ message: 'User role updated.', user: result.rows[0] });
  } catch (err) {
    console.error("Role update error:", err);
    res.status(500).json({ error: 'Server error updating role.' });
  }
};

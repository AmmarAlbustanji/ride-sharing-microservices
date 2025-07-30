const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { getProfile, updateRole } = require('../controllers/userController');

router.get('/me', authenticateToken, getProfile);
router.put('/role', authenticateToken, authorizeRole('admin'), updateRole);

// ✅ GET phone by user ID
router.get('/phone/:userId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query("SELECT phone FROM users WHERE id = $1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    res.json({ phone: result.rows[0].phone });
  } catch (err) {
    console.error("Error getting phone:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ GET user ID by phone number
router.get('/id-by-phone/:phone', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { phone } = req.params;

  try {
    const result = await pool.query("SELECT id FROM users WHERE phone = $1", [phone]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Error getting ID by phone:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

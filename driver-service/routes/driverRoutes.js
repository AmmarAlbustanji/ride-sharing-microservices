const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { getDriverStatus, updateDriverStatus } = require('../controllers/driverController');

// GET driver status
router.get('/status', authenticateToken, authorizeRole('driver'), getDriverStatus);

// PUT driver status
router.put('/status', authenticateToken, authorizeRole('driver'), updateDriverStatus);

// Admin updates driver status
router.put('/status/:driverId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { driverId } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Missing status field.' });

  try {
    await pool.query(
      "UPDATE drivers SET status = $1 WHERE user_id = $2",
      [status, driverId]
    );
    res.json({ message: `Driver ${driverId} status updated to ${status}` });
  } catch (err) {
    console.error("Update driver status error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available driver
router.get('/available', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { type } = req.query;

  try {
    const result = await pool.query(
      "SELECT user_id FROM drivers WHERE service_type = $1 AND status = 'available' LIMIT 1",
      [type]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No available driver found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch available driver error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/', async (req, res) => {
  const { user_id, phone, name, service_type, status } = req.body;

  if (!user_id || !phone || !name || !service_type || !status) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await pool.query(
      "INSERT INTO drivers (user_id, phone, name, service_type, status) VALUES ($1, $2, $3, $4, $5)",
      [user_id, phone, name, service_type, status]
    );
    res.status(201).json({ message: 'Driver registered in driverdb' });
  } catch (err) {
    console.error("Driver insert error:", err);
    res.status(500).json({ error: 'Driver creation failed' });
  }
});

module.exports = router;

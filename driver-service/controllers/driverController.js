const pool = require('../db');

exports.getDriverStatus = async (req, res) => {
  try {
    const driver = await pool.query('SELECT * FROM drivers WHERE user_id = $1', [req.user.id]);
    if (driver.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found.' });
    }
    res.json(driver.rows[0]);
  } catch (err) {
    console.error("Get Driver Error:", err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.updateDriverStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE drivers SET status = $1 WHERE user_id = $2', [status, req.user.id]);
    res.json({ message: 'Driver status updated.' });
  } catch (err) {
    console.error("Update Driver Error:", err);
    res.status(500).json({ error: 'Server error.' });
  }
};

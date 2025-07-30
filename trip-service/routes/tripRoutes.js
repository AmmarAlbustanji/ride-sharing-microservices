const express = require('express');
const router = express.Router();
const { createTrip, assignTrip, completeTrip } = require('../controllers/tripController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRole('user', 'admin'), createTrip);
router.put('/:tripId/complete', authenticateToken, authorizeRole('admin'), completeTrip);
router.put('/:tripId/assign', authenticateToken, authorizeRole('admin'), assignTrip);

module.exports = router;

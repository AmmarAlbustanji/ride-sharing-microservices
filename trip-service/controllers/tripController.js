const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const fetch = require('node-fetch');
require('dotenv').config();

// Verify fetch is available
if (!fetch) {
  console.error('❌ node-fetch is not available. Please install it with: npm install node-fetch@2');
  process.exit(1);
}

async function callService(url, token) {
  console.log(`🔍 Calling service: ${url}`);
  console.log(`🎫 Using token: ${token ? 'Token present' : 'No token'}`);
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  console.log(`📡 Service response status: ${res.status}`);

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Service call failed: ${res.status} ${errText}`);
    throw new Error(`Service call failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  console.log(`✅ Service response data:`, data);
  return data;
}

// Extract token from authorization header
function extractToken(authHeader) {
  console.log(`🔐 Processing auth header: ${authHeader ? 'Present' : 'Missing'}`);
  
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader; // If it's already just the token
}

exports.createTrip = async (req, res) => {
  const { location, service_type } = req.body;
  const userId = req.user.id;

  if (!location || !service_type) {
    return res.status(400).json({ error: 'Location and service type are required.' });
  }

  const tripId = uuidv4();
  try {
    const result = await pool.query(
      'INSERT INTO trips (id, user_id, location, service_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [tripId, userId, location, service_type]
    );
    res.status(201).json({ message: 'Trip created', trip: result.rows[0] });
  } catch (err) {
    console.error("Create Trip Error:", err);
    res.status(500).json({ error: 'Server error creating trip.' });
  }
};

exports.assignTrip = async (req, res) => {
  const { tripId } = req.params;
  console.log(`🚀 Starting trip assignment for tripId: ${tripId}`);
  
  const client = await pool.connect();

  try {
    console.log(`🔗 Database connection established`);
    await client.query('BEGIN');
    console.log(`📝 Transaction started`);
    
    // Extract token from authorization header
    const token = extractToken(req.headers.authorization);
    console.log(`🎫 Token extracted successfully`);

    // Check if trip exists
    console.log(`🔍 Checking if trip exists with status 'created'`);
    const tripResult = await client.query("SELECT service_type FROM trips WHERE id = $1 AND status = 'created'", [tripId]);
    
    if (tripResult.rows.length === 0) {
      console.log(`❌ Trip not found or not in 'created' status`);
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found or already assigned.' });
    }

    const requiredService = tripResult.rows[0].service_type;
    console.log(`✅ Trip found. Required service type: ${requiredService}`);

    // Check environment variables
    console.log(`🌍 DRIVER_SERVICE_URL: ${process.env.DRIVER_SERVICE_URL}`);
    console.log(`🌍 USER_SERVICE_URL: ${process.env.USER_SERVICE_URL}`);

    // Get available driver from driver-service
    console.log(`🚗 Looking for available driver with service type: ${requiredService}`);
    try {
      const driverData = await callService(
        // ✅ Full path includes /api/drivers
        `${process.env.DRIVER_SERVICE_URL}/api/drivers/available?type=${requiredService}`,
        token
      );
      const driverId = driverData.user_id;
      console.log(`👨‍✈️ Found driver with ID: ${driverId}`);

      // Get driver phone number from user-service
      console.log(`📱 Getting phone number for driver: ${driverId}`);
      const userData = await callService(
        `${process.env.USER_SERVICE_URL}/phone/${driverId}`,
        token
      );
      const driverPhone = userData.phone;
      console.log(`📞 Driver phone: ${driverPhone}`);

      // Mark driver as busy in driver-service
      console.log(`🔄 Updating driver status to 'on_trip'`);
      const statusResponse = await fetch(`${process.env.DRIVER_SERVICE_URL}/api/drivers/status/${driverId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'on_trip' })
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error(`❌ Failed to update driver status: ${statusResponse.status} ${errorText}`);
        throw new Error(`Failed to update driver status: ${statusResponse.status} ${errorText}`);
      }
      console.log(`✅ Driver status updated successfully`);

      // Assign trip locally
      console.log(`💾 Updating trip in database`);
      const updated = await client.query(
        "UPDATE trips SET driver_phone = $1, status = 'assigned' WHERE id = $2 RETURNING *",
        [driverPhone, tripId]
      );

      await client.query('COMMIT');
      console.log(`✅ Trip assigned successfully`);
      res.status(200).json({ message: 'Trip assigned', trip: updated.rows[0] });

    } catch (serviceError) {
      console.error(`🚫 Service call error:`, serviceError.message);
      await client.query('ROLLBACK');
      return res.status(500).json({ error: `Service call failed: ${serviceError.message}` });
    }

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Assign Trip Error:", err.message || err);
    console.error("❌ Full error:", err);
    res.status(500).json({ error: `Error assigning trip: ${err.message}` });
  } finally {
    client.release();
    console.log(`🔓 Database connection released`);
  }
};

exports.completeTrip = async (req, res) => {
  const { tripId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Extract token from authorization header
    const token = extractToken(req.headers.authorization);

    const result = await client.query("SELECT driver_phone, status FROM trips WHERE id = $1", [tripId]);
    if (result.rows.length === 0 || result.rows[0].status !== 'assigned') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Trip not found or not assigned.' });
    }

    const driverPhone = result.rows[0].driver_phone;

    // Get driver ID by phone from user-service
    const userData = await callService(
      `${process.env.USER_SERVICE_URL}/id-by-phone/${driverPhone}`,
      token
    );
    const driverId = userData.id;

    // Mark trip completed locally
    await client.query("UPDATE trips SET status = 'completed' WHERE id = $1", [tripId]);

    // Mark driver available in driver-service
    const statusResponse = await fetch(`${process.env.DRIVER_SERVICE_URL}/api/drivers/status/${driverId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'available' })
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error(`❌ Failed to update driver status: ${statusResponse.status} ${errorText}`);
      throw new Error(`Failed to update driver status: ${statusResponse.status} ${errorText}`);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Trip completed.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Complete Trip Error:", err.message || err);
    res.status(500).json({ error: `Error completing trip: ${err.message}` });
  } finally {
    client.release();
  }
};
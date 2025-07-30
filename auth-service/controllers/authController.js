const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const otpGenerator = require('otp-generator');
const { sendOTP } = require('../utils/sendOtpWithVonage');
const axios = require('axios');
require('dotenv').config();


exports.signup = async (req, res) => {
  const { phone, password, role, service_type, name } = req.body;


  if (!phone || !role) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  if (role == 'admin' || role == 'driver') {
    if (!password) {
      return res.status(400).json({ error: "Password is required for admin." });
    }
  }


  if (role === 'driver' && !service_type) {
    return res.status(400).json({ error: "service_type is required for drivers." });
  }

  const newUserId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      "INSERT INTO users (id, phone, password, role) VALUES ($1, $2, $3, $4)",
      [newUserId, phone, hashedPassword, role]
    );

    if (role === 'driver') {
      await axios.post(`${process.env.DRIVER_SERVICE_URL}/api/driver`, {
        user_id: newUserId,
        phone,
        name: name || `Driver-${phone}`,
        service_type,
        status: "available"
      });
    }

    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error." });
  }
};

exports.login = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Phone are required.' });
  }
  try {
    const result = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = result.rows[0];


    if (user.role === "admin" || user.role === "driver") {

      if (!password) {
        return res.status(400).json({ error: "Password is required." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Incorrect password." });
      }

      const token = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return res.status(200).json({ message: "Login successful", token });
    } else {
      const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

      await pool.query(
        "UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE phone = $3",
        [otp, expiresAt, phone]
      );
      console.log(`OTP to send: ${otp}`);
      const sent = await sendOTP(phone, otp);
      if (!sent) {
        return res.status(500).json({ error: "Failed to send OTP." });
      }

      return res.status(200).json({ message: "OTP sent successfully." });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error." });
  }
};
const { callService } = require('../utils/serviceClient');

exports.getUserInfo = async (req, res) => {
  try {
    const userInfo = await callService(`${process.env.USER_SERVICE_URL}/${req.user.id}`, req.headers.authorization);
    res.json(userInfo);
  } catch (err) {
    res.status(500).json({ error: "Failed to get user info" });
  }
};


exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required." });
  }
  try {
    const result = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = result.rows[0];
    if (user.otp_code !== otp || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    await pool.query("UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE phone = $1", [phone]);

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Server error during OTP verification." });
  }
};

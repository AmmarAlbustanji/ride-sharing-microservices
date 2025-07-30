const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { authenticateToken } = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();


router.use(
  "/api/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
  })
);

// 🚗 Trip service — REWRITE to /trip
router.use(
  "/api/trip",
  createProxyMiddleware({
    target: process.env.TRIP_SERVICE_URL,
    changeOrigin: true,
  
})
);

// 🧑 Driver service — strip prefix
router.use(
  "/api/drivers",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.DRIVER_SERVICE_URL,
    changeOrigin: true,
  })
);

// 👤 User service — strip prefix
router.use(
  "/api/users",
  authenticateToken,
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
  })
);

module.exports = router;

const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Auth Header:", authHeader);

  if (!authHeader) {
    console.log("Missing Authorization Header");
    return res.status(401).json({ error: "Token required." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.log("Missing Bearer token");
    return res.status(401).json({ error: "Token missing." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.status(403).json({ error: "Invalid token." });
    }
    req.user = user;
    console.log("Authenticated user:", user);
    next();
  });
};

module.exports = { authenticateToken };

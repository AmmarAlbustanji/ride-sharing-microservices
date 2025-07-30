const express = require("express");
const cors = require("cors");
const tripRoutes = require("./routes/tripRoutes");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("🧭 Trip-Service Received:", req.method, req.originalUrl);
  next();
});

// ✅ Mount at /trip
app.use("/", tripRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Trip Service running on http://localhost:${PORT}`);
});

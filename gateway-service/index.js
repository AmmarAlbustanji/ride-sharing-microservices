require("dotenv").config();
const express = require("express");
const proxyRoutes = require("./routes/proxyRoutes");

const app = express();
const PORT = 8000;

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.originalUrl}`);
  next();
});

app.use(proxyRoutes); 

app.listen(PORT, () => {
  console.log(`API Gateway running at http://localhost:${PORT}`);
});
